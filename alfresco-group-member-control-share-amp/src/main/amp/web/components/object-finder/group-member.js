if (typeof OOTB == undefined || !OOTB)
{
   var OOTB = {};
}

(function() {
    var Dom = YAHOO.util.Dom, Event = YAHOO.util.Event;

    OOTB.ObjectRenderer = function OOTBObjectRenderer_OOTBObjectRenderer(objectFinder) {
        OOTB.ObjectRenderer.superclass.constructor.call(this, objectFinder);
    }

    YAHOO.extend(OOTB.ObjectRenderer, Alfresco.ObjectRenderer, {
        /**
        * Creates UI controls
        *   Replaces the original picker webscript url for the custom one
        * @method _createControls
        */
        _createControls: function ObjectRenderer__createControls()
        {
            var me = this;

            // DataSource definition replacement
            var pickerChildrenUrl = Alfresco.constants.PROXY_URI + "api/forms/group-members-picker/" + this.options.itemFamily;

            this.widgets.dataSource = new YAHOO.util.DataSource(pickerChildrenUrl,
            {
                responseType: YAHOO.util.DataSource.TYPE_JSON,
                connXhrMode: "queueRequests",
                responseSchema:
                {
                    resultsList: "items",
                    metaFields:
                    {
                        parent: "parent"
                    }
                }
            });

            this.widgets.dataSource.doBeforeParseData = function ObjectRenderer_doBeforeParseData(oRequest, oFullResponse)
            {
                var updatedResponse = oFullResponse;

                if (oFullResponse)
                {
                    var items = oFullResponse.data.items;

                    // Crop item list to max length if required
                    if (me.options.maxSearchResults > -1 && items.length > me.options.maxSearchResults)
                    {
                        items = items.slice(0, me.options.maxSearchResults-1);
                    }

                    // Add the special "Create new" record if required
                    if (me.options.createNewItemUri !== "" && me.createNewItemId === null)
                    {
                        items = [{ type: IDENT_CREATE_NEW }].concat(items);
                    }

                    // Special case for tags, which we want to render differently to categories
                    var index, item;
                    for (index in items)
                    {
                        if (items.hasOwnProperty(index))
                        {
                            item = items[index];
                            if (item.type == "cm:category" && item.displayPath.indexOf("/categories/Tags") !== -1)
                            {
                                item.type = "tag";
                                // Also set the parent type to display the drop-down correctly. This may need revising for future type support.
                                oFullResponse.data.parent.type = "tag";
                            }
                        }
                    }

                    // Notify interested parties of the parent details
                    YAHOO.Bubbling.fire("parentDetails",
                    {
                        eventGroup: me,
                        parent: oFullResponse.data.parent
                    });

                    // we need to wrap the array inside a JSON object so the DataTable is happy
                    updatedResponse =
                    {
                        parent: oFullResponse.data.parent,
                        items: items
                    };
                }

                return updatedResponse;
            };

            // DataTable column defintions
            var columnDefinitions =
            [
                { key: "nodeRef", label: "Icon", sortable: false, formatter: this.fnRenderItemIcon(), width: this.options.compactMode ? 10 : 26 },
                { key: "name", label: "Item", sortable: false, formatter: this.fnRenderItemName() },
                { key: "add", label: "Add", sortable: false, formatter: this.fnRenderCellAdd(), width: 16 }
            ];

            var initialMessage = this.msg("form.control.object-picker.items-list.loading");
            if (this._inAuthorityMode())
            {
                initialMessage = this.msg("form.control.object-picker.items-list.search");
            }

            this.widgets.dataTable = new YAHOO.widget.DataTable(this.id + "-results", columnDefinitions, this.widgets.dataSource,
            {
                renderLoopSize: 100,
                initialLoad: false,
                MSG_EMPTY: initialMessage
            });

            // Rendering complete event handler
            this.widgets.dataTable.subscribe("renderEvent", function()
            {
                if (this.options.createNewItemUri !== "")
                {
                    if (!this.widgets.enterListener)
                    {
                        this.widgets.enterListener = new KeyListener(this.createNewItemId,
                        {
                            keys: KeyListener.KEY.ENTER
                        },
                        {
                            fn: function ObjectRenderer__createControls_fn(eventName, keyEvent, obj)
                            {
                                // Clear any previous autocomplete timeout
                                if (this.autocompleteDelayId != -1)
                                {
                                    window.clearTimeout(this.autocompleteDelayId);
                                }
                                this.onCreateNewItem();
                                Event.stopEvent(keyEvent[1]);
                                return false;
                            },
                            scope: this,
                            correctScope: true
                        }, YAHOO.env.ua.ie > 0 ? KeyListener.KEYDOWN : "keypress");
                        this.widgets.enterListener.enable();
                    }

                    me.autocompleteDelayId = -1;
                    Event.addListener(this.createNewItemId, "keyup", function(p_event)
                    {
                        var sQuery = this.value;

                        // Filter out keys that don't trigger queries
                        if (!Alfresco.util.isAutocompleteIgnoreKey(p_event.keyCode))
                        {
                            // Clear previous timeout
                            if (me.autocompleteDelayId != -1)
                            {
                                window.clearTimeout(me.autocompleteDelayId);
                            }
                            // Set new timeout
                            me.autocompleteDelayId = window.setTimeout(function()
                            {
                                YAHOO.Bubbling.fire("refreshItemList",
                                {
                                    eventGroup: me,
                                    searchTerm: sQuery
                                });
                            }, 500);
                        }
                    });

                    Dom.get(this.createNewItemId).focus();
                }
            }, this, true);

            // Hook add item action click events (for Compact mode)
            var fnAddItemHandler = function ObjectRenderer__createControls_fnAddItemHandler(layer, args)
            {
                var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "div");
                if (owner !== null)
                {
                    var target, rowId, record;

                    target = args[1].target;
                    rowId = target.offsetParent;
                    record = me.widgets.dataTable.getRecord(rowId);
                    if (record)
                    {
                        YAHOO.Bubbling.fire("selectedItemAdded",
                        {
                            eventGroup: me,
                            item: record.getData(),
                            highlight: true
                        });
                    }
                }
                return true;
            };
            YAHOO.Bubbling.addDefaultAction("add-" + this.eventGroup, fnAddItemHandler, true);

            // Hook create new item action click events (for Compact mode)
            var fnCreateNewItemHandler = function ObjectRenderer__createControls_fnCreateNewItemHandler(layer, args)
            {
                var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "div");
                if (owner !== null)
                {
                    me.onCreateNewItem();
                }
                return true;
            };
            YAHOO.Bubbling.addDefaultAction("create-new-item-" + this.eventGroup, fnCreateNewItemHandler, true);

            // Hook navigation action click events
            var fnNavigationHandler = function ObjectRenderer__createControls_fnNavigationHandler(layer, args)
            {
                var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "div");
                if (owner !== null)
                {
                    var target, rowId, record;

                    target = args[1].target;
                    rowId = target.offsetParent;
                    record = me.widgets.dataTable.getRecord(rowId);
                    if (record)
                    {
                        YAHOO.Bubbling.fire("parentChanged",
                        {
                            eventGroup: me,
                            label: record.getData("name"),
                            nodeRef: record.getData("nodeRef")
                        });
                    }
                }
                return true;
            };
            YAHOO.Bubbling.addDefaultAction("parent-" + this.eventGroup, fnNavigationHandler, true);
        },
    });

    OOTB.GroupMemberObjectFinder = function OOTB_GroupMemberObjectFinder(htmlId, currentValueHtmlId) {
        OOTB.GroupMemberObjectFinder.superclass.constructor.call(this, htmlId, currentValueHtmlId);

        this.options.objectRenderer = new OOTB.ObjectRenderer(this);

        // Re-register with our own name
        this.name = "OOTB.GroupMemberObjectFinder";
        Alfresco.util.ComponentManager.reregister(this);

        return this;
    };

    YAHOO.extend(OOTB.GroupMemberObjectFinder, Alfresco.ObjectFinder, {
        /*_inAuthorityMode : function ObjectFinder__inAuthorityMode() {
            if (this.options.itemFamily == "authority" || this.options.searchMode == "true") {
                return true;
            } else {
                return false;
            }
        }*/
    });
})();
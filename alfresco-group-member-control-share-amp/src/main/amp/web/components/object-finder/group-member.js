if (typeof OOTB == undefined || !OOTB)
{
   var OOTB = {};
}

(function() {
    var Dom = YAHOO.util.Dom, Event = YAHOO.util.Event;

    OOTB.GroupMemberObjectFinder = function OOTB_GroupMemberObjectFinder(htmlId, currentValueHtmlId) {
        OOTB.GroupMemberObjectFinder.superclass.constructor.call(this, htmlId, currentValueHtmlId);

        // Re-register with our own name
        this.name = "OOTB.GroupMemberObjectFinder";
        Alfresco.util.ComponentManager.reregister(this);

        return this;
    };

    /*YAHOO.extend(OOTB.GroupMemberObjectFinder, Alfresco.ObjectFinder, {
        _inAuthorityMode : function ObjectFinder__inAuthorityMode() {
            if (this.options.itemFamily == "authority" || this.options.searchMode == "true") {
                return true;
            } else {
                return false;
            }
        }
    });*/
})();
# alfresco-group-member-control
Custom form control that allows you to select users only from a specific group

**How to use the addon**

In the sample configuration bellow, it's possible to see how to configure an assotiation to show only users from a specific group.
The sample attribute is bpm:assignee, configured to search for users only inside the ALFRESCO_ADMINISTRATORS group.

    <config evaluator="string-compare" condition="activiti$activitiAdhoc">
        <forms>
            <form>
                <field-visibility>
                    <show id="bpm:workflowDescription"/>
                    <show id="bpm:workflowDueDate"/>
                    <show id="bpm:workflowPriority"/>
                    <show id="bpm:assignee"/>
                    <show id="packageItems"/>
                    <show id="bpm:sendEMailNotifications"/>
                </field-visibility>
                <appearance>
                    <set id="" appearance="title" label-id="workflow.set.general"/>
                    <set id="info" appearance="" template="/org/alfresco/components/form/2-column-set.ftl"/>
                    <set id="assignee" appearance="title" label-id="workflow.set.assignee"/>
                    <set id="items" appearance="title" label-id="workflow.set.items"/>
                    <set id="other" appearance="title" label-id="workflow.set.other"/>
    
                    <field id="bpm:workflowDescription" label-id="workflow.field.message">
                        <control template="/org/alfresco/components/form/controls/textarea.ftl">
                            <control-param name="style">width: 95%</control-param>
                        </control>
                    </field>
                    <field id="bpm:workflowDueDate" label-id="workflow.field.due" set="info">
                        <control template="/org/alfresco/components/form/controls/date.ftl">
                            <control-param name="showTime">false</control-param>
                            <control-param name="submitTime">false</control-param>
                        </control>
                    </field>
                    <field id="bpm:workflowPriority" label-id="workflow.field.priority" set="info">
                        <control template="/org/alfresco/components/form/controls/workflow/priority.ftl"/>
                    </field>
                    <field id="bpm:assignee" label-id="workflow.field.assign_to" set="assignee">
                        <control template="/org/alfresco/components/form/controls/group-member.ftl">
                            <control-param name="startLocation">ALFRESCO_ADMINISTRATORS</control-param>
                        </control>
                    </field>
                    <field id="packageItems" set="items"/>
                    <field id="bpm:sendEMailNotifications" set="other">
                        <control template="/org/alfresco/components/form/controls/workflow/email-notification.ftl"/>
                    </field>
                </appearance>
            </form>
        </forms>
    </config>
    
**Currently only the assotiation for person objects is implemented/tested**
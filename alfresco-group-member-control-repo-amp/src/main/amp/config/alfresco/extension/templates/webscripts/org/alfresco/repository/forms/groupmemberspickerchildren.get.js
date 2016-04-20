<import resource="classpath:/alfresco/templates/webscripts/org/alfresco/repository/forms/pickerresults.lib.js">

function main()
{
   var argsFilterType = args['filterType'],
      argsSelectableType = args['selectableType'],
      argsSearchTerm = args['searchTerm'],
      argsMaxResults = args['size'],
      argsXPath = args['xpath'],
      argsRootNode = args['rootNode'],
      argsSelectableMimeType = args['selectableMimeType'],
      pathElements = url.service.split("/"),
      parent = null,
      rootNode = companyhome,
      results = [],
      categoryResults = null,
      resultObj = null,
      lastPathElement = null;
   
   if (logger.isLoggingEnabled())
   {
      logger.log("children type = " + url.templateArgs.type);
      logger.log("argsSelectableType = " + argsSelectableType);
      logger.log("argsFilterType = " + argsFilterType);
      logger.log("argsSearchTerm = " + argsSearchTerm);
      logger.log("argsMaxResults = " + argsMaxResults);
      logger.log("argsXPath = " + argsXPath);
      logger.log("argsSelectableMimeType = " + argsSelectableMimeType);
      logger.log("groupName = " + url.templateArgs.store_type);
   }
   try
   {
      // construct the NodeRef from the URL
      var groupName = "GROUP_" + url.templateArgs.groupName;

      // default to max of 100 results
      var maxResults = 100;
      if (argsMaxResults != null)
      {
         // force the argsMaxResults var to be treated as a number
         maxResults = parseInt(argsMaxResults, 10) || maxResults;
      }

      if (url.templateArgs.type == "authority")
      {
         if (argsSelectableType == "cm:person")
         {
            findUsers(groupName, argsSearchTerm, maxResults, results);
         }
         else if (argsSelectableType == "cm:authorityContainer")
         {
            findGroups(groupName, argsSearchTerm, maxResults, results);
         }
         else
         {
            // combine groups and users
            findGroups(groupName, argsSearchTerm, maxResults, results);
            findUsers(groupName, argsSearchTerm, maxResults, results);
         }
      }
      
      if (logger.isLoggingEnabled())
         logger.log("Found " + results.length + " results");
   }
   catch (e)
   {
      var msg = e.message;
      
      if (logger.isLoggingEnabled())
         logger.log(msg);
      
      status.setCode(500, msg);
      
      return;
   }

   model.parent = parent;
   model.rootNode = rootNode;
   model.results = results;
}

/* Sort the results by case-insensitive name */
function sortByName(a, b)
{
   return (b.properties.name.toLowerCase() > a.properties.name.toLowerCase() ? -1 : 1);
}

function findUsers(groupName, searchTerm, maxResults, results)
{
    var group = people.getGroup(groupName);

    // if group does not exist, does nothing
    if (!group)
        return;

    var personRefs = people.getMembers(group, true);
   
    // create person object for each result
    for each(var personRef in personRefs)
    {
        if (logger.isLoggingEnabled())
            logger.log("found personRefs = " + personRefs);

        var daname = (personRef.properties.userName != null) ? personRef.properties.userName : "";
        var firstName = (personRef.properties.firstName != null) ? personRef.properties.firstName : "";
        var lastName = (personRef.properties.lastName != null) ? personRef.properties.lastName : "";
        var middleName = (personRef.properties.middleName != null) ? personRef.properties.middleName : "";

        // includes only users containing the searchTerms in the userName, firstName, lastName or middleName
        // all comparisons done using lower case
        if (daname.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1 ||
            firstName.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1 ||
            lastName.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1 ||
            middleName.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1) {

            //filter out the disabled users
            if(people.isAccountEnabled(daname)){
                results.push(
                {
                    item: createPersonResult(personRef),
                    selectable: true
                });
            }
            else{
                results.push(
                {
                    item: createPersonResult(personRef),
                    selectable: false
                });
                if (logger.isLoggingEnabled())
                    logger.log("User not added to results not enabled" + daname);
            }
        }
    }
}

function findGroups(searchTerm, maxResults, results)
{
   if (logger.isLoggingEnabled())
      logger.log("Finding groups matching pattern: " + searchTerm);
   
   var paging = utils.createPaging(maxResults, 0);
   var searchResults = groups.getGroupsInZone(searchTerm, "APP.DEFAULT", paging, "displayName");
   for each(var group in searchResults)
   {
      if (logger.isLoggingEnabled())
         logger.log("found group = " + group.fullName);
         
      // add to results
      results.push(
      {
         item: createGroupResult(group.groupNode),
         selectable: true 
      });
   }
   
   // sort the groups by name alphabetically
   if (results.length > 0)
   {
      results.sort(function(a, b)
      {
         return (a.item.properties.name < b.item.properties.name) ? -1 : (a.item.properties.name > b.item.properties.name) ? 1 : 0;
      });
   }
}

main();
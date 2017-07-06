var utils = require('./client-side-utils.js');
var uiWdigetHelper = require('./ui-widget-helper.js');
var googleMapsHelper = require('./google-maps-helper.js');
var spanElementString = '<span id="present-count" class="ui-icon ui-icon-arrowthick-2-n-s">'+ '</span>';
var tableColumnIndex = new Object();
var previousSessionUserInformation = new Object();
var userInformation = new Object();
var buildingScoresList = [];

// The main javascript file containing all the jquery that is invoked from the HTML
 $(document).ready(function() {

   // Save filters
   $("#saveFilters").click(function(event){
     event.preventDefault();
     $.post("/saveFilters",userInformation,
       function(message){
      });
   });

   /*
   $('#filterForm').submit(function(e){
      e.preventDefault();
   });
   */

    //This method is called whenever the page is loaded
    $.get( "/getUserData",user,function( data ) {
       // Store the user's stored data to make sure we re-compute only if inputs have changed
       previousSessionUserInformation = jQuery.extend(true, {}, data.userInformation);
       userInformation = data.userInformation;
       var buildingScoresMap = data.personalizedBuildingScores;
       // Populate all the UI widgets on the screen
       uiWdigetHelper.populateFilters(data.userInformation.search_filters);
       uiWdigetHelper.populatePreferences(data.userInformation.preferences);
       uiWdigetHelper.populatePriorityOrderWidget(data.userInformation.preferences.priority_order.split(","));
       if(Object.keys(buildingScoresMap).length != 0 ){
         isUserNew = false;
         var li = document.createElement("li");
         var a = document.createElement('a');
         $(a).attr("href","javascript:void(0)").attr("id","searchResults").attr("onclick","openTab(event, 'searchResultsDiv')").text("Search Results").addClass("tablinks active");
         li.append(a);
         $('#tabList li:eq(0)').after(li);
         $('#userPreferences').removeClass("tablinks active");
         $('#userPreferences').addClass("tablinks");
         document.getElementById("searchResultsDiv").style.display = "block";
         buildingScoresList = utils.flattenMap(buildingScoresMap);
         uiWdigetHelper.initializeDataTable(buildingScoresList,tableColumnIndex, userInformation);
         if("mapViewFilter" in data.userInformation.search_filters.view_filters)
            googleMapsHelper.showMapsView(buildingScoresList,userInformation);
         else
            uiWdigetHelper.drawTable();
       } else {
         document.getElementById("userPreferencesDiv").style.display = "block";
       }
    });

  // Initialize all the UI widgets such as drop downs and sortable widgets
  uiWdigetHelper.initializeWidgets(referenceData,userInformation);

   $('#priority_order').sortable({
     start: function(event, ui) {
       ui.item.startPos = ui.item.index();
     },
     stop: function(event, ui) {
       //var startPosition = ui.item.startPos;
       //var endPosition = ui.item.index();
       var items = (document.getElementById("priority_order")).getElementsByTagName("li");
       // Reorder the sortable widget when the user drags and drops
       for(var i =0; i<5;i++) {
         var element = items[i];
         var elementKey = ((((element.innerHTML).replace(spanElementString,"")).trim()).split("["))[0];
         items[i].innerHTML = spanElementString+elementKey+" [Rank:"+(parseInt(i)+1)+"]";
      }

     }
   });

   $("#priority_order").disableSelection();

   // Actions for each filter
   $("#workCommuteTimeFilter").change(function() {
     userInformation["search_filters"]["text_filters"][$(this).attr("id")] = $(this).val();
     uiWdigetHelper.triggerEventFilter(buildingScoresList,userInformation);
   });
   $("#socialCommuteTimeFilter").change(function() {
     userInformation["search_filters"]["text_filters"][$(this).attr("id")] = $(this).val();
     uiWdigetHelper.triggerEventFilter(buildingScoresList,userInformation);
   });
   $("#sortFilter").change(function() {
     userInformation["search_filters"]["dropdown_filters"][$(this).attr("id")].value = $(this).val();
     userInformation["search_filters"]["dropdown_filters"][$(this).attr("id")].html = $("#sortFilter :selected").text();
     uiWdigetHelper.triggerSort(tableColumnIndex,buildingScoresList,userInformation);
   });
   $("#yelpReviewFilter").change(function() {
     userInformation["search_filters"]["text_filters"][$(this).attr("id")] = $(this).val();
     uiWdigetHelper.triggerEventFilter(buildingScoresList,userInformation);
   });
   $("#yelpRatingFilter").change(function() {
     userInformation["search_filters"]["dropdown_filters"][$(this).attr("id")].value = $(this).val();
     userInformation["search_filters"]["dropdown_filters"][$(this).attr("id")].html = $("#yelpRatingFilter :selected").text();
     uiWdigetHelper.triggerEventFilter(buildingScoresList,userInformation);
   });




   // Modify the data table based on filters
   $.fn.dataTable.ext.search.push(
     function( settings, data, dataIndex ) {

         var workCommuteTimeFilterValue = document.getElementById("workCommuteTimeFilter").value;
         var buildingWorkCommuteTime = data[tableColumnIndex['workCommuteTime']];
         if(parseInt(buildingWorkCommuteTime) > parseInt(workCommuteTimeFilterValue))
           return false;

         var socialCommuteTimeFilterValue = document.getElementById("socialCommuteTimeFilter").value;
         var buildingSocialCommuteTime = data[tableColumnIndex['socialCommuteTime']];
         if(parseInt(buildingSocialCommuteTime) > parseInt(socialCommuteTimeFilterValue))
           return false;



         var yelpReviewsFilterValue = document.getElementById("yelpReviewFilter").value;
         var buildingReviews = data[tableColumnIndex['review_count']];

         if(parseInt(buildingReviews) < parseInt(yelpReviewsFilterValue))
           return false;


         var ratingsFilterValue = document.getElementById("yelpRatingFilter").value;
         var buildingRatings = data[tableColumnIndex['rating']];
         if(parseInt(buildingRatings) < parseInt(ratingsFilterValue))
           return false;

         return true;

     }
 );

   // When user clicks search buildings
   $("#searchBuildings").click(function(event){
     event.preventDefault();
     var newPreferences = new Object();
     newPreferences.changedFields = [];
     // Validate the inputs entered by the user
     for(var i=0; i< referenceData.preferencesKeys.length; i++){
        var key = referenceData.preferencesKeys[i];
        if(!document.getElementById(key).value) {
            alert(referenceData.factorErrorMessageMap[key]);
            return false;
        }
        if(referenceData.autoCompleteFields.indexOf(key) != -1){
          var tokenArray = document.getElementById(key).value.split(",");

          if(referenceData.nationkeys.indexOf(tokenArray[tokenArray.length-1].trim()) == -1){
            alert(referenceData.factorErrorMessageMap[key]);
            return false;
          }
        }
        newPreferences[referenceData.preferencesKeys[i]] = document.getElementById(referenceData.preferencesKeys[i]).value;
     }
     newPreferences['priority_order'] = $("#priority_order").sortable( "toArray").toString();
     document.getElementById("loader").style.display = "block";
     // This is hard coded currently
     newPreferences.mode = (newPreferences.city === "San Francisco")?"driving":"transit";
     userInformation.preferences = newPreferences;
     //Trigger the post request
     $.post("/searchApartments",userInformation,
       function(data){
         document.getElementById("loader").style.display = "none";
         if(data.errorFlag) {
           uiWdigetHelper.populatePreferences(previousSessionUserInformation.preferences);
           // Incase of an error disable the user inputs till we fix it in the back end
           $("#work_commute").prop( "disabled", true );
           $("#city").prop( "disabled", true );
           alert(data.clientSideErrorText);
           return false;
         } else {
           // Delete the previous session information as this has been updated now
           previousSessionUserInformation = jQuery.extend(true, {}, userInformation);
           delete previousSessionUserInformation.preferences["changedFields"];
           buildingScoresList = utils.flattenMap(data);
           // Add the tab "search results"
           $('#searchResults').attr('onclick', "openTab(event, 'searchResultsDiv')");
           if(!document.getElementById("searchResults")) {
             var li = document.createElement("li");
             var a = document.createElement('a');
             $(a).attr("href","javascript:void(0)").attr("id","searchResults").attr("onclick","openTab(event, 'searchResultsDiv')").text("Search Results").addClass("tablinks active");
             li.append(a);
             $('#tabList li:eq(0)').after(li);
             $('#userPreferences').removeClass("tablinks active");
             $('#userPreferences').addClass("tablinks");
             document.getElementById("userPreferencesDiv").style.display = "none";
             document.getElementById("searchResultsDiv").style.display = "block";
           } else {
             document.getElementById("searchResults").click();
           }
           $("div.desc").hide();
           // Enable the UI filters
           utils.disableFilters(userInformation.search_filters,false);
           // initializeDataTable
           uiWdigetHelper.initializeDataTable(buildingScoresList,tableColumnIndex,userInformation);
           // Show the view accordingly
           if("mapViewFilter" in userInformation.search_filters.view_filters) {
             $("#mapDiv").show();
             googleMapsHelper.showMapsView(buildingScoresList,userInformation);
           } else {
             $("#listDiv").show();
             uiWdigetHelper.drawTable();
           }
         }
       });
   });

   // Trigger the different views based on the view filter
   $("input[name$='view']").click(function() {
        $("div.desc").hide();
        userInformation["search_filters"]["view_filters"] = new Object();
        userInformation["search_filters"]["view_filters"][$(this).attr("id")] = $(this).val();
        $(uiWdigetHelper.viewFilterMap[$(this).attr("id")]).show();
        if($(this).val() == "mapView") {
         googleMapsHelper.showMapsView(buildingScoresList,userInformation);
       } else {
         uiWdigetHelper.drawTable();
       }
    });


 });

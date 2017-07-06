// A simple javascript utility to perform UI related formatting functions

var googleMapsHelper = require('./google-maps-helper.js');
var utils = require('./client-side-utils.js');
var table = new Object();
var viewFilterMap = {
  listViewFilter : "#listDiv",
  mapViewFilter : "#mapDiv",
};

module.exports.viewFilterMap = viewFilterMap;
module.exports.drawTable = function(){
  table.draw();
}

// Common element to be used for the sortable widget
var spanElementString = '<span id="present-count" class="ui-icon ui-icon-arrowthick-2-n-s">'+ '</span>';

// Initialize the city and sort filter drop down with values from reference data
module.exports.initializeWidgets = function(referenceData) {
  Object.keys(referenceData.cities).filter(function(city){ return (city!="London");}).map(function(city){
    $('<option/>').val(city).html(city).appendTo('#city');
  });

  Object.keys(referenceData.sortFilterLabelMap).map(function(key){
    $('<option/>').val(referenceData.sortFilterLabelMap[key]).html(key).appendTo('#sortFilter');
  });
  $("#loader")[0].style.display = "none";

}

// If City is San Francisco, populate the label as Driving else it's public transportation
function populateModeLabel(city){
  switch(city){
    case "San Francisco":
      document.getElementById("mode").innerHTML = "Driving";
      break;
    case "":
      document.getElementById("mode").innerHTML = "None";
      break;
    default:
      document.getElementById("mode").innerHTML = "Public Transportation";
      break;
  }
}

// Populate the preferences
module.exports.populatePreferences = function(preferences) {

  for(key in preferences){
    if(key!="mode")
      document.getElementById(key).value = preferences[key];
    }
  //populateModeLabel(preferences.city);
}


// Populate all the UI filters
module.exports.populateFilters = function(filters) {
  for(key in filters.text_filters){
    document.getElementById(key).value = filters.text_filters[key];
  }
  for(key in filters.dropdown_filters){
    document.getElementById(key).value = filters.dropdown_filters[key].value;
    document.getElementById(key).html = filters.dropdown_filters[key].html;
  }
  for(key in viewFilterMap){
    if(key in filters.view_filters){
       document.getElementById(key).checked = "checked";
       $(viewFilterMap[key]).show();
     } else {
       $(viewFilterMap[key]).hide();
     }
  }
  $("#buildingDataDiv").hide();
}

// Trigger filters depending on the sort of view selected
module.exports.triggerEventFilter = function(buildingScoresList,userInformation) {
  if(document.getElementById("listViewFilter").checked) {
    table.draw();
  } else {
    googleMapsHelper.showMapsView(buildingScoresList,userInformation);
  }
}

// Trigger sort based on the sort of view selected
module.exports.triggerSort = function(tableColumnIndex,buildingScoresList,userInformation) {
  if(document.getElementById("listViewFilter").checked == true) {
    table.order(tableColumnIndex[document.getElementById("sortFilter").value], 'desc').draw();
  }else {
    googleMapsHelper.showMapsView(buildingScoresList,userInformation);
  }
}

// Populate the priority order widget with values
module.exports.populatePriorityOrderWidget = function(priorityOrderArray) {
  var ul = document.getElementById("priority_order");
  for(index in priorityOrderArray){
    var li = document.createElement("li");
    li.setAttribute("class", "ui-state-default");
    li.setAttribute("id", priorityOrderArray[index]);
    li.innerHTML =spanElementString+ referenceData.sortableWidgetLablesMap[priorityOrderArray[index]] + " [Rank:" + (parseInt(index)+1) +"]";
    ul.appendChild(li);
  }
}

// Show the building view which is highlighted when the user clicks on a building link on google maps
module.exports.showBuildingView = function(selectedBuilding,userInformation){
  utils.disableFilters(userInformation.search_filters, true);
  $("#listDiv").hide();
  $("#mapDiv").hide();
  $("#buildingDataDiv").show();
  utils.populateApartmentDetailsPage(selectedBuilding,userInformation);
  utils.populateYelpEntities(selectedBuilding);
  utils.populateGoogleEntities(selectedBuilding);
  googleMapsHelper.showBuildingMap(selectedBuilding);
}

// Initialize the data table on the search results screen.
module.exports.initializeDataTable = function(buildingDataForCity,tableColumnIndex, userInformation){
  utils.formatBuildingRecord(buildingDataForCity);
   $('#dataTable').dataTable( {
    destroy: true,
    "data": buildingDataForCity,
    "columns": [
      { title: "Description",
        className:'informationLink',
        name: "description",
        data: "description" ,
      },
      { title: "Name",
        name: "name",
        data: "name" ,
        visible: false,
      },
      {
        title: "Total Score",
        name: "totalScore",
        data: "totalScore",
        visible: false,
      },
      {
        title: "NightLife Score",
        name: "nightLifeScore",
        data: "nightLifeScore",
        visible: false,
      },
      {
        title: "WorkCommuteTime Score",
        name: "workCommuteScore",
        data: "workCommuteScore",
        visible: false,
      },
      {
        title: "Social Commute Time Score",
        name: "socialCommuteScore",
        data: "socialCommuteScore",
        visible: false,
      },
      {
        title: "Grocery Score",
        name: "groceryStoreScore",
        data: "groceryStoreScore",
        visible: false,
      },
      {
        title: "Gym Score",
        name: "gymScore",
        data: "gymScore",
        visible: false,
      },
      {
        title: "Rating",
        name: "rating",
        data: "rating",
        visible: false,
      },
      {
        title: "Review Count",
        name: "reviewCount",
        data: "review_count",
        visible: false,
      },
      {
        title: "Work Commute",
        name: "workCommuteTime",
        data: "work_commute",
        visible: false,
      },
      {
        title: "Social Commute",
        name: "socialCommuteTime",
        data: "social_commute",
        visible: false,
      },
    ],
   });

   table = $('#dataTable').DataTable();
   populateTableColumnIndex(tableColumnIndex, table);

   // Open up the building view along with a map when the user clicks on a row within the data table
   $('#dataTable tbody').on('click', 'td', function (e) {
      if(e.target.id != "buildingName")
        return;
      var selectedBuilding = table.row( $(this).parents('tr') ).data();
      utils.disableFilters(userInformation.search_filters, true);
      $("div.desc").hide();
      $("#buildingDataDiv").show();
      utils.populateApartmentDetailsPage(selectedBuilding,userInformation);
      utils.populateYelpEntities(selectedBuilding);
      utils.populateGoogleEntities(selectedBuilding);
      googleMapsHelper.showBuildingMap(selectedBuilding);

    } );
    table.order(tableColumnIndex[document.getElementById("sortFilter").value], 'desc').draw();
}

// Populate all the table columns in the data table
function populateTableColumnIndex (tableColumnIndex, table) {
  tableColumnIndex['totalScore'] = table.column('totalScore:name').index();
  tableColumnIndex['gymScore'] = table.column('gymScore:name').index();
  tableColumnIndex['nightLifeScore'] = table.column('nightLifeScore:name').index();
  tableColumnIndex['groceryStoreScore'] = table.column('groceryStoreScore:name').index();
  tableColumnIndex['workCommuteScore'] = table.column('workCommuteScore:name').index();
  tableColumnIndex['workCommuteTime'] = table.column('workCommuteTime:name').index();
  tableColumnIndex['rating'] = table.column('rating:name').index();
  tableColumnIndex['socialCommuteScore'] = table.column('socialCommuteScore:name').index();
  tableColumnIndex['socialCommuteTime'] = table.column('socialCommuteTime:name').index();
  tableColumnIndex['review_count'] = table.column('reviewCount:name').index();
}

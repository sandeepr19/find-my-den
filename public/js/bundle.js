(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var viewFilterMap = {
  listViewFilter : "#listDiv",
  mapViewFilter : "#mapDiv",
};

// Populate google entities i.e. grocery stores, train stations, bus stations
module.exports.populateGoogleEntities = function(selectedBuilding) {
  var array = ["grocery_or_supermarket", "train_station","bus_station" ];
  array.map(
    function(factor){
      var listOfNames = []
      selectedBuilding[factor].map(
        function(element){
          listOfNames.push(element.name);
        }
      );
      var unique = Array.from(new Set(listOfNames));
      unique = (unique.length>3)?unique.splice(0,2):unique;
      var text ="";
      unique.map(function(name){text+=name + ";"+"\t"; });
      document.getElementById(factor+"_text").innerHTML =text;
    }
  )
}

// Populate yelp entities i.e. bars, gyms on the apartment details page
module.exports.populateYelpEntities = function(selectedBuilding) {
  var array = ["bars", "gyms" ];
  for(index in array){
    var i =1;
    var entity = array[index];
    for(key in selectedBuilding[entity]){
      $("#"+entity+i).text(key);
      $("#"+entity+i).attr('href',selectedBuilding[entity][key]['url']);
      $("#"+entity+i).attr('class','search-results-href');
      if(i==3)
        break;
      i++;
    }
  }
}

// Flatten a map to a list
module.exports.flattenMap = function(buildingScoresMap) {
  var list = [];
  for(key in buildingScoresMap) {
    list.push(buildingScoresMap[key]);
  }
  return list;
}

// Can the record be filtered out i.e. false indicates yes and true indicates no
module.exports.doesRecordMeetCriteria = function(wrapper) {
  var workCommuteTimeFilterValue = document.getElementById("workCommuteTimeFilter").value;
  var buildingWorkCommuteTime = wrapper['work_commute'];
  if(parseInt(buildingWorkCommuteTime) > parseInt(workCommuteTimeFilterValue))
    return false;

  var socialCommuteTimeFilterValue = document.getElementById("socialCommuteTimeFilter").value;
  var buildingSocialCommuteTime = wrapper['social_commute'];
  if(parseInt(buildingSocialCommuteTime) > parseInt(socialCommuteTimeFilterValue))
    return false;


  var yelpReviewsFilterValue = document.getElementById("yelpReviewFilter").value;
  var buildingReviews = wrapper['review_count'];
  if(parseInt(buildingReviews) < parseInt(yelpReviewsFilterValue))
    return false;


  var ratingsFilterValue = document.getElementById("yelpRatingFilter").value;
  var buildingRatings = wrapper['rating'];
  if(parseInt(buildingRatings) < parseInt(ratingsFilterValue))
    return false;

  return true;
}

// Format the building record to be displayed as a row in the data table
module.exports.formatBuildingRecord = function(buildingData){
  buildingData.sort(function(a, b) {
    return parseInt(b.totalScore) - parseInt(a.totalScore);
  });

  var maxTotalScore = buildingData[0].totalScore;
  var minTotalScore = buildingData[buildingData.length -1].totalScore;

  var clonedArray = JSON.parse(JSON.stringify(buildingData))
  clonedArray.sort(function(a, b) {
    return parseInt(b.nightLifeScore) - parseInt(a.nightLifeScore);
  });
  var maxNightLifeScore = clonedArray[0].nightLifeScore;
  var minNightLifeScore = clonedArray[clonedArray.length -1].nightLifeScore;

  clonedArray.sort(function(a, b) {
    return parseInt(b.gymScore) - parseInt(a.gymScore);
  });
  var maxGymScore = clonedArray[0].gymScore;
  var minGymScore = clonedArray[clonedArray.length -1].gymScore;

  clonedArray.sort(function(a, b) {
    return parseInt(b.groceryStoreScore) - parseInt(a.groceryStoreScore);
  });
  var maxGroceryStoreScore = clonedArray[0].groceryStoreScore;
  var minGroceryStoreScore = clonedArray[clonedArray.length -1].groceryStoreScore;

  clonedArray.sort(function(a, b) {
    return parseInt(b.workCommuteScore) - parseInt(a.workCommuteScore);
  });
  var maxWorkCommuteScore = clonedArray[0].workCommuteScore;
  var minWorkCommuteScore = clonedArray[clonedArray.length -1].workCommuteScore;

  clonedArray.sort(function(a, b) {
    return parseInt(b.socialCommuteScore) - parseInt(a.socialCommuteScore);
  });
  var maxSocialCommuteScore = clonedArray[0].socialCommuteScore;
  var minSocialCommuteScore = clonedArray[clonedArray.length -1].socialCommuteScore;

  for(index in buildingData) {
    var buildingRecord = buildingData[index];
    var description = '<a href =\"javascript:void(0)\" id=\"buildingName\" class=\"search-results-href\">'+ buildingRecord["name"] + '</a>'+'<br />';
    description+= "Address:" + buildingRecord["address"]+'<br />';
    description+= "Yelp Rating:" + buildingRecord["rating"]+'<br />';
    description+= "Reviews Count:" + buildingRecord["review_count"]+'<br />';
    description+= "Total Score:" + ((10*(parseInt(buildingRecord["totalScore"])-parseInt(minTotalScore)))/(maxTotalScore-minTotalScore)).toFixed(2)+'&nbsp;&nbsp;&nbsp;&nbsp;';
    description+= "NightLife Score:" + ((10*(parseInt(buildingRecord["nightLifeScore"])-parseInt(minNightLifeScore)))/(maxNightLifeScore-minNightLifeScore)).toFixed(2)+'&nbsp;&nbsp;&nbsp;&nbsp;';
    description+= "Fitness Score:" + ((10*(parseInt(buildingRecord["gymScore"])-parseInt(minGymScore)))/(maxGymScore-minGymScore)).toFixed(2)+'&nbsp;&nbsp;&nbsp;&nbsp;';
    description+= "Grocery Store Score:" + ((10*(parseInt(buildingRecord["groceryStoreScore"])-parseInt(minGroceryStoreScore)))/(maxGroceryStoreScore-minGroceryStoreScore)).toFixed(2)+'<br />';

    description+= "Work Commute Score:" + ((10*(parseInt(buildingRecord["workCommuteScore"])-parseInt(minWorkCommuteScore)))/(maxWorkCommuteScore-minWorkCommuteScore)).toFixed(2)+'&nbsp;&nbsp;&nbsp;&nbsp;';
    description+= "Social Commute Score:" + ((10*(parseInt(buildingRecord["socialCommuteScore"])-parseInt(minSocialCommuteScore)))/(maxSocialCommuteScore-minSocialCommuteScore)).toFixed(2)+'&nbsp;&nbsp;&nbsp;&nbsp;';
    description+= "Work Commute Time:" + buildingRecord["work_commute"]+'mins'+'&nbsp;&nbsp;&nbsp;&nbsp;';
    description+= "Social Commute Time:" + buildingRecord["social_commute"]+'mins'+'&nbsp;&nbsp;&nbsp;&nbsp;';

    buildingRecord['description'] = description;
    buildingRecord.workCommuteScore = ("workCommuteScore" in buildingData[index])?buildingData[index].workCommuteScore:0;
    buildingRecord.socialCommuteScore = ("socialCommuteScore" in buildingData[index])?buildingData[index].socialCommuteScore:0;
    buildingRecord.work_commute = ("work_commute" in buildingData[index])?buildingData[index].work_commute:0;
    buildingRecord.social_commute = ("social_commute" in buildingData[index])?buildingData[index].social_commute:0;
  }
}

// Populate the apartment details page with all the required data
module.exports.populateApartmentDetailsPage = function(selectedBuilding,userInformation){
  document.getElementById("selectedBuildingName").innerHTML = selectedBuilding['name'];
  document.getElementById("selectedBuildingAddress").innerHTML = selectedBuilding['address'];
  document.getElementById("selectedBuildingClaimFlag").innerHTML = selectedBuilding["is_claimed"]?true:false;
  document.getElementById("selectedBuildingSocialCommuteTime").innerHTML = selectedBuilding['social_commute'];
  document.getElementById("selectedBuildingWorkCommuteTime").innerHTML = selectedBuilding['work_commute'];
  document.getElementById("selectedBuildingReviews").innerHTML = selectedBuilding['review_count'];
  document.getElementById("selectedBuildingRating").innerHTML = selectedBuilding['rating'];
  document.getElementById("workAddress").innerHTML = userInformation.preferences['work_commute'];
  document.getElementById("socialAddress").innerHTML = userInformation.preferences['social_commute'];


}

// Disable all the UI filters on the screen
module.exports.disableFilters = function (searchFilters, isVisible) {
  if(isVisible) {
    $("#searchFiltersHeaderDiv").hide();
    $("#searchFiltersFormDiv").hide();
  } else {
    $("#searchFiltersHeaderDiv").show();
    $("#searchFiltersFormDiv").show();
  }
  /*
  for(key in searchFilters){
    for(nestedKey in searchFilters[key])
      $( "#"+nestedKey ).prop( "disabled", isVisible );
  }
  for(key in viewFilterMap)
    $( "#"+key ).prop( "disabled", isVisible );

  */
}

},{}],2:[function(require,module,exports){
// The javascript functionality required to deal with all the google maps widgets on the UI

var utils = require('./client-side-utils.js');
var uiWdigetHelper = require('./ui-widget-helper.js');


// Show all the search results on a map view
module.exports.showMapsView = function(buildingScoresList,userInformation) {
  var address = document.getElementById("city").value;
  var map = new google.maps.Map(document.getElementById('mapDiv'), {
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      zoom: 13,
      scrollwheel:  false
  });
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({'address': address},
    function(results, status) {
     if(status == google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
        var marker, i;
        buildingScoresList.sort(function(a, b) {
          return parseFloat(b[document.getElementById("sortFilter").value]) - parseFloat(a[document.getElementById("sortFilter").value]);
        });
        var labelIndex = 0;
        for (i = 0; i < buildingScoresList.length; i++) {
          if(!utils.doesRecordMeetCriteria(buildingScoresList[i]))
            continue;

          marker = new google.maps.Marker({
            position: new google.maps.LatLng(buildingScoresList[i]['latitudeLongitude'].latitude, buildingScoresList[i]['latitudeLongitude'].longitude),
            label: (++labelIndex).toString(),
            map: map
          });

          var infowindow = new google.maps.InfoWindow()
          google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
              var link = document.createElement('a');
              var linkText = document.createTextNode(buildingScoresList[i]["name"]);
              link.appendChild(linkText);
              link.setAttribute('class', 'search-results-href');
              link.href = "javascript:void(0)";
              link.onclick=function(){
                uiWdigetHelper.showBuildingView(buildingScoresList[i],userInformation);
              }
             infowindow.setContent(link);
             infowindow.open(map, marker);
           }
         })(marker, i));
       }
  }
});

}

// Populate the map for apartment detail page with all the details for each of the individual factors
module.exports.showBuildingMap = function(buildingData) {
  var map = new google.maps.Map(document.getElementById('BuildingMap'), {
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      zoom: 13,
      scrollwheel:  false
  });
  var address = buildingData['address'];
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({'address': address},
    function(results, status) {
     if(status == google.maps.GeocoderStatus.OK) {
        // Mark the building on the screen
        map.setCenter(new google.maps.LatLng(buildingData['latitudeLongitude'].latitude, buildingData['latitudeLongitude'].longitude));
        var marker;
        var buildingIcon = {
          url: "/img/house.png", // url
          scaledSize: new google.maps.Size(25, 25), // scaled size
          origin: new google.maps.Point(0,0), // origin
          anchor: new google.maps.Point(0, 0) // anchor
        };

        marker = new google.maps.Marker({
          position: new google.maps.LatLng(buildingData['latitudeLongitude'].latitude, buildingData['latitudeLongitude'].longitude),
          map: map
        });
        var infowindow = new google.maps.InfoWindow()
        google.maps.event.addListener(marker, 'click', (function(marker) {
          return function() {
           infowindow.setContent(buildingData["name"]);
           infowindow.open(map, marker);
         }
        })(marker));

        var workAddress = document.getElementById("work_commute").value;
        var workIcon = {
          url: "/img/work.png", // url
          scaledSize: new google.maps.Size(25, 25), // scaled size
          origin: new google.maps.Point(0,0), // origin
          anchor: new google.maps.Point(0, 0) // anchor
        };

        geocoder.geocode({'address': workAddress}, function ( results, status ) {
          if(status == google.maps.GeocoderStatus.OK) {
            marker = new google.maps.Marker({
              position: results[0].geometry.location,
              icon: workIcon,
              map: map
            });
            var infowindow = new google.maps.InfoWindow()
            google.maps.event.addListener(marker, 'click', (function(marker) {
              return function() {
               infowindow.setContent("Work Address");
               infowindow.open(map, marker);
             }
            })(marker));
          }
        });

        var socialAddress = document.getElementById("social_commute").value;
        var socialIcon = {
          url: "/img/social.png", // url
          scaledSize: new google.maps.Size(25, 25), // scaled size
          origin: new google.maps.Point(0,0), // origin
          anchor: new google.maps.Point(0, 0) // anchor
        };

        geocoder.geocode({'address': socialAddress}, function ( results, status ) {
          if(status == google.maps.GeocoderStatus.OK) {
            marker = new google.maps.Marker({
              position: results[0].geometry.location,
              icon: socialIcon,
              map: map
            });
            var infowindow = new google.maps.InfoWindow()
            google.maps.event.addListener(marker, 'click', (function(marker) {
              return function() {
               infowindow.setContent("Social Address");
               infowindow.open(map, marker);
             }
            })(marker));
          }
        });


        var trainIcon = {
          url: "/img/rail.png", // url
          scaledSize: new google.maps.Size(20, 20), // scaled size
          origin: new google.maps.Point(0,0), // origin
          anchor: new google.maps.Point(0, 0) // anchor
        };

        for(key in buildingData["train_station"]){
          var latLongArray = buildingData["train_station"][key]['latitudeLongitude'].split(",");
          marker = new google.maps.Marker({
            position: new google.maps.LatLng(latLongArray[0], latLongArray[1]),
            icon:trainIcon,
            map: map
          });
          infowindow = new google.maps.InfoWindow();
          google.maps.event.addListener(marker, 'click', (function(marker, key) {
            return function() {
             infowindow.setContent(buildingData["train_station"][key]["name"]);
             infowindow.open(map, marker);
           }
         })(marker, key));

         if(key ==1)
          break;
        }

        var groceryStoreIcon = {
          url: "/img/convenience.png", // url
          scaledSize: new google.maps.Size(20, 20), // scaled size
          origin: new google.maps.Point(0,0), // origin
          anchor: new google.maps.Point(0, 0) // anchor
        };

        for(key in buildingData["grocery_or_supermarket"]){
          var latLongArray = buildingData["grocery_or_supermarket"][key]['latitudeLongitude'].split(",");
          marker = new google.maps.Marker({
            position: new google.maps.LatLng(latLongArray[0], latLongArray[1]),
            icon: groceryStoreIcon,
            map: map
          });
          infowindow = new google.maps.InfoWindow();
          google.maps.event.addListener(marker, 'click', (function(marker, key) {
            return function() {
             infowindow.setContent(buildingData["grocery_or_supermarket"][key]["name"]);
             infowindow.open(map, marker);
           }
         })(marker, key));

         if(key ==2)
          break;
        }

        var barIcon = {
          url: "/img/bar.png", // url
          scaledSize: new google.maps.Size(20, 20), // scaled size
          origin: new google.maps.Point(0,0), // origin
          anchor: new google.maps.Point(0, 0) // anchor
        };

        var i =0;
        for(key in buildingData["bars"]){
          var coordinateObject = buildingData["bars"][key]['location']['coordinate'];
          marker = new google.maps.Marker({
            position: new google.maps.LatLng(coordinateObject['latitude'], coordinateObject['longitude']),
            icon:barIcon,
            map: map
          });
          infowindow = new google.maps.InfoWindow();
          google.maps.event.addListener(marker, 'click', (function(marker,key) {
            return function() {
             infowindow.setContent(key);
             infowindow.open(map, marker);
           }
         })(marker,key));
         if(i ==2)
          break;
         i++;
        }

        var gymIcon = {
          url: "/img/gym.png", // url
          scaledSize: new google.maps.Size(20, 20), // scaled size
          origin: new google.maps.Point(0,0), // origin
          anchor: new google.maps.Point(0, 0) // anchor
        };

        var i =0;
        for(key in buildingData["gyms"]){
          var coordinateObject = buildingData["gyms"][key]['location']['coordinate'];
          marker = new google.maps.Marker({
            position: new google.maps.LatLng(coordinateObject['latitude'], coordinateObject['longitude']),
            icon:gymIcon,
            map: map
          });
          infowindow = new google.maps.InfoWindow();
          google.maps.event.addListener(marker, 'click', (function(marker,key) {
            return function() {
             infowindow.setContent(key);
             infowindow.open(map, marker);
           }
         })(marker,key));
         if(i ==2)
          break;
         i++;
        }
      }
  });
}

},{"./client-side-utils.js":1,"./ui-widget-helper.js":4}],3:[function(require,module,exports){
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

},{"./client-side-utils.js":1,"./google-maps-helper.js":2,"./ui-widget-helper.js":4}],4:[function(require,module,exports){
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

},{"./client-side-utils.js":1,"./google-maps-helper.js":2}]},{},[3]);

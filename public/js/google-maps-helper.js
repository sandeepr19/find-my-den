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

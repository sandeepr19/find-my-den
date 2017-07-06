/**
A helper class to perform basic transformations to different API input parameters
**/

var logger = require('../service/find-my-den-logger.js');
var config = require("../data/config.js");
var cacheService = require("../util/commute-cache-utils.js");

// build the input required for yelp API
exports.buildYelpApiInput = function(category,address){
  var yelpApiInputParameters = config.yelpConfig.yelpApiInputParameters;
  yelpApiInputParameters['category_filter'] = category;
  yelpApiInputParameters['location'] = address;
  return yelpApiInputParameters;
}

// build the input required for google places search API
exports.buildGooglePlaceApiInput = function(category,buildingData){
  var googlePlaceSearchApiInputParameters = config.googleConfig.googlePlaceSearchApiInputParameters;
  googlePlaceSearchApiInputParameters['key'] = config.googleConfig.googleApiKeyMap[category];
  googlePlaceSearchApiInputParameters['type'] = category;
  googlePlaceSearchApiInputParameters['location'] = buildingData.latitudeLongitude.latitude + ","+ buildingData.latitudeLongitude.longitude;
  return googlePlaceSearchApiInputParameters;
}

// build the input required for google distance matrix API
exports.buildGoogleDistanceApiInput = function(destinationAddressList, preferences, factor){
  var googleDistanceApiInputParameters = config.googleConfig.googleDistanceApiInputParameters;
  googleDistanceApiInputParameters['destinations'] = destinationAddressList;
	googleDistanceApiInputParameters['origins'] = [];
  googleDistanceApiInputParameters['origins'].push(preferences[factor]);
  googleDistanceApiInputParameters['mode'] = preferences['mode'];
  return googleDistanceApiInputParameters;
}

// extract all the parameters from the output of the yelp request and build a decorated wrapper with the required information for the user
exports.buildBuildingWrapperFromYelpOutput = function(inputBuildingWrapper){
  var decoratedBuildingWrapper = new Object();
  decoratedBuildingWrapper.name = inputBuildingWrapper.name;
  decoratedBuildingWrapper.is_claimed = inputBuildingWrapper.is_claimed;
  decoratedBuildingWrapper.image_url = inputBuildingWrapper.image_url;
  decoratedBuildingWrapper.address = inputBuildingWrapper.location.display_address.toString();
  decoratedBuildingWrapper.latitudeLongitude = inputBuildingWrapper.location.coordinate;
  decoratedBuildingWrapper.review_count = inputBuildingWrapper.review_count;
  decoratedBuildingWrapper.rating = inputBuildingWrapper.rating;
  decoratedBuildingWrapper.display_phone = inputBuildingWrapper.display_phone;
  decoratedBuildingWrapper.categories = inputBuildingWrapper.categories;
  return decoratedBuildingWrapper;
}

// Make sure that the building object obtained from Yelp has "apartments" category
exports.isRealBuilding = function(inputBuildingWrapper){
  for(var i = 0; i < inputBuildingWrapper.categories.length; i++) {
    if(inputBuildingWrapper.categories[i].indexOf("apartments")>-1)
      return true;
  }
  return false;
}

// Batch apartments into lists of 25 as google maps distance matrix accepts 25 desitnations together
exports.createBatchOfElements = function(listOfBuildings){
  var googleDistanceBatchWrapper = new Object();
  if(listOfBuildings.length >25){
    googleDistanceBatchWrapper[0] = listOfBuildings.slice(0,25);
    googleDistanceBatchWrapper[1] = listOfBuildings.slice(25,listOfBuildings.length);
  } else {
    googleDistanceBatchWrapper[0] = listOfBuildings;
  }
  return googleDistanceBatchWrapper;
}

// Populate the commute score cache
exports.populateCommuteScoreCache = function(scoresForCity,commuteScoreCacheKey,factor) {
  var commuteScoreValue = new Object();
  for(buildingName in scoresForCity){
    var building = scoresForCity[buildingName];
    var buildingCommuteScoreWrapper = new Object();
    buildingCommuteScoreWrapper.value = building[factor];
    buildingCommuteScoreWrapper.score = building[config.nonPeriodicUpdateFactorMap[factor]];
    commuteScoreValue[building.address]=buildingCommuteScoreWrapper;
  }
  logger.info("Commute score cache has been updated");
  cacheService.put(commuteScoreCacheKey,commuteScoreValue);
}

// Sample the buildings obtained by Yelp to make sure we don't exceed more than 50 results for a city
exports.sampleBuildings = function(buildingsForCity){
  for(city in buildingsForCity){
    var buildings = buildingsForCity[city];
    buildings.sort(function(a, b) {
      return parseInt(b.rating*b.review_count) - parseInt(a.rating*a.review_count);
    });
    if(buildings.length >= 50)
      buildingsForCity[city] = buildings.slice(0,50);
    else
      buildingsForCity[city] = buildings;

    logger.info("Total number of buildings for " + city + " is " + buildingsForCity[city].length);
    // Only for testing
    //buildingsForCity[city] = buildings.slice(0,2);
  }
}

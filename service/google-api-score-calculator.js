var async = require("async");
var helper = require('../util/server-side-utils.js');
var config = require("../data/config.js"),
s3Config = config.s3Config;
oauthSignature = require('oauth-signature'),
request = require('request'),
qs = require('querystring'),
_ = require('lodash');

var periodicUpdateFactorMap = config.periodicUpdateFactorMap;
var nonPeriodicUpdateFactorMap = config.nonPeriodicUpdateFactorMap;

var googleConfig = config.googleConfig;
var s3Utils = require('../lib/s3-lib.js');
googleDistanceLib = require('../lib/google-distance-lib.js');
googlePlaceSearchLib = require('../lib/google-place-search-lib.js');
var logger = require('./find-my-den-logger.js');

/**
This method is used to process all the scores relevant to the google places search API
It is used to compute the scores for the factors of grcoery stores, bus stations and train stations within a walking radius of "900" for a given building
The score for each factor is purely the number of businesses returned
**/

exports.processGooglePlacesApiScores = function(category, buildingWrapper, callback) {
	var googlePlaceSearchApiInputParameters = helper.buildGooglePlaceApiInput(category,buildingWrapper);
	googlePlaceSearchLib.requestGooglePlaceSearch(googlePlaceSearchApiInputParameters, function(outputData){
		var businessArray = [];
 		for (var i = 0; i < outputData.results.length; i++) {
 			var placeWrapper =  new Object();
 			var business = outputData.results[i];
      placeWrapper['name'] = business['name'];
 			placeWrapper['rating'] = business['rating'];
 			placeWrapper['address'] = business['vicinity'];
			var locationObject = business["geometry"]["location"];
			placeWrapper['latitudeLongitude'] = locationObject.lat+","+locationObject.lng;
			businessArray.push(placeWrapper);
 			if(i==3)
 				break;
 		}
 		buildingWrapper[category] = businessArray;
		buildingWrapper[config.periodicUpdateFactorMap[category]]=outputData.results.length;
		callback(true);
 	});
}

/**
This method uses the google distance matrix api to find the commute time between 2 addresses for the factors of
The input is of the following format
origin : origin_address
destinations : an array of 25 addresses

For a given building and address,
	Formula for computing score is 240/ [duration taken to get from address to building]
**/
exports.processGoogleDistanceBatch = function(googleDistanceBatchWrapper, addressBuildingMap, buildingsStoredForUser, preferences,isPeriodic, nonPeriodicFactor, callback){
	var errorObject = new Object();
	errorObject.errorFlag = false;
	async.each(Object.keys(config.nonPeriodicUpdateFactorMap), function(factor, nestedAsync){
			if(!isPeriodic && factor != nonPeriodicFactor){
				nestedAsync();
			} else {
				async.each(Object.keys(googleDistanceBatchWrapper),function(index, next) {
						var googleDistanceApiInputParameters = helper.buildGoogleDistanceApiInput(googleDistanceBatchWrapper[index],preferences,factor);
						googleDistanceLib.requestCommuteTime(factor, isPeriodic, googleDistanceApiInputParameters, function(error,outputData){
							if(error){
								errorObject.clientSideErrorText = config.clientSideErrorText.google_distance_matrix_error;
								errorObject.emailErrorText = "google_distance_matrix_error";
								errorObject.errorFlag = true;
								errorObject.emailErrorBody = outputData + "\n" + googleDistanceApiInputParameters;
								next();
							} else {
								// Each element in the output data indicates the building in the list marked by the index "i".
								for(var i=0; i<outputData.length;i++){
									var durationArray = outputData[i]['duration'].trim().split(" ");
									var outputApartmentWrapper = new Object();
									var durationValue = 240;
									if(durationArray.length == 4) {
										durationValue = (durationArray[0] * 60) + durationArray[2];
									} else if (durationArray.length == 2) {
										durationValue = durationArray[0];
									}
									var buildingWrapper = addressBuildingMap[googleDistanceBatchWrapper[index][i]];
									buildingsStoredForUser[buildingWrapper.name] =buildingWrapper;
									buildingsStoredForUser[buildingWrapper.name][factor] = durationValue;
									buildingsStoredForUser[buildingWrapper.name][config.nonPeriodicUpdateFactorMap[factor]] = (240/ durationValue).toFixed(2);
								}
							 	next();
						 }
					});
			}, function (){
				nestedAsync();
			});
			}
	  }, function(){
				callback(errorObject,buildingsStoredForUser);
		});
}

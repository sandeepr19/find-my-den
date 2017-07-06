var async = require("async");
var helper = require('../util/server-side-utils.js');
var s3Utils = require("../lib/s3-lib.js");
var googleScoreCalculator = require('./google-api-score-calculator.js');
var config = require("../data/config.js"),
s3Config = config.s3Config;
oauthSignature = require('oauth-signature'),
request = require('request'),
qs = require('querystring'),
_ = require('lodash');
var cacheService = require('../util/commute-cache-utils.js');

var periodicUpdateFactorMap = config.periodicUpdateFactorMap;
var nonPeriodicUpdateFactorMap = config.nonPeriodicUpdateFactorMap;
var logger = require('./find-my-den-logger.js');

/**
This method is meant to compute all the personalized scores for all the buildings present in a given city for a given user.
The factors include
	=> Night Life : Copied from the master set present for the same city
	=> Grocery Stores : Copied from the master set present for the same city
	=> Bus Stations : Copied from the master set present for the same city
	=> Train Stations : Copied from the master set present for the same city
	=> Gyms : Copied from the master set present for the same city
	=> Commute to work : Computed for each user
	=> Commute to social point of interest : Computed for each user

**/
exports.computePersonalizedBuildingScoresPeriodic = function(cityBuildingMap, userDataWrapper, callback){
	var preferences = userDataWrapper.preferences;
	var buildingsStoredForUser  = userDataWrapper.buildingScores;
	var listOfBuildingAddreses  = [];
	var addressBuildingMap = new Object();
	var buildingsForCity = cityBuildingMap[preferences['city']];
	// For the same city as stored in the user's preferences
	buildingsForCity.map( function(building) {
		/* If building is present in the user's data set, just update the periodic factors from the master set for
			bars : "nightLifeScore",
			gyms : "gymScore",
			grocery_or_supermarket : "groceryStoreScore",
			train_station : "trainStationScore",
			bus_station : "busStationScore"

			Compute the total score while retaining the existing work commute and social commute scores for the user.
		*/
		if(building.name in buildingsStoredForUser){
			logger.info("Building data present for building "+ building.name);
			Object.keys(periodicUpdateFactorMap).map(
				function(factor){
					buildingsStoredForUser[building.name][factor] = building[factor];
					buildingsStoredForUser[building.name][periodicUpdateFactorMap[factor]] = building[periodicUpdateFactorMap[factor]];
				}
			);
			computeTotalScore(preferences, buildingsStoredForUser[building.name]);
		}
		// If the building is not present in the user's data set, store the building for computing the additional factors of work commute and social commute
		else {
			logger.info("Computing commute scores for building "+ building.name);
			listOfBuildingAddreses.push(building.address);
			addressBuildingMap[building.address] = building;
		}
	});

	//This means that there are new buildings that were added for a given city that were'nt existing for a given user before
	if(listOfBuildingAddreses.length >0){
		// Create a batch of addresses by making sure that we don't have more than 25 destinations [buildings] in one request
		var googleDistanceBatchWrapper = helper.createBatchOfElements(listOfBuildingAddreses);
		// Process the batch of addresses
		googleScoreCalculator.processGoogleDistanceBatch(googleDistanceBatchWrapper, addressBuildingMap, buildingsStoredForUser, preferences, true, null,
			function(error,buildingScoreOutput){
				// For each building in the output, compute the total score
				Object.keys(buildingScoreOutput).map( function(buildingName){computeTotalScore(preferences, buildingScoreOutput[buildingName]);});
				callback(buildingScoreOutput);
			});
	} else {
		callback(buildingsStoredForUser);
	}
}

/*
This is the method that is invoked by the user from the front end while using the website
This method does the following
	=> For each of the factors [work commute, social commute]
		=> Check if the factor has changed || city has changed,
			=> If yes, find the relevant scores from google
			=> If no, ignore the factor and don't update the score for that building
*/
exports.computePersonalizedBuildingScoresNonPeriodic = function(cache,userData,newPreferences,callback){
	var oldPreferences = userData.userInformation.preferences;
	var cityChange = (newPreferences.city != oldPreferences.city) ;
	var scoresForCity = (cityChange) ? cache.building.wrapper[newPreferences.city]:userData.personalizedBuildingScores;
	var errorObject = {errorFlag:false};
	var buildingKeys = Object.keys(scoresForCity);
	var factorsToBeComputed = {};

	// Populate from the commute score cache
	function populateFromCache(factor,scoresForCity){
		buildingKeys.map(function(element){
			var cacheKey = newPreferences.city + "|" + newPreferences[factor];
			var cachedObject = cacheService.get(cacheKey,scoresForCity[element].address);
			scoresForCity[element][factor] = cachedObject.value;
			scoresForCity[element][nonPeriodicUpdateFactorMap[factor]] = cachedObject.score;
		});
	}

	// Has city changed or has factor changed
	function hasFactorChanged(factor){
		return (cityChange || oldPreferences[factor] != newPreferences[factor]);
	}

	// Is factor not cached
	function isNotCached(factor){
		var cacheKey = newPreferences.city + "|" + newPreferences[factor];
		if(cacheService.isCacheHit(cacheKey)) {
			populateFromCache(factor,scoresForCity);
			return false;
		}
		return true;
	}

	// Filter out factors that have changed and are not cached
	Object.keys(nonPeriodicUpdateFactorMap).filter(hasFactorChanged).filter(isNotCached).map(
		function(factor) {
			factorsToBeComputed[factor] =  nonPeriodicUpdateFactorMap[factor];}
	);

	// For each of the factors obtained from the previous filter, compute the score
	async.each(Object.keys(factorsToBeComputed),function(factor, next) {
				var listOfBuildingAddreses  = [];
				var addressBuildingMap = new Object();
				for(building in scoresForCity){
					listOfBuildingAddreses.push(scoresForCity[building].address);
					addressBuildingMap[scoresForCity[building].address] = scoresForCity[building];
				}
				var googleDistanceBatchWrapper = helper.createBatchOfElements(listOfBuildingAddreses);
				googleScoreCalculator.processGoogleDistanceBatch(googleDistanceBatchWrapper, addressBuildingMap, scoresForCity, newPreferences, false, factor,
						function(error,buildingScoreOutput){
							errorObject = (error.errorFlag)?error:errorObject;
							if(!(error.errorFlag=== true)) {
								helper.populateCommuteScoreCache(scoresForCity,newPreferences.city+"|"+newPreferences[factor],factor);
							}
							next();
				});
	}, function() {
		Object.keys(scoresForCity).map( function(buildingName){computeTotalScore(newPreferences, scoresForCity[buildingName]);});
		callback(errorObject,scoresForCity)
 });
}

/**
For the given order of factors present in the user's stored preferences, multiply the score of the building for the given factor by the rank of the factor
i.e.
If user's preferences are [night life, grocery stores, gyms] then
For each building
	Final Score = [night life score] *3 + [grocery store score] *2 + [gym score] *1
**/
function computeTotalScore(preferences, buildingWrapper ){
	var priorityOrderArray = preferences['priority_order'].split(",");
	var totalScore =0;

	Object.keys(periodicUpdateFactorMap).filter(function(factor){ return (priorityOrderArray.indexOf(factor) >= 0);}).map(
		function(factor){
				totalScore+= (priorityOrderArray.length - priorityOrderArray.indexOf(factor) ) * (buildingWrapper[periodicUpdateFactorMap[factor]]);
		}
	);

	Object.keys(nonPeriodicUpdateFactorMap).filter(function(factor){return (priorityOrderArray.indexOf(factor) >= 0);}).map(
		function(factor){
				totalScore+= (priorityOrderArray.length - priorityOrderArray.indexOf(factor) ) * (buildingWrapper[nonPeriodicUpdateFactorMap[factor]]);
		}
	);

	buildingWrapper['totalScore'] = totalScore;
}

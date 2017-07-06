var config = require("../data/config.js");
var s3Config = config.s3Config;
var yelpConfig = config.yelpConfig;
var s3Utils = require("../lib/s3-lib.js");
var yelpUtils = require("../lib/yelp-lib.js");
var zipCodesForCity =  new Object();
var buildingsForCity = new Object();
var async = require("async");
var yelpScoreCalculator = require('./yelp-api-score-calculator.js');
var googleScoreCalculator = require('./google-api-score-calculator.js');
var apartmentScoreCalculator = require("./building-score-calculator.js");
var logger = require('../service/find-my-den-logger.js');
var helper = require('../util/server-side-utils.js');



/*
The entry point for all periodic updates for cities present on the back end
This method does the following
=> For every city passed in the input
  => Obtain all the apartments from Yelp for all the zip codes included for that city
  => Sample all the apartments to make sure we don't include more than 50 apartments for a given city, that are ranked by order of [rating * review count]
  => For each apartment, obtain the indivdiual factors of night life, bus stations, grocery stores, gyms and train stations
=> For every user,
  => Update the list of apartments from the master list for the given city
  => Update the work commute and social commute scores for each of those apartments

*/
exports.processBuildingData = function(cityArray,callback) {
  // Download the reference data from S3
  s3Utils.downloadDataFromS3({Bucket : s3Config.s3Bucket,Key : s3Config.keys.referenceData},
    function(output) {
      // Parse the list of cities and filters for apartments in each city
      var zipCodesForCity = JSON.parse(output.Body.toString()).cities;
      var filters = JSON.parse(output.Body.toString()).city_filters;
      // Filter out cities that don't match the input
      var citiesToBeProcessed = Object.keys(zipCodesForCity).filter(function(city){ return cityArray.indexOf(city) >= 0;});
      // Note that this is done in parallel for all cities
      async.each(citiesToBeProcessed,function(city, next) {
        logger.info("Periodic update of scores for city "+city);
        // Is building valid i.e. => Is it closed, is it a real estate service and if it lies in the same city [as the walking radius can tend to lie in different cities]
        function isBuildingValid(building){
          var invalidCityCheck = city in filters?filters[city].filter(function(element){return (building.location.display_address.toString().includes(element));}) : [];
          return !(("is_closed" in building && building.is_closed) || !helper.isRealBuilding(building) || invalidCityCheck.length >0 );
        };
        var filteredList = [];
        buildingsForCity[city] = [];
        var buildingNamesSet = new Object();
        // Make sure we're looking at a unique set of buildings for a given city
        function isBuildingUnique(building) {
          if(!buildingNamesSet[building.location.display_address.toString()]) {
            buildingNamesSet[building.location.display_address.toString()] = 1;
            return true;
          } else {
            return false;
          }
        }
        // For each zip code, obtain all the buildings from Yelp in parallel
        async.each(zipCodesForCity[city],function(zipCode, nextForNestedFunction) {
          logger.info("Processing zip code " + zipCode +" for city " + city);
          var yelpApiInputParameters =  JSON.parse(JSON.stringify(yelpConfig.yelpApiInputParametersForApartments));
          yelpApiInputParameters['location'] = zipCode;
          // Make sure each building is unique and valid
          yelpUtils.fetchBusinessData(yelpApiInputParameters, function(result){
            result.filter(isBuildingValid).filter(isBuildingUnique).map(
              function(building){
                filteredList.push(building);
              }
            );
            nextForNestedFunction();
          });
        }, function() {
            buildingsForCity[city].push.apply(buildingsForCity[city], filteredList);
            next();
        });
     }, function() {
       // Download the existing master set of buildings for each city from S3
       s3Utils.downloadDataFromS3({Bucket : s3Config.s3Bucket,Key :s3Config.keys.buildings },
         function(output) {
           var existingBuildingData = JSON.parse(output.Body.toString());
           // Sample the buildings in the current data set to make sure we're looking at the top 50 buildings only
           helper.sampleBuildings(buildingsForCity);
           // For each building, fetch the weight of individual factors from Yelp
           fetchBuildingScores(buildingsForCity, function(buildingScoresForCity)
           {
             // For each city present in the current data set, update the master data set present in S3 [i.e. only the city that was meant to be periodically updated]
             Object.keys(buildingsForCity).map(function(city){existingBuildingData[city] = buildingScoresForCity[city];});
             s3Utils.uploadDataToS3({Bucket:s3Config.s3Bucket , Key: s3Config.keys.buildings},{Key: s3Config.keys.buildings, Body: JSON.stringify(existingBuildingData)}, function(err, data) {
               logger.info("Building Data uploaded to S3 " + cityArray.toString());
             });
             // Download all the users present in S3
             s3Utils.downloadDataFromS3({Bucket : s3Config.s3Bucket,Key :s3Config.keys.userAccounts },
                 function(output) {
                   var users = Object.keys(JSON.parse(output.Body.toString()));
                   async.eachSeries(users,function(user, next) {
                     var userDataWrapper = new Object();
                     var filePath = s3Config.s3Bucket+"/"+s3Config.keys.userFolder+"/"+user;
                     // For each user, obtain the personalized building scores as well as user information
                     async.parallel([
                       function(dataFetchCallBack) {
                         s3Utils.downloadDataFromS3({Bucket : filePath,Key : s3Config.keys.userInformation},
                           function(output) {
                            userDataWrapper.preferences = (JSON.parse(output.Body.toString())).preferences;
                            dataFetchCallBack();
                           }
                         );
                       },
                       function(dataFetchCallBack) {
                         s3Utils.downloadDataFromS3({Bucket : filePath,Key : s3Config.keys.personalizedBuildingScores},
                           function(output) {
                            userDataWrapper.buildingScores = JSON.parse(output.Body.toString());
                             dataFetchCallBack();
                           }
                         );
                       }
                     ],function(err) {
                      // If the user doesn't have a city stored or has a different city than the input, ignore the user
                      if(userDataWrapper.preferences.city.length == 0 || cityArray.indexOf(userDataWrapper.preferences.city) < 0 ){
                        logger.info("Not computing scores for "+user);
                        next();
                      } else {
                      // Compute all the personalized scores for the user using the master data set for a given city
                      apartmentScoreCalculator.computePersonalizedBuildingScoresPeriodic(buildingScoresForCity,userDataWrapper,
                      function(result){
                          s3Utils.uploadDataToS3({Bucket:filePath , Key: s3Config.keys.personalizedBuildingScores},{Key: s3Config.keys.personalizedBuildingScores, Body: JSON.stringify(result)}, function(err, data) {
                            logger.info("Scores have been computed for "+user);
                            next();
                          });
                        });
                      }
                    });
                   }, function (){
                     logger.info("Processing has been completed for all users");
                     callback(buildingsForCity);
                   });
                 });
               });
             });
           });
         });
}

/**
This method does the following
=> For each of the factors in the periodic update map i.e. night life, grocery stores, gyms, train stations and bus stations
  => Find the weight of the building for that factor using Yelp and Google's API
  => The formula for calculation of individual scores is discussed later
**/
function fetchBuildingScores(buildingsForCity, callback) {
  var buildingScoresForCity = new Object();
  periodicUpdateFactorMap = config.periodicUpdateFactorMap;
  // Note that this score is fetched in sequence for each city and each factor
  async.eachSeries(Object.keys(buildingsForCity), function(city, next){
    buildingScoresForCity[city] = [];
    async.eachSeries(buildingsForCity[city], function(building, nextForNestedFunction){
      var decoratedBuildingWrapper = helper.buildBuildingWrapperFromYelpOutput(building);
      async.eachSeries(Object.keys(periodicUpdateFactorMap), function(factor, next){
        if(config.yelpApiFactors.indexOf(factor)>-1){
          yelpScoreCalculator.processYelpApiScores(factor,decoratedBuildingWrapper, function(flag){next();});
        } else {
          googleScoreCalculator.processGooglePlacesApiScores(factor,decoratedBuildingWrapper, function(flag){next();});
        }
      }, function(){
        buildingScoresForCity[city].push(decoratedBuildingWrapper);
        nextForNestedFunction();
      });
    }, function(){
      next();
    });
  }, function(){
    callback(buildingScoresForCity);
  });
}

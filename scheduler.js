
var buildingDataProcessor = require('./service/building-data-processor.js');
var winston = require('winston');
var logger = require('./service/find-my-den-logger.js');
// D.C , San Francisco, London, Manhattan, Jersey City, Hoboken, Seattle, Brooklyn
var cityArray = ["Seattle"];

/*
A scheduler that is called by AWS Lambda and periodically updates the scores for all the apartments as follows
Inputs: Cities[] : List of cities for which the scores need to be updated
Factors for which the scores are updated : Night Life Score, Gym Score, Grocery Store Score, Number of bus stations, Number of train stations
*/

// For testing purposes only

buildingDataProcessor.processBuildingData(cityArray, function(result){
  logger.info("Completed scheduled processing");
});


/*
Handler that is called by AWS Lambda
*/
exports.myHandler = function(event, context, callback) {
    buildingDataProcessor.processBuildingData(event.city, function(result){
      logger.info("Completed scheduled processing");
      callback(null, "some success message");
    });
  }

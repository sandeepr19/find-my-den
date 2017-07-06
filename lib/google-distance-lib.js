/**
 A library to request for the commute distance between 2 locations
 Format of the input is as follows

 {
  origin: '1 Harborside Pl, Jersey City, NJ 07311, United States',
  destination: '7 West, 34th Street, New York, NY 10001',
  mode: 'transit',
  transit_mode: 'subway'
  }

  Format of the output is as follows

  { index: null,
  distance: '6.4 km',
  distanceValue: 6351,
duration: '26 mins',
  durationValue: 1557,
  origin: '444 Washington Blvd, Jersey City, NJ 07310, USA',
  destination: '7 W 34th St, New York, NY 10001, USA',
  mode: 'transit',
  units: 'metric',
  language: 'en',
  avoid: null,
  sensor: false }
  Api reference: https://developers.google.com/maps/documentation/distance-matrix/
 *
 */

var config = require("../data/config.js");
var googleConfig = config.googleConfig;
var googleDistance = require('google-distance');
var throttleUtils = require('../util/google-maps-throttle-utils.js');
var logger = require('../service/find-my-den-logger.js');
var sleep = require('sleep');

exports.requestCommuteTime = function(factor,isPeriodic,googleDistanceApiInputParameters,
		callback) {
			try {
				// If it is periodic, then directly use the API key and don't worry about throttling
  			if(isPeriodic)
    			googleDistance.apiKey = config.googleConfig.googleApiKeyMap[factor];
				// If it is not periodic, throttle to make sure you don't exceed the per second limit of 100 requests
  			else
    			googleDistance.apiKey = throttleUtils.requestCommuteApiKey(factor,googleDistanceApiInputParameters);

    		googleDistance.get(googleDistanceApiInputParameters, function(error, data) {
      		if (error){
        		logger.error("An error occurred while obtaining the distance matrix api scores");
						logger.info(googleDistanceApiInputParameters);
        		logger.error(error);
        		callback(true,error);
      		} else {
						logger.info("Google distance matrix request successfully executed for ");
						logger.info(googleDistanceApiInputParameters);
        		callback(false,data);
      		}
    		});
  		} catch(err){
    		logger.info("An error occurred while obtaining the distance matrix api scores");
				logger.info(googleDistanceApiInputParameters);
    		callback(true,"Error: Google Distance api Quota exceeded ");
  		}
	};

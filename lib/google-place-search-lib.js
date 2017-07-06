/**
 * A library to find all the places of a given type around a particular location
 * API reference: https://developers.google.com/places/web-service/search
 */

var assert = require("assert");
var config = require("../data/config.js");
var googleConfig = config.googleConfig;
var querystring = require("querystring");
var https = require("https");
var sleep = require('sleep');
var logger = require('../service/find-my-den-logger.js');



/**
 Input format
 {
 key: 'api_key',
 location: 'latitude longitude',
 type: 'one of the valid types',
 radius: 'in metres',
 sensor: false }

 Output format : refer to API specs https://developers.google.com/maps/documentation/javascript/places#place_searches
 */

exports.requestGooglePlaceSearch = function(googlePlaceSearchInputParameters,
		callback) {
			// sleep for 1 second to throttle
			sleep.sleep(1);
			logger.info("Google place search being requested for ");
			logger.info(googlePlaceSearchInputParameters);
			var options = {
			hostname : "maps.googleapis.com",
			path : "/maps/api/place/search/" + googleConfig.outputFormat + "?"
				+ querystring.stringify(googlePlaceSearchInputParameters)
			};
			var request = https.request(options, function(response) {
				var responseData = "";
				response.on("data", function(chunk) {
					responseData += chunk;
				});
				response.on("end", function() {
					callback(JSON.parse(responseData));
				});
			});

			request.on('error', function(e) {
      	logger.error('There was an error with the google place search API request: ' + googlePlaceSearchInputParameters);
				logger.error(e.message);
  		});
			request.end();

};

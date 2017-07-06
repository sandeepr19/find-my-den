// A library to query yelp
var config = require("../data/config.js");
var yelpConfig = config.yelpConfig;
var yelp = require("node-yelp");
yelpClient = yelp.createClient({
	  oauth: yelpConfig.oauth,
	  httpClient: {
	    maxSockets: 25
	  }
});

var sleep = require('sleep');
var logger = require('../service/find-my-den-logger.js');


// Refer to API specs : https://www.yelp.com/developers/documentation/v2/overview
// Refer to the input for yelp api in config.js

exports.fetchBusinessData = function(yelpApiInputParameters, callback){
	// Always sleep for 1 second to avoid too many requests per second
	sleep.sleep(1);
	logger.info("Yelp API call requested for ");
	logger.info(yelpApiInputParameters);
  yelpClient.search(yelpApiInputParameters).then(function (outputData) {
		callback(outputData['businesses']);
  })
  .catch(function (err) {
		logger.error("An error occurred while calling the yelp api");
		logger.error(yelpApiInputParameters);
		logger.error(err);
  });

};

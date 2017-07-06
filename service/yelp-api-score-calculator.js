var async = require("async");
var helper = require('../util/server-side-utils.js');
var config = require("../data/config.js"),
s3Config = config.s3Config;
oauthSignature = require('oauth-signature'),
request = require('request'),
qs = require('querystring'),
_ = require('lodash');

var periodicUpdateFactorMap = config.periodicUpdateFactorMap;
var yelpConfig = config.yelpConfig;
var s3Utils = require('../lib/s3-lib.js');
var yelp = require("node-yelp");
yelpClient = yelp.createClient({
	  oauth: yelpConfig.oauth,
	  httpClient: {
	    maxSockets: 25
	  }
});
var logger = require('./find-my-den-logger.js');

/**
This method is used to fetch the yelp related scores for each building i.e. night life and gyms
The formula for computing the score is as follows
	=> For each building, find the top 40 businesses for each factor, sorted by rating and within a radius of 900 metres
	=> Factor score for building = Summation([review_count * rating] for each business)
Besides the score, also store the top 3 businesses for the user's viewing
**/
exports.processYelpApiScores = function(category, buildingWrapper, callback) {
	var yelpApiInputParameters = helper.buildYelpApiInput(category,buildingWrapper['address']);
	logger.info("Calling yelp api for " +category);
	yelpClient.search(yelpApiInputParameters).then(function (outputData) {
		var factorScore = 0;
		var listOfBusinesses = outputData['businesses'];
		for (var i = 0; i < listOfBusinesses.length; i++) {
			var business = listOfBusinesses[i];
			factorScore+= (business['review_count']*business['rating']);
		}
		var reviewWrapper = new Object();
		for (var i = 0; i < listOfBusinesses.length; i++) {
			var business = listOfBusinesses[i];
			var businessWrapper = new Object();
			businessWrapper['rating']=business['rating'];
			businessWrapper['location']=business['location'];
			businessWrapper['review_count']=business['review_count'];
			var urlArray = business['url'].split("?");
			businessWrapper['url'] = urlArray[0];
			reviewWrapper[business['name']] = businessWrapper
			if(i==3)
				break;
		}
		buildingWrapper[category] = reviewWrapper;
		buildingWrapper[config.periodicUpdateFactorMap[category]]=factorScore;
		logger.info("Yelp API successfully called for " + category);
		callback("Scores for " + category + " have been processed." );
	}).catch(function (err) {
		logger.error(err);
		logger.error("An error occurred while callign the yelp api for the input ");
		logger.error(yelpApiInputParameters);
		buildingWrapper[category] = {};
		buildingWrapper[config.periodicUpdateFactorMap[category]]=0;
		callback("Scores for " + category + " could not be been processed." )
  });
}

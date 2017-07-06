/*
A utility to help the server throttle all google distance matrix api requests.
Below are all the specifications for google's distance matrix API

=> The daily limit for using the API is 2500 requests
=> The limit for maximum number of requests per second is 100
*/

var config = require("../data/config.js");
var logger = require('../service/find-my-den-logger.js');
var sleep = require('sleep');

// Defining 5 API keys to find the work commute distance
var workCommuteGoogleDistanceApiKeyMap = {
    "" : {
      totalCount :2500,
      currentCount : 0,
    },
    "" : {
      totalCount :2500,
      currentCount : 0,
    },
    "" : {
      totalCount :2500,
      currentCount : 0,
    },
    "" : {
      totalCount :2500,
      currentCount : 0,
    },
    "" : {
      totalCount :2500,
      currentCount : 0,
    }
  };

// Defining 5 API keys to find the social commute distance
var socialCommuteGoogleDistanceApiKeyMap =
  {
    "" : {
      totalCount :2500,
      currentCount : 0,
    },
    "" : {
      totalCount :2500,
      currentCount : 0,
    },
    "" : {
      totalCount :2500,
      currentCount : 0,
    },
    "" : {
      totalCount :2500,
      currentCount : 0,
    },
    "" : {
      totalCount :2500,
      currentCount : 0,
    }
};

var apiKeyMap = {
  "work_commute" : workCommuteGoogleDistanceApiKeyMap,
  "social_commute" : socialCommuteGoogleDistanceApiKeyMap,
}


// Check if we've exhausted the request count for all the keys within a given api map
function isApiMapExhausted(apiMapForFactor,inputSize) {
  var object = Object.keys(apiMapForFactor).filter(
    function(element){
      return (apiMapForFactor[element].totalCount - inputSize  >= 0);
    }
  );
  return (object.length == 0);
}

/*
This method works as follows
If the API Map hasn't been exhausted for the concerned factor
  => Try to obtain the API key for the factor
  => If API key was obtained successfully, return it to the user
  => Else, wait for 2 seconds to be able to obtain the key
  Note that the below method assumes that node.js is inherently single threaded and hence the below logic
  would be thread safe.
else
  => Throw an error saying the Api Map has exhausted.
*/
exports.requestCommuteApiKey = function(factor,googleDistanceApiInputParameters) {
  var apiMapForFactor = apiKeyMap[factor];
  var inputSize = googleDistanceApiInputParameters.destinations.length;
  var apiKey;
  if(isApiMapExhausted(apiMapForFactor,inputSize)) {
    logger.info("Api key map has been exhausted for factor: " + factor);
    throw err;
  } else {
    var prevTimeStamp = new Date();
    apiKey = obtainApiKey(apiMapForFactor,inputSize);
    while(apiKey.length == 0){
      var currentTimeStamp = new Date();
      // If it has been more than 2 seconds since the last request, re-initialize the current count for each key
      if((currentTimeStamp-prevTimeStamp)/1000 > 2)
        Object.keys(apiMapForFactor).map(function(element){apiMapForFactor[element].currentCount=0;});
      apiKey = obtainApiKey(input);
      sleep.sleep(1);
    }
  }
  logger.info("Api key map was obtained for factor: " + factor);
  return apiKey;
}

/*
For each API key present in the API map for a given factor
  => Return the key if both of the below conditions are satisfied
    => The total number of requests for the API key after adding the current count is less than 2500 in the last 24 hours
    => The total number of requests currently being executed in the last second for the API key is less than 100
*/
function obtainApiKey(apiMapForFactor,inputSize){
  for(element in apiMapForFactor){
    if(apiMapForFactor[element].currentCount + inputSize < 100  && apiMapForFactor[element].totalCount - inputSize >=0 ) {
      apiMapForFactor[element].currentCount+=inputSize;
      apiMapForFactor[element].totalCount-=inputSize;
      return element;
    }
  }
  return "";
}

// Initialize the count for all the API keys for the two API factors every 24 hours.
exports.initializeGoogleDistanceMatrixRequestCountCache = function(){
  logger.info("Initializing the throttle cache for google distance matrix api");
  Object.keys(workCommuteGoogleDistanceApiKeyMap).map(
    function(key){
      workCommuteGoogleDistanceApiKeyMap[key].totalCount = 2500;
      workCommuteGoogleDistanceApiKeyMap[key].currentCount = 0;
    }
  );
  Object.keys(socialCommuteGoogleDistanceApiKeyMap).map(
    function(key){
      socialCommuteGoogleDistanceApiKeyMap[key].totalCount = 2500;
      socialCommuteGoogleDistanceApiKeyMap[key].currentCount = 0;
    }
  );

}

// Refresh the count for number of requests that have been fired in the last second for both the factors
exports.refreshPerSecondLimit = function(){
  Object.keys(workCommuteGoogleDistanceApiKeyMap).map(
    function(key){
      workCommuteGoogleDistanceApiKeyMap[key].currentCount = 0;
    }
  );
  Object.keys(socialCommuteGoogleDistanceApiKeyMap).map(
    function(key){
      socialCommuteGoogleDistanceApiKeyMap[key].currentCount = 0;
    }
  );
}

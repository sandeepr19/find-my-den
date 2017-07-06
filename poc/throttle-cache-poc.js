// A proof of concept to be able to throttle google distance matrix api
/*
const animals = ["fish","cat","dog","fish"];

var unique = Array.from(new Set(animals));
console.log(unique);

var element  = 3;
function studlyCaps(words, word) {
  return words + word;
}
function exactlyThree(word) {
  return (word.length === 1);
}
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
const threeLetterAnimals = animals
  .filter(exactlyThree)
  .map(capitalize);
console.log(threeLetterAnimals); // "CatDog"
*/


// A dummy script to prove throttling and sleeping
var cache = {
  key1 : {
    totalCount :65,
    currentCount : 0
  },
  key2 : {
    totalCount: 65,
    currentCount : 0
  },
  key3 : {
    totalCount: 65,
    currentCount : 0
  }
};
var CronJob = require('cron').CronJob;
var async = require("async");
var throttler = require('./util/google-maps-throttle-utils.js');
var logger = require('./service/find-my-den-logger.js');
var sleep = require('sleep');



var requestObject = {
  0: {
      0:25,
      1:25,
  },
  1: {
      0:22,
  },
  2: {
      0:21,
      1:20,
  },
  3: {
      0:21,
      1:20,
  },
  4: {
      0:21,
      1:20,
  },
  5: {
      0:21,
      1:20,
  }
}

//console.log(cache);


async.each(Object.keys(requestObject), function(key, next){
  async.each(Object.keys(requestObject[key]) , function(element,nestedNext){
    var output;
    var input = requestObject[key][element];
    if(isRequestCacheExhausted(input)) {
      logger.info(key+" "+element+" " + input);
      logger.info("exhausted...sorry");
      nestedNext();
    } else {
      logger.info(key+" "+element+" " + input);
      var prev = new Date();
      var output = obtainApiKey(input);
      while(output.length == 0){
        var now = new Date();
        if((now-prev)/1000 > 3)
          Object.keys(cache).map(function(element){cache[element].currentCount=0;});
        output = obtainApiKey(input);
        logger.info("waiting");
        sleep.sleep(1);
      }
      console.log(output +" "+ cache[output].currentCount+ " " + cache[output].totalCount);
      nestedNext();
    }
  }, function(){
    next();
  });
}, function(){
  console.log("done");
});



function dummyGoogleDistance(callback){
  setTimeout(function(key){
    logger.info(key);
    callback();
  }, 1000, key);
}


/*
var a = new Date();
logger.info("before sleep");
sleep.sleep(2);
logger.info("after sleep");
var b = new Date();
var difference = (b - a) / 1000;
logger.info(difference);
*/

function isRequestCacheExhausted(input) {
  var object = Object.keys(cache).filter(
    function(element){
      //console.log("checking");
      //console.log(cache[element].totalCount - parseInt(input) >= 0);
      return (cache[element].totalCount - parseInt(input) >= 0);
    }
  );
  return (object.length == 0);
}


function obtainApiKey(input){
  for(element in cache){
    if(cache[element].currentCount + parseInt(input) < 50  && cache[element].totalCount - parseInt(input) >=0 ) {
      cache[element].currentCount+=parseInt(input);
      cache[element].totalCount-=parseInt(input);
      return element;
    }
  }
  return "";
}

//console.log(requestObject);

var commuteScoreCache = new Object();
var logger = require('../service/find-my-den-logger.js');

/*
A cache to store the google distance matrix api scores for a given address and city

Format of cache is
[City|Address] => { Building Address :{score:x, value: y} }
*/

exports.put = function(key, value){
  commuteScoreCache[key] = value;
}

exports.refreshCache = function(){
  logger.info("Refreshing commute score cache");
  commuteScoreCache = new Object();
}

exports.get = function(key, nestedKey){
  return commuteScoreCache[key][nestedKey];
}

exports.isCacheHit = function(key){
  return (key in commuteScoreCache);
}

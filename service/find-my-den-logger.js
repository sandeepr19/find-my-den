// Logging service that prints out the time

var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({'timestamp':true})
    ]
});


var canLog = true;

exports.toggleLogger= function(value) {
  canLog = value;
}

exports.info = function(line){
  if(canLog=== true)
    logger.info(line) + "\n";
}

exports.error = function(line){
  if(canLog=== true)
    logger.error(line);
}

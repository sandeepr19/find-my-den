/**
 * A library to provide methods to upload and download data from an S3 bucket
 *  API reference: http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-examples.html
 */


var config = require("../data/config.js");
var s3Config = config.s3Config;
var AWS = require('aws-sdk');
AWS.config = s3Config.awsConfig;
var s3 = new AWS.S3();
var logger = require('../service/find-my-den-logger.js');

/**
 * A method to download data from S3
 * Input format
 * params: {Bucket : 'bucket_name', Key : ''key_name'}
 * Output format : JSON object
 */
exports.downloadDataFromS3 = function(params, callback) {
	s3.getObject(params, function(err, data) {
		if (err) {
			logger.error(err.stack);
			callback(null);
		} else {
			callback(data); // successful response
		}
	});

};

/**
 * A method to upload data to S3
 * Input format
 * bucketParams: {Bucket:'bucket_name' , Key: 'key_name'}
 * params: {Key: 'key', Body: JSON.stringify('data')}
 */
exports.uploadDataToS3 = function(bucketParams, params, callback){
	var s3Uploader = new AWS.S3({params: bucketParams});
	s3Uploader.upload(params, function(err,data){
		if (err) {
		      logger.error("Error uploading data: ", err.stack);
		    } else {
					callback(data);
				}
	});
};

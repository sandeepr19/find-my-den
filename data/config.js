// A config file that contains all the string constants and default config parameters
exports.userDataIdentifier = 'userData';
exports.radiusFilterStringIdentifier = 'walkingRadius';
exports.latitudeLongitudeString = "latitudeLongitudeString";

// Factors which require input from the user and are computed only when requested
exports.nonPeriodicUpdateFactorMap = {
	work_commute : "workCommuteScore",
	social_commute : "socialCommuteScore"
}

// Factors which do not require input from the user and can be periodically updated by the scheduler
exports.periodicUpdateFactorMap = {
	bars : "nightLifeScore",
	gyms : "gymScore",
	grocery_or_supermarket : "groceryStoreScore",
	train_station : "trainStationScore",
	bus_station : "busStationScore"
};

// All the factors which obtain data from Yelp
exports.yelpApiFactors = ["bars","gyms"];
// All the factors which obtain data from Google
exports.googleApiFactors = ["grocery_or_supermarket","train_station","bus_station"];


// Yelp Config factor
exports.yelpConfig = {
	oauth: {
		    "consumer_key": "",
		    "consumer_secret": "",
		    "token": "",
		    "token_secret": ""
	},

// Default Yelp input parameters
	yelpApiInputParameters : {
		limit : 10,
		location : '',
		sort : 2,
		radius_filter : 900,
		category_filter : '',
	},
	yelpApiInputParametersForApartments : {
		limit : 40,
		location : '',
		sort : 1,
		radius_filter : 1500,
		category_filter : 'apartments',
	},
	cateogryFilterStringIdentifier :'category_filter',
};

// Default google config
exports.googleConfig = {
	outputFormat : "json",
	// Default google distance matrix input parameters
	googleDistanceApiInputParameters: {
	    mode: 'transit'
	},
	// Default google place search  input parameters
	googlePlaceSearchApiInputParameters : {
		  key:"",
		  location: "",
	    type: '',
	    radius : 900,
	    sensor : false,
	  },
		// API keys for  factors that depend on google for periodic update
		googleApiKeyMap : {
			'grocery_or_supermarket': "",
			'train_station':'',
			'bus_station':'',
			'work_commute': '', // reusing bus_station 's distance matrix api
			'social_commute': '', // reusing train_station 's distance matrix api
		}
};

// S3 config
exports.s3Config = {
	awsConfig : {
		"accessKeyId" : "",
		"secretAccessKey" : "",
		"region" : "us-east-1"
	},
	s3Bucket : 'find-my-den',
	// Keys for each entitiy
	keys: {
		referenceData: "referenceData.json",
		validEmailAddresses : "validEmailAddresses.json",
		buildings :"buildingData.json",
		commuteScoreCache : "commuteScoreCache.json",
		userFolder: "users",
		userAccounts: "userAccounts.json",
		userInformation : "userInformation.json",
		personalizedBuildingScores : "personalizedBuildingScores.json",
	},
};

exports.httpMethod = 'GET';

// The default "userInformation" variable to be stored in S3 when a new user account is created
exports.defaultUserInformation = {
	search_filters : {
		text_filters : {
			workCommuteTimeFilter:"",
			yelpReviewFilter:"0",
			socialCommuteTimeFilter:"",
		},
		dropdown_filters : {
			// The html and value for the drop down on the UI
			sortFilter: {
					html:"Best Match",
					value:"totalScore"
			},
			yelpRatingFilter: {
					html:"None",
					value:"0"
			}
		},
		view_filters : {
			listViewFilter: "listView"
		},
	},
	// This can be considered as the order of preferences in descending order
	preferences : {
		priority_order: "bars,gyms,grocery_or_supermarket,work_commute,social_commute",
    city: "",
    work_commute: "",
		social_commute: "",
		mode : "",
	},
};

// Client side error messages to be passed in case of server errors
exports.clientSideErrorText = {
	google_distance_matrix_error : "We are experiencing some issues at this time and apologize for the inconvenience."+"\n"
	+"Our team is looking into this and the site will be up shortly." +"\n"
	+"In the meanwhile you will be able to look at apartments in your saved city but won't be able to change any other options."
};

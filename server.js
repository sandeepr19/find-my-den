/**
This class is the entry point of all POST/ GET requests from the client side.
**/

// Initializing all the required variables
var http = require('http');
var express = require('express');
var path = require('path');
var app = express();
var ejs = require('ejs');
var fs = require('fs');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash    = require('connect-flash');
var bcrypt   = require('bcrypt-nodejs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var logger = require('./service/find-my-den-logger.js');
var CronJob = require('cron').CronJob;
var async = require("async");

app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); //
app.use(function(req, res, next) { res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'); next(); });

// Initializing libraries and services
var config = require("./data/config.js");
var s3Utils = require('./lib/s3-lib.js');
var s3Config = config.s3Config;
var buildingScoreCalculator = require("./service/building-score-calculator.js");
var emailService = require("./lib/node-emailer-lib.js");
var throttleUtils = require('./util/google-maps-throttle-utils.js');
var commuteScoreCacheService = require('./util/commute-cache-utils.js');

/*
A cache that holds the following pieces of information at all points of time
Valid Email Addresses: All the email addresses for the beta invite
Reference Data: All the reference data required for the website
Building Data: All the non-user specific building scores for each city
*/
var cache = {
  building : {
    label: "Building",
    s3Key: "buildings",
    wrapper: new Object(),
  },
  /*
  validEmailAddress : {
    label: "Valid Email Addresses",
    s3Key: "validEmailAddresses",
    wrapper: new Object(),
  },
  */
  referenceData : {
    label: "Reference",
    keyLength : 9,
    s3Key: "referenceData",
    wrapper: new Object(),
  }
}

// A wrapper to hold all the user information in a given session
var userDataCache = new Object();

app.listen(8081, function () {
  logger.info("Starting server on 8081");
  /**
  This Cron Job is meant to periodically update all the cache variables every 24 hours at 12 am.
  Essentially the cache variables for buildings, valid email addreses, reference data will be updated from S3 every 24 hours at 12 am EST
  **/
  var job = new CronJob({
    cronTime: '00 00 00 * * *',
    onTick: function() {
      async.each(Object.keys(cache),function(entity, next) {
        s3Utils.downloadDataFromS3({Bucket : s3Config.s3Bucket,Key :s3Config.keys[cache[entity].s3Key] },
          function(output) {
            if(!output ){
              logger.error(cache[entity].label + " data doesn't exist. Terminating");
              process.exit();
            }

            if(output.Body.toString().length == 0
            ||( "keyLength" in cache[entity] &&  Object.keys(JSON.parse(output.Body.toString())).length != cache[entity].keyLength)){
              logger.error(cache[entity].label + " data is corrupt. Terminating");
              process.exit();
            }
            cache[entity].wrapper = JSON.parse(output.Body.toString());
            logger.info(cache[entity].label + " data has been downloaded");
            next();
          });
      }, function() {
        logger.info("All cache data has been updated");
      });
    },
    start: true,
    timeZone: 'America/New_York',
    runOnInit : true,
  });
  job.start();

  /*
  Cron job to do the following two things every 24 hiurs
  => Refresh the number of google distance matrix api requests to make sure we don't exceed the threshold
  => Refresh the commute score cache
  */
  var cacheInitializeJob = new CronJob({
    cronTime: '00 00 00 * * *',
    onTick: function() {
      throttleUtils.initializeGoogleDistanceMatrixRequestCountCache();
      commuteScoreCacheService.refreshCache();
    },
    start: true,
    timeZone: 'America/New_York',
    runOnInit : true,
  });
  cacheInitializeJob.start();

  /*
    Cron job to refresh the google distance matrix count every 2 seconds to make sure we don't process more than 100 addresses per second
  */
  var distanceMatrixApiThrottleJob = new CronJob({
    cronTime: '*/2 * * * * *',
    onTick: function() {
      throttleUtils.refreshPerSecondLimit();
    },
    start: true,
    timeZone: 'America/New_York',
    runOnInit : true,
  });

});


/*
All passport related functions for authentication
*/

// Serialize the user name from the user object
passport.serializeUser(function(user, done) {
  done(null, user.userName);
});

// Deserialize the user  by obtaining the complete user object from S3 using the user name and deleting the password
passport.deserializeUser(function(userName, done) {
  // Always download the user details from S3
  s3Utils.downloadDataFromS3({Bucket : s3Config.s3Bucket,Key :s3Config.keys.userAccounts },
    function(output) {
      if(userName in JSON.parse(output.Body.toString())){
          var userObject = JSON.parse(output.Body.toString())[userName];
          delete userObject.password;
          done(null,userObject);
      } else {
        done(false,null);
      }
    });
});


// Passport strategy for sign up
passport.use('local-signup', new LocalStrategy({
  usernameField : 'userName',
  passwordField : 'password',
  passReqToCallback : true // allows us to pass back the entire request to the callback
},function(req, userName, password, done) {
    process.nextTick(function() {
      // If user is not in the list of people invited, throw an error
      /*
      if(cache.validEmailAddress.wrapper.indexOf(req.body.email) == -1){
        logger.info("User with email id "+ req.body.email+" tried to signup unsuccessfully.");
        return done(null, false, req.flash('userInput',req.body), req.flash('signupMessage', "Sorry, your email id isn't on the invite list. Please try again later"));
      }
      */
      s3Utils.downloadDataFromS3({Bucket : s3Config.s3Bucket,Key :s3Config.keys.userAccounts },
        function(output) {
          var userAccounts = JSON.parse(output.Body.toString());
          // If user name already exists throw an error
          if(userName in userAccounts){
            return done(null, false ,req.flash('userInput',req.body),req.flash('signupMessage', 'That username is already taken.'));
          } else {
            // Encrypt the password
            var isEmailInUse = false;
            for(key in userAccounts){
              if(userAccounts[key].email == req.body.email)
                return done(null, false ,req.flash('userInput',req.body),req.flash('signupMessage', 'That email is already taken.'));
            }
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(password, salt,null, function(err, hash) {
                  var userObject = new Object();
                  userObject.userName = userName;
                  userObject.password = hash;
                  userObject.firstName = req.body.firstName;
                  userObject.lastName = req.body.lastName;
                  userObject.email = req.body.email;
                  userObject.firstTimeUser = true;
                  userObject.isVerifiedAccount = true;
                  userAccounts[userName] = userObject;
                  s3Utils.uploadDataToS3({Bucket:s3Config.s3Bucket , Key: s3Config.keys.userAccounts},{Key: s3Config.keys.userAccounts, Body: JSON.stringify(userAccounts)}, function(err, data) {
                    logger.info("New account created for "+userName);
                    emailService.sendNewAccountCreationEmail(userObject);
                  });
                  // Store the information and building data for the user on creation of account
                  async.parallel([
                    function(dataFetchCallBack) {
                      s3Utils.uploadDataToS3({Bucket:s3Config.s3Bucket+"/"+s3Config.keys.userFolder+"/"+ userObject.userName, Key: s3Config.keys.userInformation},{Key: s3Config.keys.userInformation, Body: JSON.stringify(config.defaultUserInformation)}, function(err, data) {
                        logger.info("Default Preferences Stored for "+userName);
                        dataFetchCallBack();
                      });
                    },
                    // Store default personalized building scores for the user
                    function(dataFetchCallBack) {
                      s3Utils.uploadDataToS3({Bucket:s3Config.s3Bucket+"/"+s3Config.keys.userFolder+"/"+ userObject.userName, Key: s3Config.keys.personalizedBuildingScores},{Key: s3Config.keys.personalizedBuildingScores, Body: JSON.stringify({})}, function(err, data) {
                        logger.info("Default Personalized Building Scores Stored for "+userName);
                        dataFetchCallBack();
                      });
                    }
                  ],function(err) {
                    var userObject = userAccounts[userName];
                    delete userObject.password;
                    return done(null, userObject);
                    /*
                    Comment this functionality currently
                    // Send verification email to the user
                    emailService.sendVerificationEmail(userObject);
                    return done(null, false, req.flash('userInput',{}),req.flash('signupMessage', 'Verification Email Has been Sent. Please check your email'));
                    */
                  });
                });
              });
            }
      });
    });
  }));


// Strategy to edit the account
passport.use('local-edit-account', new LocalStrategy({
    usernameField : 'userName',
    passwordField : 'password',
    passReqToCallback : true // allows us to pass back the entire request to the callback
  },function(req, userName, password, done) {
      process.nextTick(function() {
        s3Utils.downloadDataFromS3({Bucket : s3Config.s3Bucket,Key :s3Config.keys.userAccounts },
          function(output) {
            var userAccounts = JSON.parse(output.Body.toString());
            bcrypt.compare(password, userAccounts[userName].password, function(err, res) {
              if(res == true){
                bcrypt.genSalt(10, function(err, salt) {
                  bcrypt.hash(req.body.newPassword, salt,null, function(err, hash) {
                    var userObject = userAccounts[userName];
                    userObject.firstName = req.body.firstName;
                    userObject.lastName = req.body.lastName;
                    userObject.password = hash;
                    userAccounts[userName] = userObject;
                    s3Utils.uploadDataToS3({Bucket:s3Config.s3Bucket , Key: s3Config.keys.userAccounts},{Key: s3Config.keys.userAccounts, Body: JSON.stringify(userAccounts)}, function(err, data) {
                      logger.info("User account modified for "+userName);
                      emailService.sendAccountModificationEmail(userObject);
                      delete userObject.password;
                      return done(null, userObject);
                    });
                  });
                });
              } else {
                logger.info("Unable to modify account for " + userName + " due to incorrect password.");
                return done(null, false, req.flash('editAccountMessage', 'Your current password is incorrect.'));
              }
            });
        });
      });
  }));

  passport.use('local-reset-password', new LocalStrategy({
      usernameField : 'userName',
      passwordField : 'password',
      passReqToCallback : true // allows us to pass back the entire request to the callback
    },function(req, userName, password, done) {
        process.nextTick(function() {
          s3Utils.downloadDataFromS3({Bucket : s3Config.s3Bucket,Key :s3Config.keys.userAccounts },
            function(output) {
              var userAccounts = JSON.parse(output.Body.toString());
              if(userName in userAccounts){
                if(userAccounts[userName].email == req.body.email){
                  bcrypt.genSalt(10, function(err, salt) {
                    bcrypt.hash(password, salt,null, function(err, hash) {
                      var userObject = userAccounts[userName];
                      userObject.password = hash;
                      userAccounts[userName] = userObject;
                      s3Utils.uploadDataToS3({Bucket:s3Config.s3Bucket , Key: s3Config.keys.userAccounts},{Key: s3Config.keys.userAccounts, Body: JSON.stringify(userAccounts)}, function(err, data) {
                        logger.info("Password reset for user name "+userName);
                        delete userObject.password;
                        emailService.sendAccountModificationEmail(userObject);
                        return done(null, userObject);
                      });
                    });
                  });
                } else {
                  return done(null, false, req.flash('userInput',req.body), req.flash('resetPasswordMessage', 'Invalid email id'));
                }
              } else {
                return done(null, false, req.flash('userInput',req.body),req.flash('resetPasswordMessage', 'User Name does not exist'));
              }

          });
        });
  }));


passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'userName',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, userName, password, done) { // callback with email and password from our form
          s3Utils.downloadDataFromS3({Bucket : s3Config.s3Bucket,Key :s3Config.keys.userAccounts },
            function(output) {
              var userAccounts = JSON.parse(output.Body.toString());
              if(userName in userAccounts){
                if(!userAccounts[userName].isVerifiedAccount)
                  return done(null, false, req.flash('userInput',req.body),req.flash('loginMessage', 'Sorry, you haven\'t verified your account yet. Please check your email.'));
                bcrypt.compare(password, userAccounts[userName].password, function(err, res) {
                  if(res == true){
                    logger.info(userName + " has logged in");
                    var userObject = userAccounts[userName];
                    delete userObject.password;
                    return done(null, userObject);
                  } else {
                    logger.info(userName + " was not able to log in due to invalid password");
                    return done(null, false, req.flash('userInput',req.body),req.flash('loginMessage', 'Oops! Wrong password.'));
                  }
                });
              } else {
                logger.info(userName + " was not able to log in due to invalid username");
                return done(null, false, req.flash('userInput',req.body),req.flash('loginMessage', 'No user found.'));
              }
            });
    }));



// Login

app.get('/', isLoggedIn, function(req, res) {
  // If the user is logging in for the first time, update the S3 user account
  if(req.user.firstTimeUser ){
    res.redirect('/getAboutUs');
  } else {
  res.render('home.ejs', {
    userName : req.user.userName ,
    referenceData: cache.referenceData.wrapper,
  });
 }
});



app.get('/login',function(req, res) {
  if (req.isAuthenticated()){
    res.redirect('/');
  } else{
    var userInputArray = req.flash('userInput');
    var user = userInputArray.length > 0 ? userInputArray[0]: new Object() ;
    // hack to pass in the error message to the user in case login fails
    res.render('login.ejs', { user: user,message: req.flash('loginMessage') });
  }
});


app.get('/loginBeforeVerification',function(req, res) {
  req.logOut();
  res.render('login.ejs', { user: new Object(),message: req.flash('loginMessage')  });
});


app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));


// logout
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});


// Forgot password
app.get('/forgotPassword', function(req, res) {
  var userInputArray = req.flash('userInput');
  var user = userInputArray.length > 0 ? userInputArray[0]: new Object() ;
  // hack to pass in the error message to the user in case login fails
  res.render('accountRetreival.ejs', {user: user, message: req.flash('resetPasswordMessage') });
});



// Sign up
app.get('/signup',function(req, res) {
  var userInputArray = req.flash('userInput');
  var user = userInputArray.length > 0 ? userInputArray[0]: new Object() ;
  // hack to pass in the error message to the user in case login fails
  res.render('signup.ejs', { user: user, message: req.flash('signupMessage') });
});

app.post('/signup', passport.authenticate('local-signup', {
        //successRedirect : '/loginBeforeVerification', // redirect to the secure profile section
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
}));


// user account
app.get('/getUserAccount', isLoggedIn, function(req, res) {
  res.render('account.ejs', { user: req.user , message: req.flash('editAccountMessage') });
});

// Obtaining the personalized building scores along with the user's preferences
app.get('/getUserData', function (req, res) {
  var filePath = s3Config.s3Bucket+"/"+s3Config.keys.userFolder+"/"+ req.user.userName;
  var userData = new Object();
  async.parallel([
   function(dataFetchCallBack) {
     s3Utils.downloadDataFromS3({Bucket : filePath,Key : s3Config.keys.userInformation},
       function(output) {
         userData.userInformation = JSON.parse(output.Body.toString());
         dataFetchCallBack();
       }
     );
   },
   function(dataFetchCallBack) {
     s3Utils.downloadDataFromS3({Bucket : filePath,Key : s3Config.keys.personalizedBuildingScores},
       function(output) {
         userData.personalizedBuildingScores = JSON.parse(output.Body.toString());
         dataFetchCallBack();
       }
     );
   }
 ],function(err) {
   userDataCache[req.user.userName] = userData;
   logger.info("User cache updated for " + req.user.userName);
   res.send(userData);
 });
});

app.post('/editUserAccount', passport.authenticate('local-edit-account', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/getUserAccount', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

app.get('/saveUserAccountInformation',function(req, res) {
  s3Utils.downloadDataFromS3({Bucket : s3Config.s3Bucket,Key :s3Config.keys.userAccounts },
    function(output) {
      var userAccounts = JSON.parse(output.Body.toString());
      userAccounts[req.user.userName].firstTimeUser = false;
      s3Utils.uploadDataToS3({Bucket:s3Config.s3Bucket , Key: s3Config.keys.userAccounts},{Key: s3Config.keys.userAccounts, Body: JSON.stringify(userAccounts)}, function(err, data) {
        logger.info("User Account updated for " + req.user.userName);
        res.redirect('/');
      });
    });
});

app.post('/resetPassword', passport.authenticate('local-reset-password', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/forgotPassword', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

// report error
app.get('/getReportErrorPage',isLoggedIn, function(req, res) {
  res.render('report-error.ejs');
});

app.post('/reportError',function(req, res) {
  emailService.sendUserErrorEmail(req);
  res.redirect('/');
});


// About Us
app.get('/getAboutUs',isLoggedIn, function(req, res){
  res.render('about-us.ejs', { user: req.user });
});


// verify user request
app.get('/showVerifyUserConfirmation', function(req, res) {
  res.render("verify-account.ejs");
});

app.get('/redirectVerifyUserRequest', function(req, res) {
  s3Utils.downloadDataFromS3({Bucket : s3Config.s3Bucket,Key :s3Config.keys.userAccounts },
    function(output) {
      var userAccounts = JSON.parse(output.Body.toString());
      userAccounts[req.query.userName].isVerifiedAccount = true;
      s3Utils.uploadDataToS3({Bucket:s3Config.s3Bucket , Key: s3Config.keys.userAccounts},{Key: s3Config.keys.userAccounts, Body: JSON.stringify(userAccounts)}, function(err, data) {
        logger.info("User Account verified for " + req.query.userName);
        res.redirect('/showVerifyUserConfirmation');
      });
    }
  );
});

// Post request to save UI filters for a user
app.post('/saveFilters', function(req, res) {
  userDataCache[req.user.userName].userInformation = req.body;
  s3Utils.uploadDataToS3({Bucket:s3Config.s3Bucket+"/"+s3Config.keys.userFolder+"/"+ req.user.userName, Key: s3Config.keys.userInformation},{Key: s3Config.keys.userInformation, Body: JSON.stringify(req.body)}, function(err, data) {
    logger.info("UI filters updated for " + req.user.userName);
  });
});

// Post function to enable the user to search apartments
app.post('/searchApartments', function(req, res) {
    var newUserInformation = req.body;
    var userData = new Object();
    var filePath = s3Config.s3Bucket+"/"+s3Config.keys.userFolder+"/"+ req.user.userName;
    logger.info("User " + req.user.userName + " tried to search apartments for the below search parameters");
    logger.info(newUserInformation.preferences);
    // If the user preferences have changed Or the previous request was not successful
    if(JSON.stringify(userDataCache[req.user.userName].userInformation.preferences) != JSON.stringify(newUserInformation.preferences) || !(newUserInformation.wasPreviousRequestSuccessful)
    || !(newUserInformation.wasPreviousRequestSuccessful == 'true')) {
      // Compute the scores for all buildings for the user's city
      buildingScoreCalculator.computePersonalizedBuildingScoresNonPeriodic(cache,userDataCache[req.user.userName],newUserInformation.preferences,
        function(error, output){
          // If there was an error
          if(error.errorFlag) {
            logger.error("An error occurred while searching for apartments for  " + req.user.userName);
            newUserInformation.wasPreviousRequestSuccessful = 'false';
            emailService.sendSystemError(req,error);
            res.send(error);
          } else {
          // No error occurred
          logger.info("User " + req.user.userName + "was able to search for apartments successfully.");
            newUserInformation.wasPreviousRequestSuccessful = 'true';
            userInformationCache = newUserInformation;
            // Upload the personalized building scores for the user.
            s3Utils.uploadDataToS3({Bucket:filePath , Key: s3Config.keys.personalizedBuildingScores},{Key: s3Config.keys.personalizedBuildingScores, Body: JSON.stringify(output)}, function(err, data) {
              var userData = new Object();
              userData.userInformation = userInformationCache;
              userData.personalizedBuildingScores = output;
              // Update the current user cache
              userDataCache[req.user.userName] = userData;
              logger.info("Saved Personalized Building Scores for " + req.user.userName);
              res.send(output);
            });
            //Upload the user's information to S3.
            s3Utils.uploadDataToS3({Bucket:s3Config.s3Bucket+"/"+s3Config.keys.userFolder+"/"+ req.user.userName, Key: s3Config.keys.userInformation},{Key: s3Config.keys.userInformation, Body: JSON.stringify(newUserInformation)}, function(err, data) {
              logger.info("Saved User Information for "+req.user.userName);
            });
        }
      });
    } else {
      logger.info("User input for apartment search hasn't changed for " + req.user.userName);
      res.send(userDataCache[req.user.userName].personalizedBuildingScores);
    }
});

// Function to check if a user is already logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()){
    return next();
  }
  res.redirect('/login');
}

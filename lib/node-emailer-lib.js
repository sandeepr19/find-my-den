var nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');

// A utility class to help a user to send emails
var transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    auth: {
      user: '', // my mail
      pass: ''
    }
}));

// default input parameter to be used
var inputParameter = {
  from: '',
  to: "",
}

// send the error reported by the user
exports.sendUserErrorEmail = function(req){
  var emailInputParameter = JSON.parse(JSON.stringify(inputParameter));
  emailInputParameter.subject = "User Reporting Error";
  var text ='Hello,' + "\n" + "User " + req.user.firstName + " " + req.user.lastName + " has reported the below error";
  text += "\n" +req.body.errorDescription+".";
  text += "\n" +"Please look into it.";
  emailInputParameter.text = text;
  transporter.sendMail(emailInputParameter);
}

// send new account creation email
exports.sendNewAccountCreationEmail = function(userObject){
  var emailInputParameter = JSON.parse(JSON.stringify(inputParameter));
  emailInputParameter.subject = "New Account Created";
  var text ='Hello,' + "\n" + "A new account was created for " + userObject.firstName + " " + userObject.lastName;
  emailInputParameter.text = text;
  transporter.sendMail(emailInputParameter);
}

// send password/ account modification email
exports.sendAccountModificationEmail = function(userObject){
  var emailInputParameter = JSON.parse(JSON.stringify(inputParameter));
  emailInputParameter.to = userObject.email;
  emailInputParameter.subject = "FindMyDen: Account modification";
  var text ='Hello ' + userObject.firstName + ',\n';
  text += 'There was a recent change to your account details. If you didn\'t make this change, please reach out to us at findMyDenOfficial@gmail.com';
  text += "\n" + 'Thanks,';
  text += "\n" + 'FindMyDen Team,';
  emailInputParameter.text = text;
  transporter.sendMail(emailInputParameter);
}

// send verification email to user on creation of new account
exports.sendVerificationEmail = function(userObject){
  var emailInputParameter = JSON.parse(JSON.stringify(inputParameter));
  emailInputParameter.to = userObject.email;
  emailInputParameter.subject = "FindMyDen: Verify your account";
  var text ='Hello ' + userObject.firstName + ',\n';
  text += 'Thank you for signing up for Find-My-Den.' + '\n';
  text += 'As a part of verifying your account, Please click on the below link to verify your account.';
  var html = 'Hello '+ userObject.firstName + ',' + '<br>';
  html +='Thank you for signing up for Find-My-Den' + '<br>';
  html +='We hope you have a good time while using the service. Please let us know in case of any issues' + '<br>';
  html += 'Please click '+ '<a href="https://findMyDen.com/redirectVerifyUserRequest?userName='+userObject.userName+'">here</a>'+' to verify your account.' + '<br>';
  emailInputParameter.html = html;
  transporter.sendMail(emailInputParameter);
}

// send system error in case of any failure
exports.sendSystemError = function(req, error){
  var emailInputParameter = JSON.parse(JSON.stringify(inputParameter));
  emailInputParameter.subject = "System Error";
  var text ='Hello, ' + "\n";
  text += "User " + req.user.firstName + " " + req.user.lastName + " experienced an error while using the website";
  text += "\n" + "API causing error: " +error.emailErrorText;
  text += "\n" + "Error Body: " +error.emailErrorBody;
  text += "\n" +"Please look into it.";
  emailInputParameter.text = text;
  transporter.sendMail(emailInputParameter);
}

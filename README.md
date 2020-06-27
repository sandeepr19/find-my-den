# find-my-den
Overview

-  "Find My Den" is a lifestyle quantification search engine that tries to break away from the conventional model of searching for apartments based on rent and size.
-  It does so by allowing the user to quantify their priorities pertaining to night life, grocery stores, gyms, commute time to professional and social points of interest and use this metric to provide the appropriate search results.

Technical stack
- The backend is built in node.js, S3 while the restful services are exposed using express.js while the front end comprises of HTML5 and JQuery.
- Express has been used as the relevant middleware for node.js and the authentication layer has been built using passport, an authentication middleware.
- The server currently is hosted on Amazon's Elastic Bean Stalk and makes use of AWS Lambda to periodically update the data-store on S3 using Yelp' Search and Google's Places Search API

Steps to run
- Insert all keys and passwords present in data/config.js, lib/node-emailer-lib.js  and util/google-map-throttle-util.js
- cd public/js
- watchify jquery-helper.js -o bundle.js -v
- cd to the root folder
- node server.js
- access the website on localhost://8081

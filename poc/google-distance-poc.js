// A proof of concept to query Google Distance Matrix API
var config = require("../data/config.js");
var googleDistanceLib = require('../lib/google-distance-lib.js');

var googleDistanceApiInputParameters = {
  mode : 'transit',
  destinations : [
  '1139 NW Market Street,Ballard,Seattle, WA 98107',
  '708 6th Avenue North,Lower Queen Anne,Seattle, WA 98109',
  '3812 14th Ave W,Ste 1,Queen Anne,Seattle, WA 98119',
  '206 5th Ave N,South Lake Union,Seattle, WA 98109',
  '62 Cedar St,Belltown,Seattle, WA 98121',
  '521 S Weller,International District,Seattle, WA 98104',
  '2201 SW Holden St,Westwood,Seattle, WA 98106',
  '801 Dexter Avenue North,Westlake,Seattle, WA 98109',
  '809 Olive Way,Downtown,Seattle, WA 98101',
  '888 Western Ave,Downtown,Seattle, WA 98104',
  '714 7th Ave,First Hill,Seattle, WA 98104',
  '1501 NW 56th St,Ballard,Seattle, WA 98107',
  '810 Dexter Ave N,Westlake,Seattle, WA 98109',
  '118 Republican Street,Lower Queen Anne,Seattle, WA 98109',
  '1401 Boren Ave,First Hill,Seattle, WA 98101',
  '602 Galer Street,Queen Anne,Seattle, WA 98109',
  '2922 Western Ave,Belltown,Seattle, WA 98121',
  '1000 Minor Ave,First Hill,Seattle, WA 98104',
  '1525 9th Avenue,Downtown,Seattle, WA 98101',s
  '801 Pine Street,Downtown,Seattle, WA 98101',
  '2334 Elliott Ave,Belltown,Seattle, WA 98121',
  '4710 University Way NE,University District,Seattle, WA 98105',
  '2300 Elliott Ave,Belltown,Seattle, WA 98121'
  ],
  origins : ['500 Wall Street, Seattle, WA, United States']
}


googleDistanceLib.requestCommuteTime("work_commute", true, googleDistanceApiInputParameters, function(error,outputData){
  if(error){
    console.log("error");
  } else {
    console.log(outputData);
    for(var i=0; i<outputData.length;i++){
      var durationArray = outputData[i]['duration'].trim().split(" ");
      var outputApartmentWrapper = new Object();
      var durationValue = 240;
      if(durationArray.length == 4) {
        durationValue = (durationArray[0] * 60) + durationArray[2];
      } else if (durationArray.length == 2) {
        durationValue = durationArray[0];
      }
    }
 }
});


/*
var googleDistanceApiInputParameters = {
  mode : 'transit',
  destinations : ['1139 NW Market Street,Ballard,Seattle, WA 98107',
  '708 6th Avenue North,Lower Queen Anne,Seattle, WA 98109',
  '3812 14th Ave W,Ste 1,Queen Anne,Seattle, WA 98119',
  '500 Wall Street,Denny Triangle,Seattle, WA 98121',
  '206 5th Ave N,South Lake Union,Seattle, WA 98109',
  '62 Cedar St,Belltown,Seattle, WA 98121',
  '521 S Weller,International District,Seattle, WA 98104',
  '2201 SW Holden St,Westwood,Seattle, WA 98106',
  '801 Dexter Avenue North,Westlake,Seattle, WA 98109',
  '809 Olive Way,Downtown,Seattle, WA 98101',
  '888 Western Ave,Downtown,Seattle, WA 98104',
  '714 7th Ave,First Hill,Seattle, WA 98104',
  '1501 NW 56th St,Ballard,Seattle, WA 98107',
  '810 Dexter Ave N,Westlake,Seattle, WA 98109',
  '1942 Westlake Ave,Denny Triangle,Seattle, WA 98101',
  '118 Republican Street,Lower Queen Anne,Seattle, WA 98109',
  '1401 Boren Ave,First Hill,Seattle, WA 98101',
  '602 Galer Street,Queen Anne,Seattle, WA 98109',
  '2922 Western Ave,Belltown,Seattle, WA 98121',
  '1000 Minor Ave,First Hill,Seattle, WA 98104',
  '1525 9th Avenue,Downtown,Seattle, WA 98101',
  '801 Pine Street,Downtown,Seattle, WA 98101',
  '2334 Elliott Ave,Belltown,Seattle, WA 98121',
  '4710 University Way NE,University District,Seattle, WA 98105',
  '2300 Elliott Ave,Belltown,Seattle, WA 98121'
  ],
  origins : ['500 Wall Street, Seattle, WA, United States']
}
*/

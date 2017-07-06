var viewFilterMap = {
  listViewFilter : "#listDiv",
  mapViewFilter : "#mapDiv",
};

// Populate google entities i.e. grocery stores, train stations, bus stations
module.exports.populateGoogleEntities = function(selectedBuilding) {
  var array = ["grocery_or_supermarket", "train_station","bus_station" ];
  array.map(
    function(factor){
      var listOfNames = []
      selectedBuilding[factor].map(
        function(element){
          listOfNames.push(element.name);
        }
      );
      var unique = Array.from(new Set(listOfNames));
      unique = (unique.length>3)?unique.splice(0,2):unique;
      var text ="";
      unique.map(function(name){text+=name + ";"+"\t"; });
      document.getElementById(factor+"_text").innerHTML =text;
    }
  )
}

// Populate yelp entities i.e. bars, gyms on the apartment details page
module.exports.populateYelpEntities = function(selectedBuilding) {
  var array = ["bars", "gyms" ];
  for(index in array){
    var i =1;
    var entity = array[index];
    for(key in selectedBuilding[entity]){
      $("#"+entity+i).text(key);
      $("#"+entity+i).attr('href',selectedBuilding[entity][key]['url']);
      $("#"+entity+i).attr('class','search-results-href');
      if(i==3)
        break;
      i++;
    }
  }
}

// Flatten a map to a list
module.exports.flattenMap = function(buildingScoresMap) {
  var list = [];
  for(key in buildingScoresMap) {
    list.push(buildingScoresMap[key]);
  }
  return list;
}

// Can the record be filtered out i.e. false indicates yes and true indicates no
module.exports.doesRecordMeetCriteria = function(wrapper) {
  var workCommuteTimeFilterValue = document.getElementById("workCommuteTimeFilter").value;
  var buildingWorkCommuteTime = wrapper['work_commute'];
  if(parseInt(buildingWorkCommuteTime) > parseInt(workCommuteTimeFilterValue))
    return false;

  var socialCommuteTimeFilterValue = document.getElementById("socialCommuteTimeFilter").value;
  var buildingSocialCommuteTime = wrapper['social_commute'];
  if(parseInt(buildingSocialCommuteTime) > parseInt(socialCommuteTimeFilterValue))
    return false;


  var yelpReviewsFilterValue = document.getElementById("yelpReviewFilter").value;
  var buildingReviews = wrapper['review_count'];
  if(parseInt(buildingReviews) < parseInt(yelpReviewsFilterValue))
    return false;


  var ratingsFilterValue = document.getElementById("yelpRatingFilter").value;
  var buildingRatings = wrapper['rating'];
  if(parseInt(buildingRatings) < parseInt(ratingsFilterValue))
    return false;

  return true;
}

// Format the building record to be displayed as a row in the data table
module.exports.formatBuildingRecord = function(buildingData){
  buildingData.sort(function(a, b) {
    return parseInt(b.totalScore) - parseInt(a.totalScore);
  });

  var maxTotalScore = buildingData[0].totalScore;
  var minTotalScore = buildingData[buildingData.length -1].totalScore;

  var clonedArray = JSON.parse(JSON.stringify(buildingData))
  clonedArray.sort(function(a, b) {
    return parseInt(b.nightLifeScore) - parseInt(a.nightLifeScore);
  });
  var maxNightLifeScore = clonedArray[0].nightLifeScore;
  var minNightLifeScore = clonedArray[clonedArray.length -1].nightLifeScore;

  clonedArray.sort(function(a, b) {
    return parseInt(b.gymScore) - parseInt(a.gymScore);
  });
  var maxGymScore = clonedArray[0].gymScore;
  var minGymScore = clonedArray[clonedArray.length -1].gymScore;

  clonedArray.sort(function(a, b) {
    return parseInt(b.groceryStoreScore) - parseInt(a.groceryStoreScore);
  });
  var maxGroceryStoreScore = clonedArray[0].groceryStoreScore;
  var minGroceryStoreScore = clonedArray[clonedArray.length -1].groceryStoreScore;

  clonedArray.sort(function(a, b) {
    return parseInt(b.workCommuteScore) - parseInt(a.workCommuteScore);
  });
  var maxWorkCommuteScore = clonedArray[0].workCommuteScore;
  var minWorkCommuteScore = clonedArray[clonedArray.length -1].workCommuteScore;

  clonedArray.sort(function(a, b) {
    return parseInt(b.socialCommuteScore) - parseInt(a.socialCommuteScore);
  });
  var maxSocialCommuteScore = clonedArray[0].socialCommuteScore;
  var minSocialCommuteScore = clonedArray[clonedArray.length -1].socialCommuteScore;

  for(index in buildingData) {
    var buildingRecord = buildingData[index];
    var description = '<a href =\"javascript:void(0)\" id=\"buildingName\" class=\"search-results-href\">'+ buildingRecord["name"] + '</a>'+'<br />';
    description+= "Address:" + buildingRecord["address"]+'<br />';
    description+= "Yelp Rating:" + buildingRecord["rating"]+'<br />';
    description+= "Reviews Count:" + buildingRecord["review_count"]+'<br />';
    description+= "Total Score:" + ((10*(parseInt(buildingRecord["totalScore"])-parseInt(minTotalScore)))/(maxTotalScore-minTotalScore)).toFixed(2)+'&nbsp;&nbsp;&nbsp;&nbsp;';
    description+= "NightLife Score:" + ((10*(parseInt(buildingRecord["nightLifeScore"])-parseInt(minNightLifeScore)))/(maxNightLifeScore-minNightLifeScore)).toFixed(2)+'&nbsp;&nbsp;&nbsp;&nbsp;';
    description+= "Fitness Score:" + ((10*(parseInt(buildingRecord["gymScore"])-parseInt(minGymScore)))/(maxGymScore-minGymScore)).toFixed(2)+'&nbsp;&nbsp;&nbsp;&nbsp;';
    description+= "Grocery Store Score:" + ((10*(parseInt(buildingRecord["groceryStoreScore"])-parseInt(minGroceryStoreScore)))/(maxGroceryStoreScore-minGroceryStoreScore)).toFixed(2)+'<br />';

    description+= "Work Commute Score:" + ((10*(parseInt(buildingRecord["workCommuteScore"])-parseInt(minWorkCommuteScore)))/(maxWorkCommuteScore-minWorkCommuteScore)).toFixed(2)+'&nbsp;&nbsp;&nbsp;&nbsp;';
    description+= "Social Commute Score:" + ((10*(parseInt(buildingRecord["socialCommuteScore"])-parseInt(minSocialCommuteScore)))/(maxSocialCommuteScore-minSocialCommuteScore)).toFixed(2)+'&nbsp;&nbsp;&nbsp;&nbsp;';
    description+= "Work Commute Time:" + buildingRecord["work_commute"]+'mins'+'&nbsp;&nbsp;&nbsp;&nbsp;';
    description+= "Social Commute Time:" + buildingRecord["social_commute"]+'mins'+'&nbsp;&nbsp;&nbsp;&nbsp;';

    buildingRecord['description'] = description;
    buildingRecord.workCommuteScore = ("workCommuteScore" in buildingData[index])?buildingData[index].workCommuteScore:0;
    buildingRecord.socialCommuteScore = ("socialCommuteScore" in buildingData[index])?buildingData[index].socialCommuteScore:0;
    buildingRecord.work_commute = ("work_commute" in buildingData[index])?buildingData[index].work_commute:0;
    buildingRecord.social_commute = ("social_commute" in buildingData[index])?buildingData[index].social_commute:0;
  }
}

// Populate the apartment details page with all the required data
module.exports.populateApartmentDetailsPage = function(selectedBuilding,userInformation){
  document.getElementById("selectedBuildingName").innerHTML = selectedBuilding['name'];
  document.getElementById("selectedBuildingAddress").innerHTML = selectedBuilding['address'];
  document.getElementById("selectedBuildingClaimFlag").innerHTML = selectedBuilding["is_claimed"]?true:false;
  document.getElementById("selectedBuildingSocialCommuteTime").innerHTML = selectedBuilding['social_commute'];
  document.getElementById("selectedBuildingWorkCommuteTime").innerHTML = selectedBuilding['work_commute'];
  document.getElementById("selectedBuildingReviews").innerHTML = selectedBuilding['review_count'];
  document.getElementById("selectedBuildingRating").innerHTML = selectedBuilding['rating'];
  document.getElementById("workAddress").innerHTML = userInformation.preferences['work_commute'];
  document.getElementById("socialAddress").innerHTML = userInformation.preferences['social_commute'];


}

// Disable all the UI filters on the screen
module.exports.disableFilters = function (searchFilters, isVisible) {
  if(isVisible) {
    $("#searchFiltersHeaderDiv").hide();
    $("#searchFiltersFormDiv").hide();
  } else {
    $("#searchFiltersHeaderDiv").show();
    $("#searchFiltersFormDiv").show();
  }
  /*
  for(key in searchFilters){
    for(nestedKey in searchFilters[key])
      $( "#"+nestedKey ).prop( "disabled", isVisible );
  }
  for(key in viewFilterMap)
    $( "#"+key ).prop( "disabled", isVisible );

  */
}

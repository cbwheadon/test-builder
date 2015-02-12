var async = require('async');
var csv = require("fast-csv");
var moment = require("moment");

// Pupil worker has to:
// 0. Open a connection to the database
// 1. Check a task exists
// 2. Read csv file
// 3. Validate the csv file
// 4. Loop through the records, uploading each to the database
// 5. Close the connection to the database

uploadPupils = function(task, csvFile, db, callback){
  var pupils = [];
  var bad = [];
  async.series([
    function(callback){
      csv
       .fromPath(csvFile, {headers : true})
       .on("data", function(data){
          if(!data.class) data.class = '-';
          if(!data.dob) data.dob = '-';
          if(!data.gender) data.gender = '-';
          if(data.tier) data.tier = data.tier.substring(0, 1).toUpperCase();
          if(data.firstName && data.lastName && data.schoolName && data.school && (data.tier == 'F' | data.tier =='H' )) {
            data.owners = task.owners;
            data.task = task._id;
            data.processed = 'false';
            data.createdAt = moment().format();
            pupils.push(data);
          } else {
            bad.push(data);
          }
       })
       .on("end", function(){
          if(bad.length>0){
            console.log(bad);
            return callback(new Error('Formatting errors found:'+ bad.length));
          } else {
            callback();
          }
       });
    },
    function(callback){
      console.log('bulk inserting: ', pupils.length, ' records.');
      // Get the collection
      var col = db.collection('pupils');
      // Initialize the unordered Batch
      var batch = col.initializeUnorderedBulkOp({useLegacyOps: true});
      for(var i=0; i<pupils.length; i++){
        batch.insert(pupils[i]);
      }
      batch.execute(function(err, result) {
        if(err) return callback(err);
        console.log('inserted', result.nInserted);
        callback();
      });
    }
  ],function(err){
    if(err) return callback(err);
    callback(err, 'update complete');
  });
};

module.exports = {
  uploadPupils:uploadPupils,
};
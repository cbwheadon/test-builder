var dbConnection = require('./connect-db.js');
var taskChecker = require('./task-checker.js');
var async = require('async');
var csv = require("fast-csv");

// Pupil worker has to:
// 0. Open a connection to the database
// 1. Check a task exists
// 2. Read csv file
// 3. Validate the csv file
// 4. Loop through the records, uploading each to the database
// 5. Close the connection to the database

uploadPupils = function(taskName, csvFile, callback){
  var db;
  var task;
  var pupils = [];
  var bad = [];
  async.series([
    function(callback){
      dbConnection.openConnection(function(err, conn){
        if (err) return callback(err);
        db = conn;
        callback();
      });
    },
    function(callback){
      //Check a task exists
      taskChecker.checkTask(db, taskName, function(err, taskObj){
        if (err) return callback(err);
        if (taskObj===null) return callback(new Error('No task with name '+taskName+' found.'));
        task = taskObj;
        console.log(task);
        callback();
      });
    },
    function(callback){
      csv
       .fromPath(csvFile, {headers : ["firstName", "lastName", "dob", "gender", "schoolName", "school", "class", "tier"]})
       .on("data", function(data){
          if(data.firstName && data.lastName && data.dob && data.gender && data.schoolName && data.school && data.class && data.tier) {
            data.owners = task.owners;
            data.task = task._id;
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
    if(db) db.close();
    if(err) return callback(err);
    callback(err, 'update complete');
  });
};

module.exports = {
  uploadPupils:uploadPupils,
};
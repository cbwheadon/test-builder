//Script worker has to:
//0. Check that a task exists
//1. Find all the pupils from a filter
//2. Allocate a script to each
//3. Save the script record, along with a unique qr code

var dbConnection = require('./connect-db.js');
var taskChecker = require('./task-checker.js');
var async = require('async');

createScripts = function(taskName, filter, booklets, callback){
  console.log(taskName, filter, booklets);
  var task;
  var pupils;
  var db;
  var qry = JSON.parse(filter);
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
      //Find pupils
      var col = db.collection('pupils');
      col.find(qry).toArray(function(err, items) {
        if (err) return callback(err);
        if (items.length === 0){
          return callback(new Error('No pupils for the filter' + filter));
        }
        pupils = items;
        console.log('pupils: ', pupils.length);
        callback();
      });
    },
    function(callback){
      //Allocate a script to each
      //Find the booklet ids
      //Choose one
      //Create qr code
      //Insert record
      callback();
    },
    ], function(err){
      if(db) db.close();
      if(err) return callback(err);
      callback(err, 'update complete');
    });
};

module.exports = {
  createScripts: createScripts,
};
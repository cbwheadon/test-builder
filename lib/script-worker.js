//Script worker has to:
//0. Check that a task exists
//1. Find all the pupils from a filter
//2. Allocate a script to each
//3. Save the script record, along with a unique qr code

var dbConnection = require('./connect-db.js');
var taskChecker = require('./task-checker.js');
var async = require('async');
var _ = require('underscore');

createScripts = function(taskName, filter, bookletNames, callback){
  console.log(taskName, filter, booklets);
  var task;
  var pupils;
  var db;
  var booklets;
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
      //Find the booklet ids
      var col = db.collection('booklets');
      if(bookletNames){
        var bks = bookletNames.split(',');
        col.find({name:{$in: bks}}).toArray(function(err, items){
          if (err) return callback(err);
          if (items.length != bks.length){
            console.log(items);
            return callback(new Error('Not all booklets found!'));
          }
          booklets = items;
          console.log('booklets: ',booklets.length);
          callback();
        });
      } else {
        col.find({task:task._id}).toArray(function(err, items){
          if (err) return callback(err);
          if (items.length === 0){
            return callback(new Error('No booklets found!'));
          }
          booklets = items;
          console.log('booklets: ',booklets.length);
          callback();
        });
      }
    },
    function(callback){
      var booklet;
      var qrcode;
      async.each(pupils, function(pupil, callback){
        qrcode = pupil._id.toHexString();
        if (booklets.length > 1) {
          booklet = _.sample(booklets)._id;
        } else {
          booklet = booklets[0]._id;
        }
        var col = db.collection('scripts');
        col.insert({booklet:booklet, owners:task.owners, task:task._id, qrcode: qrcode, pupil:pupil._id ,processed:false}, function(err, result){
          if (err) return callback(err);
          callback();
        });
      }, function(err){
            // if any of the file processing produced an error, err would equal that error
            if (err) {
                // One of the iterations produced an error.
                // All processing will now stop.
                return callback(new Error('A pupil failed to process'));
            } else {
                console.log('All scripts have been inserted');
                callback();
            }
      });
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
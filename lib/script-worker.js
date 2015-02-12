//Script worker has to:
//0. Check that a task exists
//1. Find all the pupils from a filter
//2. Allocate a script to each
//3. Save the script record, along with a unique qr code
//4. Write script collection to csv

var dbConnection = require('./connect-db.js');
var taskChecker = require('./task-checker.js');
var qrWorker = require('./qr-worker.js');
var async = require('async');
var _ = require('underscore');
var csv = require("fast-csv");
var path = require("path");
var fs = require("fs");
var moment = require("moment");

genQrCode = function(db, task, pupil, n, callback){
  var qrcode = _.sample(['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z'],n).join('');
  var col = db.collection('scripts');
  col.find({task:task._id, qrcode:qrcode},{},{limit:1}).count(function(err, count){
    if(err) callback(err);
    if(count>0){
      console.log('regenerating qr code: ', count);
      genQrCode(db, task, pupil, n, callback);
    } else {
      col.update({pupil:pupil._id, booklet:pupil.booklet}, {$set:{qrcode:qrcode}}, function(err, result){
        if(err) callback(err);
        callback (err,qrcode);
      });
    }
  });
};

createScripts = function(taskName, filter, bookletNames, callback){
  console.log(taskName, filter, booklets);
  var task;
  var pupils;
  var db;
  var booklets;
  var scripts;
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
        if (booklets.length > 1) {
          booklet = _.sample(booklets);
        } else {
          booklet = booklets[0];
        }
        pupil.booklet = booklet.name;
        var col = db.collection('scripts');
        col.insert({booklet:booklet._id, owners:task.owners, task:task._id, pupil:pupil._id ,label:false, processed:false, createdAt:moment().format()}, function(err, result){
          if (err) return callback(err);
          callback();
        });
      }, function(err){
            // if any of the file processing produced an error, err would equal that error
            if (err) {
                // One of the iterations produced an error.
                // All processing will now stop.
                return callback(new Error('A script failed to process'));
            } else {
                console.log('All scripts have been inserted');
                callback();
            }
      });
    },
    function(callback){
      //assign qr code to each pupil
      var col = db.collection('scripts');
      async.eachSeries(pupils, function(pupil, callback){
        genQrCode(db, task, pupil ,5, function(err, qrcode){
          if(err) return callback(err);
          pupil.qrcode = qrcode;
          //qrWorker.createQrImage(qrcode);
          //update database
            col.update({pupil:pupil._id},{$set:{qrcode:qrcode}}, function(err, msg){
              if (err) return callback(new Error('A qrcode failed update'));
              callback();
            });
        });
      }, function(err){
        if(err){
          return callback(new Error('An error in generating a qr code.'));
        } else {
          callback();
        }
      });
    },
    function(callback){
      //save scripts collection to csv
      var fn = task.name + '_' + Date.now() + '.csv';
      var fPath = path.join('./assets/csv/', fn);
      var ws = fs.createWriteStream(fPath);
      csv
        .write(pupils, {
          headers: true,
          transform: function(row){
            return {
                firstName: row.firstName,
                lastName: row.lastName,
                dob: row.dob,
                gender: row.gender,
                schoolName: row.schoolName,
                school: row.school,
                class: row.class,
                tier: row.tier,
                booklet: row.booklet,
                qrcode: row.qrcode,
                image: row.qrcode + '.png',
            };
        }
        })
        .pipe(ws);
      callback();
    },
    function(callback){
      //Update pupil status to processed
      console.log('updating pupil status');
      var col = db.collection('pupils');
      col.update(qry, {$set:{'processed':'true'}},{multi:true} ,function(err, msg) {
        if (err) return callback(err);
        callback();
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
  genQrCode: genQrCode
};
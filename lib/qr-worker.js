var dbConnection = require('./connect-db.js');
var taskChecker = require('./task-checker.js');
var async = require('async');
var qr = require('qr-image');
var fs = require('fs');
var path = require('path');

//qr worker has to
//check that a task exists
//check that there are scripts with qrcodes
//generate a qr image for each qrcode

genImages = function(taskName, callback){
  var task;
  var scripts;
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
      //Get the scripts
      var col = db.collection('scripts');
      col.find({task:task._id, qrcode:{$exists:true}}).toArray(function(err, items) {
        if (err) return callback(err);
        if (items.length === 0){
          return callback(new Error('No scripts for the task: ' + task.name));
        }
        scripts = items;
        console.log('scripts: ', scripts.length);
        callback();
      });
    },
    function(callback){
      //Create an image for each script
      async.each(scripts, function(script, callback){
        console.log(script.qrcode);
        var code = qr.image(script.qrcode, {ec_level:'H', type: 'png' });
        var filePath = path.join('.','assets','qrcodes', (script.qrcode + '.png'));
        var output = fs.createWriteStream(filePath);
        code.pipe(output);
        callback();
      }, function(err){
          // if any of the file processing produced an error, err would equal that error
          if (err) {
              // One of the iterations produced an error.
              // All processing will now stop.
              return callback(new Error('A qrcode failed to process'));
          } else {
              console.log('All qrcode images have been generated');
              callback();
          }
      });
    }
    ], function(err){
      if(db) db.close();
      if(err) return callback(err);
      callback(err, 'qr image creation complete');
    });
};

module.exports = {
  genImages:genImages,
};
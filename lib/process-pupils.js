var fs = require('fs');
var async = require('async');
var path = require('path');
var dbConnection = require('./connect-db.js');
var taskChecker = require('./task-checker.js');
var pupilWorker = require('./pupil-worker.js');

readDir = function(taskName, container, callback) {
    var dir = path.join(container, 'incoming');
    var db;
    var task;
    var csvFiles = fs.readdirSync(dir);
    var index = csvFiles.indexOf('.DS_Store');
    if (index > -1) {
        csvFiles.splice(index, 1);
    }
    if (csvFiles.length === 0) return callback(new Error('No files found in: ' + dir));
    async.series([
        function(callback) {
            dbConnection.openConnection(function(err, conn) {
                if (err) return callback(err);
                db = conn;
                callback();
            });
        },
        function(callback) {
            //Check a task exists
            taskChecker.checkTask(db, taskName, function(err, taskObj) {
                if (err) return callback(err);
                if (taskObj === null) return callback(new Error('No task with name ' + taskName + ' found.'));
                task = taskObj;
                console.log(task);
                callback();
            });
        },
        function(callback) {
            // assuming an array of file names
            async.eachSeries(csvFiles, function(file, callback) {
                // Perform operation on file here.
                console.log('Processing file ' + file);
                var filePath = path.join(dir, file);
                uploadPupils(task, filePath, db, function(err, msg){
                    if(err) return callback(new Error('File ' + file + ' failed to process.'));
                    console.log('File processed');
                    //move file
                    newName = path.join(container, 'processed', file);
                    fs.renameSync(filePath, newName);
                    callback();
                });
            }, function(err) {
                // if any of the file processing produced an error, err would equal that error
                if (err) {
                    // One of the iterations produced an error.
                    // All processing will now stop.
                    return callback(new Error(err));
                } else {
                    console.log('All files have been processed successfully');
                    callback();
                }
            });
        },
    ], function(err) {
        if (db) db.close();
        if (err) return callback(err);
        console.log('database closed');
        callback(err, 'update complete');
    });
};

module.exports = {
    readDir: readDir,
};
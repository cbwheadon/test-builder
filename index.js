#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var pupilWorker = require('./lib/pupil-worker');
var scriptWorker = require('./lib/script-worker');
var qrWorker= require('./lib/qr-worker');
var processPupils = require('./lib/process-pupils.js');

program
  .version('0.0.1')
  .option('-p, --pupils', 'Add pupils to the database')
  .option('-s, --script', 'Add scripts to the database')
  .option('-t, --task [type]', 'Add task id')
  .option('-c --csv [type]', 'Path to csv files')
  .option('-f --filter [type]', 'Filter for pupils')
  .option('-b --booklets <items>', 'Booklet list')
  .option('-q --qrcodes', 'Generate png images of qrcodes')
  .parse(process.argv);

if (program.pupils) console.log(' pupils');
if (program.script) console.log(' scripts');
if (program.qrcodes) console.log(' qrcodes');

console.log('for task %s', program.task);

if(program.pupils){
  if(!program.csv){
    console.log('No directory provided');
  } else {
    processPupils.readDir(program.task, program.csv, function(err, msg){
      if (err) {
        console.log (err);
      } else {
        console.log(msg);
      }
    });
  }
}

if(program.script){
  console.log(' list: %j', program.booklets);
  scriptWorker.createScripts(program.task, program.filter, program.booklets, function(err, msg){
      if (err) {
        console.log (err);
      } else {
        console.log(msg);
      }
  });
}

if(program.qrcodes){
  if(!program.task){
    console.log('No task provided');
  } else {
    qrWorker.genImages(program.task, function(err, msg){
      if(err){
        console.log(err);
      } else {
        console.log(msg);
      }
    });
  }
}
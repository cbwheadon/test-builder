#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var pupilWorker = require('./lib/pupil-worker');
var scriptWorker = require('./lib/script-worker');

program
  .version('0.0.1')
  .option('-p, --pupils', 'Add pupils to the database')
  .option('-s, --script', 'Add scripts to the database')
  .option('-t, --task [type]', 'Add task id')
  .option('-c --csv [type]', 'Path to csv file')
  .option('-f --filter [type]', 'Filter for pupils')
  .option('-b --booklets [type]', 'Booklet list')
  .parse(process.argv);

console.log('you are inserting:');
if (program.pupils) console.log(' pupils');
if (program.script) console.log('  scripts');
console.log('to task %s', program.task);

if(program.pupils){
  if(!program.csv){
    console.log('No csv provided');
  } else {
    pupilWorker.uploadPupils(program.task, program.csv, function(err, msg){
      if (err) {
        console.log (err);
      } else {
        console.log(msg);
      }
    });
  }
}

if(program.script){
  scriptWorker.createScripts(program.task, program.filter, program.booklets, function(err, msg){
      if (err) {
        console.log (err);
      } else {
        console.log(msg);
      }
  });
}
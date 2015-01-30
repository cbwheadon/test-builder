var Db = require('mongodb').Db,
  MongoClient = require('mongodb').MongoClient,
  config = require('config'),
  dbConfig = config.get('Marking.dbConfig');

openConnection = function(callback){
  MongoClient.connect(dbConfig.uri, {native_parser:true}, function(err, db) {
    if (err) return callback(err);
    callback(err, db);
  });
};

module.exports = {
  openConnection: openConnection,
};

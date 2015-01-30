checkTask = function(db, task, callback){
  var collection = db.collection("tasks");
  collection.findOne({name:task}, function(err, task) {
      if(err) return callback(err);
      callback(err, task);
  });
};

module.exports = {
  checkTask: checkTask,
};
var fs = require('fs');
var parse = require('csv');

var parser = parse({delimiter: ','}, function(err, data){
  console.log(data);
});

readCsv = function(path){
  fs.createReadStream(path).pipe(parser);
};

module.exports = {
  readCsv: readCsv,
};

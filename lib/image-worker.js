var gm = require('gm');
var fs = require('fs');

gm("./assets/front-cover.pdf")
  .drawText(20, 20, 'Name Here')
  .draw(['image Over 440,680 0,0 assets/qrcodes/BGCZL.png'])
  .write('./assets/covers/output-image.pdf', function(e){
  console.log(e||'done'); // What would you like to do here?
});
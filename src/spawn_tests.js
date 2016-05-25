'use strict';

var spawn = require('child_process').spawn;
var StringDecoder = require('string_decoder').StringDecoder;
var path = require('path');

var spawnTests = () => {
  var s = spawn('node',['src/test_server.js'],{
    cwd: path.join(__dirname,'../'),
    detached: true
  });

  var sdecode = new StringDecoder('utf8');

  var outbuff = '';
  s.stdout.on('data',data => {
    let d = sdecode.write(data);
    outbuff += d;
    console.log(d);
  });
  s.stderr.on('data',data => {
    console.log(sdecode.write(data));
  });

  s.on('close',() => {
    //Plug in a reporter here to print out the raw output of the tests
    console.log(outbuff);
  })
}

spawnTests();
setInterval(() => {
  console.log("Spawning tests");
  spawnTests();
},300*1000);

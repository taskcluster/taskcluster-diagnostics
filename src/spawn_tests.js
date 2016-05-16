import { spawn } from 'child_process'
import {StringDecoder} from 'string_decoder'
import path from 'path'

var spawnTests = () => {
  var s = spawn('node',['build/test_server.js'],{
    cwd: path.join(__dirname,'../'),
    detached: true
  });

  var sdecode = new StringDecoder('utf8');

  s.stdout.on('data',data => {
    console.log(sdecode.write(data));
  })
  s.stderr.on('data',data => {
    console.log(sdecode.write(data));
  })
}

setInterval(() => {
  console.log("Spawning tests");
  spawnTests();
},30*1000);

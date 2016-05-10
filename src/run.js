'use strict';

var Mocha = require('mocha');
var path  = require('path');
var fs    = require('fs');
var _     = require('lodash');

const DIAGNOSTICS_ROOT = path.join(__dirname,'../diagnostics');

var getPaths = () => {
  let queue = fs.readdirSync(DIAGNOSTICS_ROOT);
  let files = [];

  while(queue.length > 0){
    let p = path.join(DIAGNOSTICS_ROOT,_.head(queue));
    let stat = fs.lstatSync(p);

    if (stat.isDirectory()) {
      //console.log("DIR:",p);
      _.concat(queue, fs.readdirSync(p));
    }else if (stat.isFile()) {
      //console.log("FILE:",p);
      if (p.indexOf('_test.js') !== -1) {
        files.push(p);
      }
    }
    queue = _.drop(queue);
  }

  return files;
}

var runDiagnostics = () => {
  let mocha = new Mocha({
    ui:       'tdd',
    reporter: 'spec'
  });
  let files = getPaths();
  console.log("Tests: ");
  
  files.map( file => {
    mocha.addFile(file);
    console.log(file);
  });

  mocha.run(failures => {
    console.log("Failures: %d",failures);
    process.exit(0);
  });
}

runDiagnostics();

module.exports = runDiagnostics;

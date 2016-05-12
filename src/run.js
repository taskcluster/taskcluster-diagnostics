'use strict';

var Mocha   = require('mocha');
var path    = require('path');
var fs      = require('fs');
var Promise = require('bluebird');
var _       = require('lodash');

const DIAGNOSTICS_ROOT = path.join(__dirname,'../diagnostics');

var getPaths = path_to_diagnostics => {

  if(!path_to_diagnostics){
    path_to_diagnostics = DIAGNOSTICS_ROOT;
  }
  let queue = fs.readdirSync(path_to_diagnostics);
  queue = queue.map(q => path.join(path_to_diagnostics,q));
  let files = [];

  while(queue.length > 0){
    let p = _.head(queue);
    let stat = fs.lstatSync(p);

    if (stat.isDirectory()) {
      let dir = fs.readdirSync(p)
      queue =  _.concat(queue,dir.map(sub => p+'/'+sub));
    }else if (stat.isFile()) {
      //console.log("FILE:",p);
      if (p.indexOf('test.js') !== -1) {
        files.push(p);
      }
    }
    queue = _.drop(queue);
  }

  return files;
}


var runTests = () => {
  let mocha = new Mocha();
  let output = {};
  getPaths().map(file => mocha.addFile(file) );

  return new Promise(function(resolve, reject) {
    mocha.run(failures => {
      return (!failures ? resolve : reject)(output);
    }).on('pass', test => output[ test.title ] = 'P')
    .on('fail', test => output[ test.title ] = 'F');
  });
}

module.exports = runTests;

'use strict';

import Mocha from 'mocha';
import path from 'path';
import fs from 'fs';
import base from 'taskcluster-base';
import helper from './diagnostics/helper';
import _ from 'lodash';

const DIAGNOSTICS_ROOT = path.join(__dirname,'diagnostics');

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
  return new Promise(function(resolve, reject) {
    let mocha = new Mocha();
    let output = {};
    getPaths().map(file => mocha.addFile(file) );
    let suite_stack = [];
    output.passing = [];
    output.failing = [];
    let setResult = (test, result) => {
      output[result].push( _.concat(suite_stack, test.title).join('/'))
    }
    let runner = mocha.run()
    .on('suite', suite => {
      suite_stack.push(suite.title);
    })
    .on('suite end', suite => {
      suite_stack = _.dropRight(suite_stack);
    })
    .on('pass', test => setResult(test,'passing'))
    .on('fail', test => setResult(test,'failing'))
    .on('end', () => {
      runner.abort()
      base.app.notifyLocalAppInParentProcess(helper.cfg.port);
      return resolve(output);
    });
  });
}

module.exports = runTests;

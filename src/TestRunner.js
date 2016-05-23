'use strict';

var Mocha = require('mocha');
var path = require('path');
var base = require('taskcluster-base');
var fs = require('fs');
var helper = require('./diagnostics/helper');
var Promise = require('bluebird');
var debug = require('debug')('diagnostics:runner');
var _ = require('lodash');

const DIAGNOSTICS_ROOT = path.join(__dirname,'diagnostics');

class TestRunner {
  constructor (path_to_diagnostics) {
    this.files = this._getPaths(path_to_diagnostics);
    this.mocha = new Mocha({ ui :'bdd'});
    debug("TESTS:",this.files);
    this.files.map(file => this.mocha.addFile(file));
  }

  _getPaths (path_to_diagnostics) {
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

  runTests () {
    let result = {};
    let suite_stack = [];
    result.passing = [];
    result.failing = [];

    let setResult = (test, testResult) => {
      result[testResult].push(_.concat(suite_stack,test.title).join('/'));
    }

    return new Promise((resolve, reject) => {
      this.mocha.run()
      .on('suite', suite => {
        suite_stack.push(suite.title);
      })
      .on('suite end', suite => {
        suite_stack = _.dropRight(suite_stack);
      })
      .on('pass', test => setResult(test, 'passing'))
      .on('fail', test => setResult(test, 'failing'))
      .on('end', () => {
        base.app.notifyLocalAppInParentProcess(helper.cfg.port);
        return resolve(result);
      });
    });
  }

}

module.exports = TestRunner;

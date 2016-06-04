'use strict';

var Mocha         = require('mocha');
var path          = require('path');
var base          = require('taskcluster-base');
var fs            = require('fs');
var helper        = require('../helper');
var EventEmitter  = require('events');
var Promise       = require('bluebird');
var debug         = require('debug')('diagnostics:runner');
var _             = require('lodash');


const DIAGNOSTICS_ROOT = path.join(__dirname,'../diagnostics');

/*
This imports tests from the diagnostics folder and runs them
*/

class TestRunner extends EventEmitter {
  
  constructor (path_to_diagnostics) {

    super();
    
    this.files = this._getPaths(path_to_diagnostics);
    this.mocha = new Mocha({ ui :'bdd'});
    this.files.map(file => this.mocha.addFile(file));

    debug("TESTS:",this.files);

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
      
        if (p.indexOf('test.js') !== -1 && p.indexOf('.map') === -1) {
          files.push(p);
        }
      }
      queue = _.drop(queue);
    }

    return files;
  }

  async runTests () {

    let that = this;
    
    let result = {};
    let suite_stack = [];
    result.pass = [];
    result.fail = [];

    let setResult = (test, testResult) => {
      result[testResult].push(_.concat(suite_stack,test.title).join('/'));
    }

    return new Promise((resolve, reject) => {
      this.mocha.run()
        .on('start',() => {
          that.emit('start');
        })

        .on('suite', suite => {
        suite_stack.push(suite.title);
        })

        .on('suite end', suite => {
        suite_stack = _.dropRight(suite_stack);
        })

        .on('pass', test => {
          setResult(test, 'pass');
          that.emit('pass', test);
        })

        .on('fail', test => {
          setResult(test, 'fail');
          that.emit('fail', test);
        })

        .on('end', () => {
          that.emit('end');         
          return resolve(result);
        });
    });
  }

  static createTestRunner (path) {
    return new TestRunner(path);
  }

}

module.exports = TestRunner;

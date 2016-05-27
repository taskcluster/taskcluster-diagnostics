'use strict';
var TestRunner    = require('./TestRunner');
var JSONReporter  = require('./Reporter').JSONReporter;
var debug         = require('debug')('diagnostics:test-server');
var assume        = require('assume');
var argv          = require('minimist')(process.argv.slice(2));

assume(argv.id).is.not.falsey();
assume(argv.id).is.a('string');

let testId = argv.id;

var run = () => {
  let tr = new TestRunner();
  let reporter = new JSONReporter(testId);
  //debug(reporter.makeResultString({ failing: [] }));
  return tr.runTests()
  .then(result => {
    debug(result);
    return reporter.upload(result).then(console.log);
  }); //Here's where the reporting code goes
}

run();

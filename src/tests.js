'use strict';
var TestRunner    = require('./runner/TestRunner');
var Reporter  = require('./reporter/Reporter');
var debug         = require('debug')('diagnostics:test-server');
var assume        = require('assume');
var argv          = require('minimist')(process.argv.slice(2));

assume(argv.id).is.not.falsey();
assume(argv.id).is.a('string');

let testId = argv.id;


var run = async () => {
  let tr = TestRunner.createTestRunner();
  let reporter = Reporter.createJSONReporter(testId);
//  tr.on('pass',console.log);
//  tr.on('fail',console.log);
  try{
    let result = await tr.runTests();
    debug(result);
    let uploadResult = await reporter.upload(result);
    console.log(uploadResult);
  } catch (err) {
    console.error(err);
  }
}

run();

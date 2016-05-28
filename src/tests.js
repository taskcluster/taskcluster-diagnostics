'use strict';
var TestRunner    = require('./TestRunner');
var JSONReporter  = require('./Reporter').JSONReporter;
var debug         = require('debug')('diagnostics:test-server');
var assume        = require('assume');
var argv          = require('minimist')(process.argv.slice(2));

assume(argv.id).is.not.falsey();
assume(argv.id).is.a('string');

let testId = argv.id;

var run = async () => {
  let tr = new TestRunner();
  let reporter = new JSONReporter(testId);

  try{
    let result = await tr.runTests()
    debug(result);
    let uploadResult = await reporter.upload(result);
    console.log(uploadResult);
  } catch (err) {
    console.error(err);
  }
}

run();

'use strict';
var TestRunner    = require('./runner/TestRunner');
var JSONReporter  = require('./reporter/Reporter').JSONReporter;
var debug         = require('debug')('diagnostics:test-server');

var run = async () => {
  let tr = new TestRunner();
  let result = await tr.runTests();
  console.log(result);
}

run();

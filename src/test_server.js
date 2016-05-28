'use strict';
var TestRunner    = require('./TestRunner');
var JSONReporter  = require('./Reporter').JSONReporter;
var debug         = require('debug')('diagnostics:test-server');

var run = async () => {
  let tr = new TestRunner();
  let result = await tr.runTests();
  console.log(result);
}

run();

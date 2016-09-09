'use strict';
var TestRunner    = require('./runner/TestRunner');
var debug         = require('debug')('diagnostics:test-server'); 

process.send = process.send || function (args) {};

var run = async () => {
  let tr = TestRunner.createTestRunner();
  try{
    let result = await tr.runTests();
    process.send(result);
  } catch (err) {
    console.error(err);
    process.send(null);
  }
}

run();

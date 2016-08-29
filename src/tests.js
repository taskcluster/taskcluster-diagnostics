'use strict';
var TestRunner    = require('./runner/TestRunner');
var debug         = require('debug')('diagnostics:test-server');

var run = async () => {
  let tr = TestRunner.createTestRunner();
//  tr.on('pass',console.log);
//  tr.on('fail',console.log);
  try{
    let result = await tr.runTests();
    process.send({ result });
  } catch (err) {
    console.error(err);
    process.send('error', new Error("Failed to run tests"));
  }
}

run();

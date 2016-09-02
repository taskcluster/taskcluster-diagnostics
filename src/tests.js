'use strict';
var TestRunner    = require('./runner/TestRunner');
var debug         = require('debug')('diagnostics:test-server'); 

var run = async () => {
  let tr = TestRunner.createTestRunner();
  try{
    let result = await tr.runTests();
    if(process.send){
      process.send(result);
    }
  } catch (err) {
    console.error(err);
    if(process.send){
      process.send(null);
    }
  }
}

run();

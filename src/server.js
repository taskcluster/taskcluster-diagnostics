'use strict';
const TestRunner = require('./TestRunner');

var runTests = () => {
  let testRunner = new TestRunner();
  return testRunner.run().then(output => {
    console.log(output);
  });
}

runTests();

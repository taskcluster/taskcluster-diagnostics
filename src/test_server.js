'use strict';
var TestRunner =  require('./TestRunner');
var Reporter   =  require('./Reporter');
var debug      =  require('debug')('diagnostics:test-server');

var run = () => {
  let tr = new TestRunner();
  let reporter = new Reporter();
  //debug(reporter.makeResultString({ failing: [] }));
  tr.runTests().then(debug); //Here's where the reporting code goes
}

run();

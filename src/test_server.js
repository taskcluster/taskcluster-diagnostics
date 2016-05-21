'use strict';
var TestRunner =  require('./TestRunner');
var Reporter   =  require('./Reporter');

var run = () => {
  let tr = new TestRunner();
  let reporter = new Reporter();
  tr.runTests().then(console.log);
}

run();

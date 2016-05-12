'use strict';
var runTests = require('./run');

runTests().then((output) => {
  console.log(output);
  process.exit(0);
}).catch((output) => {
  console.log(output);
  process.exit(0);
});

require('babel-core/register');
require('babel-polyfill');

import runTests from './run';

(async function run() {
  let result = await runTests();
  console.log(result);
})();

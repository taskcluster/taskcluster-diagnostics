require('babel-core/register');
require('babel-polyfill');

import runTests from './run';
import parse from './reporter';

var run = async () => {
  let raw = await runTests();
  console.log(parse(raw));
  return;
}

run();

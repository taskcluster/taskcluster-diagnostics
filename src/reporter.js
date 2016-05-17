'use strict';
var _ = require('lodash');
var debug = require('debug')('diagnostics:reporter');

var parse = result => {
  let passing = result.passing;
  let failing = result.failing;

  let passingComponents = _.uniq(passing.map(test => test.split('/')[0] ));
  let failingComponents = _.uniq(failing.map(test => test.split('/')[0] ));
  passingComponents = _.difference(passingComponents, failingComponents);

  let broken = {}, completed = {};
  failingComponents.forEach(component => {
    broken[component] = _.filter(failing, test => test.split('/')[0] === component)
  });

  passingComponents.forEach(component => {
    completed[component] = _.filter(passing, test => test.split('/')[0] === component)
  });
  return { broken , completed };
}

module.exports = parse;

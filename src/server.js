'use strict';
var base      = require('taskcluster-base');
var runTests  = require('./run');
var helper    = require('../diagnostics/helper')();


var app = base.app({
  port:       helper.cfg.port,
  forceSSL:   helper.cfg.forceSSL,
  trustProxy: helper.cfg.trustProxy,
  env:        helper.cfg.env
});

runTests();

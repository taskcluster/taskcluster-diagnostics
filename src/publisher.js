'use strict';

/*
This module creates and exports a json
object containing a publisher, validator, and
monitor configured using exchanges.js
*/

var base 				= require('taskcluster-base');
var helper 			= require('../helper');
var exchanges 	= require('../exchanges');
var _    				= require('lodash');

let cfg = helper.cfg;

let setupPublisher = (process, profile) =>{

  let validator = base.validator({
    aws: cfg.aws,
    prefix: 'diagnostics/v1'
  });

  let monitor = base.monitor({
    project: 'taskcluster-diagnostics',
    credentials: cfg.taskcluster.credentials,
    mock: profile === 'test',
    process
  });

  let publisher = exchanges.setup({
    credentials: cfg.pulse,
    exchangePrefix: cfg.app.exchangePrefix,
    validator,
    referencePrefix: 'diagnostics/v1/exchanges.json',
    publish: cfg.app.publishMetaData,
    aws: cfg.aws,
    monitor: monitor.prefix('publisher')
  });

  return publisher;
}

module.exports = setupPublisher;

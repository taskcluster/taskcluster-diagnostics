'use strict';

var taskcluster         = require('taskcluster-client');
var base                = require('taskcluster-base');

/**
 * Initialize helper with all the configuration we have.
 */
var initialize = function() {
  // Construct helper we can return
  var helper = {};

  // Load configuration
  helper.cfg = base.config({
    defaults:     require('../config/defaults'),
    profile:      require('../config/' + initialize.defaultProfile),
    // Environment variables to load configuration from
    envs: [
      'taskcluster_credentials_clientId',
      'taskcluster_credentials_accessToken',
      'pulse_username',
      'pulse_password'
    ],
    // Will load configration from taskcluster-diagnostics.conf.json
    // this is useful for local development as the file is .gitignored
    filename:     'taskcluster-diagnostics'
  });

  // Create a PulseTestReceiver
  helper.receiver = new base.testing.PulseTestReceiver(
    helper.cfg.get('pulse'),
    require('mocha')          // Just to make it gets the same version as us
  );

  // Create a queue instance that the tests can use
  helper.queue = new taskcluster.Queue({
    credentials:      helper.cfg.get('taskcluster:credentials')
  });
  helper.queueEvents = new taskcluster.QueueEvents();

  // Return helper
  return helper;
};

// Allow bin/run-diagnostics.js to provide a default profile
initialize.defaultProfile = undefined;

// Export initialize as the module
module.exports = initialize;

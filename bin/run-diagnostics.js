#!/usr/bin/env node
/* jslint node: true */

'use strict';

var base        = require('taskcluster-base');
var debug       = require('debug')('diagnostics:bin:run-diagnostics');
var Mocha       = require('mocha');
var path        = require('path');
var Promise     = require('promise');
var utils       = require('../diagnostics/utils');

/** Run diagnostics */
var runDiagnostics = function() {

  // Load configuration
  var cfg = base.config({
    defaults:     require('../config/defaults'),
    profile:      require('../config/' + profile),
    // Environment variables to load configuration from
    envs: [
      'taskcluster_credentials_clientId',
      'taskcluster_credentials_accessToken'
    ],
    // Will load configration from taskcluster-diagnostics.conf.json
    // this is useful for local development as the file is .gitignored
    filename:     'taskcluster-diagnostics'
  });

  // Initialize diagnostic utilites, this will provide instances of things
  // like taskcluster-client objects, utilities for listening for AMQP messages
  // and basically anything that helps avoid repretitive code.
  // For ease of use we'll let it store configuration/credentials in its global
  // scope...
  utils.initialize(cfg.get());

  // Create mocha instance
  var mocha = new Mocha({
    ui:         'tdd',
    reporter:   'spec'
  });

  // Add all mocha diagnostics test files
  [
    // Tests against production queue
    'queue/ping.js',
    'queue/createTask.js',
    'queue/helloWorld.js'
  ].forEach(function(filename) {
    mocha.addFile(path.join(__dirname, '..', 'diagnostics', filename));
  });

  // Return a promise that we ran diagnostics successfully
  return new Promise(function(accept, reject) {
    mocha.run(function(failures) {
      // Notify parent process, so that run-diagnostics can run using LocalApp
      base.app.notifyLocalAppInParentProcess();

      // Look at failures and resolve the promise we returned
      debug("Ran mocha and got %s failures", failures);
      if (failures > 0) {
        return reject();
      }
      accept();
    });
  });
};

// If run-diagnostics.js is executed call runDiagnostics
if (!module.parent) {
  // Find configuration profile
  var profile = process.argv[2];
  if (!profile) {
    console.log("Usage: run-diagnostics.js [profile]");
    console.error("ERROR: No configuration profile is provided");
    process.exit(1);
  }
  // Run diagnostics with given profile
  runDiagnostics(profile).then(function() {
    debug("Ran diagnostics");
    // We should exit zero
    process.exit(0);
  }).catch(function(err) {
    debug("Failed to run diagnostics, err: %s, as JSON: %j", err, err, err.stack);
    // If we didn't run diagnostics we should crash
    process.exit(1);
  });
}

// Export runDiagnostics in-case anybody cares
module.exports = runDiagnostics;


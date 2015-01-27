'use strict';
var taskcluster         = require('taskcluster-client');

/** Initialize utilities with all the configuration we have */
var initialize = function(options) {
  // Store options globally, so we can access them from tests
  exports.options = options;

  // Create a queue instance that the tests can use
  exports.queue = new taskcluster.Queue({
    credentials:      options.taskcluster.credentials
  });
  exports.queueEvents = new taskcluster.QueueEvents();
};

// Export the initialize function
exports.initialize = initialize;


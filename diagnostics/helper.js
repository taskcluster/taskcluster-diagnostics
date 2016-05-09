'use strict';

var taskcluster = require('taskcluster-client');
var base        = require('taskcluster-base');

var getHelper = profile => {
  
  let helper = {};

  helper.cfg = base.config({ profile });

  helper.queue = new taskcluster.Queue({
    credentials:  helper.cfg.taskcluster.credentials
  });

  helper.queueEvents = new taskcluster.QueueEvents();

  helper.listener = new taskcluster.PulseListener({
    credentials: helper.cfg.pulse
  });

  return helper;
}

module.exports = getHelper();

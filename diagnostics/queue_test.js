'use strict';

describe('Testing Queue', function () {
  var assert      = require('assert');
  var helper      = require('./helper')();
  var slugid      = require('slugid');
  var taskcluster = require('taskcluster-client');
  var debug       = require('debug')('queue:test');

  if(!helper.cfg.taskcluster.credentials.accessToken){
    debug("Skipping test due to missing credentials");
    return;
  }

  it('can define task',function (done) {
    this.timeout(30*1000);
    let taskId = slugid.v4();

    let getMessage = new Promise((resolve, reject) => {
      return helper.listener.on('message', message => {
        return resolve(message.payload);
      }).on('error', error => {
        throw new Error("Error defining task");
      });
    });

    helper.listener.bind(helper.queueEvents.taskDefined({ taskId }));
    return helper.listener.resume().then(() => {

      debug("Task defined with taskId %s", taskId);
      return helper.queue.defineTask(taskId,helper.simpleTaskDef(taskId));

    }).then(() => {
      return getMessage;

    }).then(payload => {

      debug('Message payload: %s',JSON.stringify(payload));
      assert(payload.status.taskId === taskId, "Received wrong taskId");
      return done();

    });

  });

  after(function () {
    helper.listener.close();
  })
});

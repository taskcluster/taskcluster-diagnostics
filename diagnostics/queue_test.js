'use strict';

suite("queue tests", function () {
  var assert      = require('assert');
  var helper      = require('./helper').getHelper();
  var slugid      = require('slugid');
  var taskcluster = require('taskcluster-client');

  it('should create dummy task',() => {
    var taskId = slugid.v4();
    helper.listener.bind(helper.queueEvents.taskDefined({ taskId }));

    let receiveMessage = new Promise((resolve, reject) => {
      listener.on('message', message => resolve(message));
    });

    helper.listener.resume().then(() => {
      let deadline = new Date();
      deadline.setHours(deadline.getHours() + 2);
      return helper.queue.defineTask(taskId,{
        provisionerId:    "test-dummy-provisioner",
        workerType:       "dummy-worker-type",
        schedulerId:      "test-dummy-scheduler",
        created:          (new Date()).toJSON(),
        deadline:         deadline.toJSON(),
        payload:          {},
        metadata: {
          name:           "Print `'Hello World'` Once",
          description:    "This task will prìnt `'Hello World'` **once**!",
          owner:          "jojensen@mozilla.com",
          source:         "https://github.com/taskcluster/taskcluster-events"
        },
        tags: {
          objective:      "Test taskcluster-event"
        }
      });
    }).then(result => {
      assert(result.payload.status.taskId === taskId, "Got wrong task id");
      return receiveMessage;
    }).then(message => {
      console.log(message);
    });
  });
});

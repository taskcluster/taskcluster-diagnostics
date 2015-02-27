/* global suite, test */
/* jslint node: true */

"use strict";

suite("test environment variables", function() {
  var assert              = require('assert');
  var helper              = require('../helper')();
  var slugid              = require('slugid');
  var taskcluster         = require('taskcluster-client');
  var debug               = require('debug')('diagnostics:queue:createTask');

  // Set an excessive timeout
  this.timeout(30 * 60 * 1000);

  test("exit $MY_ENV_VAR; with MY_ENV_VAR = 0", function() {
    var taskId = slugid.v4();

    return helper.receiver.listenFor(
      'defined',
      helper.queueEvents.taskDefined({taskId: taskId})
    ).then(function(){
      console.log("listenFor 'defined' done function");
      console.log("Submitting task: %s", taskId);

      // Create task
      return helper.queue.createTask(taskId, {
        provisionerId:    'aws-provisioner',
        workerType:       'v2',
        created:          taskcluster.utils.fromNow(),
        deadline:         taskcluster.utils.fromNow('1 hour'),
        payload:          {
          image:          "ubuntu:14.04",
          command:        ["/bin/bash", "-c", "exit $MY_ENV_VAR;"],
          env: {
            MY_ENV_VAR:   '0'
          },
          maxRunTime:     20 * 60
        },
        metadata: {
          name:           "Completed task test",
          description:    "Task for docker-worker that tests environment " +
                          "variables and completes successfully",
          owner:          "nobody@localhost.local",
          source:         "https://github.com/taskcluster/taskcluster-diagnostics"
        }
      });
    }).then(function(){
      return helper.receiver.listenFor(
        'taskPending',
        helper.queueEvents.taskPending({taskId: taskId}));
    }).then(function(){
      console.log("scheduling Task");
      return helper.queue.scheduleTask(taskId); //note, here we don't pass an object?!
    }).then(function(){
      //console.log("waiting for task pending")
      //return helper.receiver.waitFor('taskPending');

    });
  });
});

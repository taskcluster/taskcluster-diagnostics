suite("test environment variables", function() {
  var assert              = require('assert');
  var helper              = require('../helper')();
  var slugid              = require('slugid');
  var taskcluster         = require('taskcluster-client');
  var debug               = require('debug')('diagnostics:queue:createTask');

  // Set an excessive timeout
  this.timeout(30 * 60 * 1000);

  test("exit $MY_ENV_VAR; with MY_ENV_VAR = 1", function() {
    // Create a taskId
    var taskId = slugid.v4();

    // Start listening for a task-failed message with the generated taskId
    return helper.receiver.listenFor(
      'failed',
      helper.queueEvents.taskFailed({taskId: taskId})
    ).then(function() {
      // Create task
      debug("Submitting task: %s", taskId);
      return helper.queue.createTask(taskId, {
        provisionerId:    'aws-provisioner',
        workerType:       'v2',
        created:          taskcluster.utils.fromNow(),
        deadline:         taskcluster.utils.fromNow('1 hour'),
        payload:          {
          image:          "ubuntu:14.04",
          command:        ["/bin/bash", "-c", "exit $MY_ENV_VAR;"],
          env: {
            MY_ENV_VAR:   '1'
          },
          maxRunTime:     20 * 60
        },
        metadata: {
          name:           "Dummy Test Task",
          description:    "Task for docker-worker that tests environment " +
                          "variables and completes unsuccessfully",
          owner:          "nobody@localhost.local",
          source:         "https://github.com/taskcluster/taskcluster-diagnostics"
        }
      });
    }).then(undefined, function(err) {
      // Print the error
      debug("queue.createTask error: %j", err);
      // Retrow the error
      throw err;
    }).then(function() {
      return helper.receiver.waitFor('failed');
    }).then(function(message) {
      assert(message.payload.status.taskId === taskId,
             "Expected message to have taskId");
    });
  });

  test("exit $MY_ENV_VAR; with MY_ENV_VAR = 0", function() {
    // Create a taskId
    var taskId = slugid.v4();
    // Start listening for a task-completed message with the generated taskId
    return helper.receiver.listenFor(
      'completed',
      helper.queueEvents.taskCompleted({taskId: taskId})
    ).then(function() {
      debug("Submitting task: %s", taskId);
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
          name:           "Dummy Test Task",
          description:    "Task for docker-worker that tests environment " +
                          "variables and completes successfully",
          owner:          "nobody@localhost.local",
          source:         "https://github.com/taskcluster/taskcluster-diagnostics"
        }
      });
    }).then(undefined, function(err) {
      // Print the error
      debug("queue.createTask error: %j", err);
      // Retrow the error
      throw err;
    }).then(function() {
      return helper.receiver.waitFor('completed');
    }).then(function(message) {
      assert(message.payload.status.taskId === taskId,
             "Expected message to have taskId");
    });
  });
});

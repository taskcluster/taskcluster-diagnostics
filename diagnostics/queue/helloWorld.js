/* global suite, test */
/* jslint node: true */

"use strict";

// Global reference to listener:
var listener = null;

// clean up after tests that creates a listener
var teardown = function() {
  if (listener) {
    listener.close();
    listener = null;
  }
};

suite("helloWorld", function() {
  var assert              = require('assert');
  var base                = require('taskcluster-base');
  var helper              = require("../helper")();
  var slugid              = require("slugid");
  var debug               = require("debug")("diagnostics:queue:helloWorld");
  var taskcluster         = require("taskcluster-client");
  var Promise             = require("promise");

  // Set an excessive timeout:
  this.timeout(10 * 60 * 1000);

  test("Can create docker-worker task (workerType: v2)", function() {
    // Create a taskId (url-safe base64 encoded uuid without '=' padding):
    var taskId = slugid.v4();
    debug("TaskId is: " + taskId);

    return helper.receiver.listenFor('docker-workerType-v2-task', helper.queueEvents.taskCompleted({
      taskId: taskId
    })).then(function() {
      return helper.queue.createTask(taskId, {
        provisionerId:    "aws-provisioner",
        workerType:       "v2",
        created:          new Date().toJSON(),
        deadline:         new Date(new Date().getTime() + 60 * 60 * 1000).toJSON(),
        payload:          {
          image:          "ubuntu:14.04",
          command:        ["/bin/bash", "-c", "echo 'Hello World'"],
          maxRunTime:     1000,
        },
        metadata: {
          name:           "Docker Hello World test",
          description:    "Task that tests Docker image creation and creating a simple artifact.",
          owner:          "nobody@localhost.local",
          source:         "https://github.com/taskcluster/taskcluster-diagnostics"
        }
      });
    }).then(function(){
      return helper.receiver.waitFor('docker-workerType-v2-task');
    }).then(function(message){
        assert(message.payload.status.taskId === taskId, "Got wrong taskId");
        assert(message.payload.success === true, "Task failed.");
    });
  });
});

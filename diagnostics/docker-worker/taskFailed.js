/* global suite, test */
/* jslint node: true */
"use strict";

/*
A taskcluster integration test which exercises the following API endpoints:
taskPending, scheduleTask, taskRunning, claimTask, taskComplete, createArtifact,
buildUrl and reportComplete.
*/

suite("Integration test with task exiting 1", function() {
  var assert              = require('assert');
  var helper              = require('../helper')();
  var slugid              = require('slugid');
  var taskcluster         = require('taskcluster-client');
  var debug               = require('debug')('diagnostics:queue:createTask');
  var request             = require('superagent-promise');

  // Set an excessive timeout
  this.timeout(30 * 60 * 1000);

  test("exit $MY_ENV_VAR; with MY_ENV_VAR = 1", function() {
    var taskId = slugid.v4();
    debug("TaskId is: " + taskId);
    var testArtifact = '{"public test artifact": "foobar"}';
    var testArtifactName = 'public/public-test-artifact.txt';
    var runID = 0;

    return helper.receiver.listenFor(
      'defined',
      helper.queueEvents.taskDefined({taskId: taskId})
    ).then(function(){
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
          name:           "Completed task test",
          description:    "Task for docker-worker that tests environment " +
                          "variables and fails to complete",
          owner:          "nobody@localhost.local",
          source:         "https://github.com/taskcluster/taskcluster-diagnostics"
        }
      });
    }).then(function(){
      return helper.receiver.listenFor(
        'taskPending',
        helper.queueEvents.taskPending({taskId: taskId}));
    }).then(function(){
      debug("Scheduling task");
      return helper.queue.scheduleTask(taskId);
    }).then(function(){
      return helper.receiver.listenFor(
        'taskRunning',
        helper.queueEvents.taskRunning({taskId: taskId}));
    }).then(function(){
      debug("Claiming task");
      return helper.queue.claimTask(taskId, 0, {
        workerGroup: "test-worker-group",
        workerId: "test-worker-id"
      });
    }).then(function(){
      return helper.receiver.listenFor(
        'taskFailed',
        helper.queueEvents.taskFailed({taskId: taskId}));
    }).then(function(){
      /*
      In this phase of the test we create an artifact and then retrieve it
      and assert that retrieved === expected. To do this we:
      1) ask the Queue to provide us with a URL we can PUT to, by calling
         queue.createArtifact.
      2) Then we submit a PUT with the test artifact to the url we were give.
      3) We use queue.buildURL to get the URL at which the test artifact is
         available, do a GET and compare the received artifact to the
         expected artifact.
      */
      var artifactOptions = {
        "storageType": "s3",
        "expires": taskcluster.utils.fromNow("1 hour"),
        "contentType": "application/json",
      };
      return helper.queue.createArtifact(taskId, runID, testArtifactName, artifactOptions);
    }).then(function(queueResponse){
      // 2) We've received a response from the Queue, it should have a PUT URL in it.
      debug("Creating artifact");
      if (queueResponse.putUrl) {
        return request.put(queueResponse.putUrl)
            .set('Content-Type', 'application/json')
            .set("Content-Length", testArtifact.length)
            .send(testArtifact).end();
      } else {
        throw new Error("Did not receive a putUrl from the Queue");
      }
    })
    .then(function(){
      // 3) GET the artifact
      var artifactUrl = helper.queue.buildUrl(helper.queue.getArtifact, taskId, runID, testArtifactName);
      return request.get(artifactUrl).end().then(function(response) {
        assert(response.statusCode === 200, "Expected statusCode 200");
        assert(response.text === testArtifact, "Received artifact does not match expected.");
      });
    }).then(function () {
      return helper.queue.reportFailed(taskId, 0);
    }).then(function(){
      return helper.receiver.waitFor('taskFailed');
    });
  });
});


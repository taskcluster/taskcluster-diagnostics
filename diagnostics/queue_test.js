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

  it('can create task',function (done) {
    this.timeout(30*1000);
    let taskId = slugid.v4();
    let deadline = new Date();
    deadline.setHours(deadline.getHours() + 2);
    return helper.queue.createTask(taskId,{
        provisionerId:    "aws-provisioner-v1",
        workerType:       "tutorial",
        created:          (new Date()).toJSON(),
        deadline:         deadline.toJSON(),
        payload:  {
          image:          "ubuntu:13.10",
          command:  [
            "/bin/bash",
            "-c",
            "echo \"Hello World\""
          ]
        },
        metadata: {
          name:           "Example Task",
          description:    "This task will prìnt `'Hello World'` **once**!",
          owner:          "chinmaykousik1@gmail.com",
          source:         "https://github.com/ckousik/taskcluster-diagnostics"
        },
        tags: {
          objective:      "taskcluster-diagnostics queue test"
        }
      }).then(payload => {
      debug('Message payload: %s',JSON.stringify(payload));
      assert(payload.status.taskId === taskId, "Received wrong taskId");
      return done();
    });
  });

  return;
});

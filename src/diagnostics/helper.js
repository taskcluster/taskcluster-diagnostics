
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

  helper.simpleTaskDef = taskId => {
    let deadline = new Date();
    deadline.setHours(deadline.getHours() + 2);

    return {
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
    };
  }

  return helper;
}

module.exports = getHelper();


var taskcluster = require('taskcluster-client');
var base        = require('taskcluster-base');

/* This module contains helper functions and objects
 * to be used throughout diagnostics.
 */

var getHelper = profile => {

  let helper = {};

  helper.cfg = base.config({profile});

  helper.queue = new taskcluster.Queue({
    credentials:  helper.cfg.taskcluster.credentials,
  });

  helper.queueEvents = new taskcluster.QueueEvents();

  helper.listener = new taskcluster.PulseListener({
    credentials: helper.cfg.pulse,
  });

  helper.createNewListener = () => {
    return new taskcluster.PulseListener({
      credentials: helper.cfg.pulse,
    });
  };

  helper.secrets = new taskcluster.Secrets({
    credentials: helper.cfg.taskcluster.credentials,
  });

  helper.index = new taskcluster.Index({
    credentials: helper.cfg.taskcluster.credentials,
  });

  helper.simpleTaskDef = taskId => {
    let deadline = new Date();
    deadline.setHours(deadline.getHours() + 2);

    return {
      provisionerId:    'aws-provisioner-v1',
      workerType:       'tutorial',
      created:          (new Date()).toJSON(),
      deadline:         deadline.toJSON(),
      schedulerId:      'tc-diagnostics',
      payload:  {
        image:          'ubuntu:13.10',
        command:  [
          '/bin/bash',
          '-c',
          'echo "Hello World"',
        ],
        maxRunTime: 600,
      },
      metadata: {
        name:           'Example Task',
        description:    'This task will prìnt `\'Hello World\'` **once**!',
        owner:          'chinmaykousik1@gmail.com',
        source:         'https://github.com/ckousik/taskcluster-diagnostics',
      },
      tags: {
        objective:      'taskcluster-diagnostics queue test',
      },
    };
  };

  helper.exitTaskDefEnvVars = (taskId, status) => {
    let deadline = new Date();
    deadline.setHours(deadline.getHours() + 2);

    return {
      provisionerId:    'aws-provisioner-v1',
      workerType:       'tutorial',
      created:          (new Date()).toJSON(),
      deadline:         deadline.toJSON(),
      schedulerId:      'tc-diagnostics',
      payload:  {
        image:          'ubuntu:13.10',
        command:  [
          '/bin/bash',
          '-c',
          'exit $MY_ENV_VAR',
        ],
        env: {
          MY_ENV_VAR: status,
        },
        maxRunTime: 600,
      },
      metadata: {
        name:           'Example Task',
        description:    'This task will prìnt `\'Hello World\'` **once**!',
        owner:          'chinmaykousik1@gmail.com',
        source:         'https://github.com/ckousik/taskcluster-diagnostics',
      },
      tags: {
        objective:      'taskcluster-diagnostics queue test',
      },
    };
  };

  return helper;
};

module.exports = getHelper();

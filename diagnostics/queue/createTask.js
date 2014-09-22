suite("createTask", function() {
  var assert              = require('assert');
  var utils               = require('../utils');
  var slugid              = require('slugid');
  var taskcluster         = require('taskcluster-client');
  var debug               = require('debug')('diagnostics:queue:createTask');

  // Set an excessive timeout
  this.timeout(60 * 1000);

  test("can create trivial task", function() {
    // Sanity check that utils.queue is an instanceof taskcluster.Queue
    // (just because this is the first test were we use it).
    assert(utils.queue instanceof taskcluster.Queue,
           "Something is wrong with utils, expected an instance of queue");

    // Create a taskId (url-safe base64 encoded uuid without '=' padding)
    var taskId = slugid.v4();

    // This is the simplest task we can create.... the provisionerId and
    // workerType doesn't (and shouldn't) exist. So this task will never be
    // executed... It'll eventually go past deadline and be resolved as failed,
    // but that'll take a few days. We just do this to test that the queue will
    // accept tasks. After this we can test if we can submit tasks that are
    // picked up by a workerType and listen for AMQP messages...
    return utils.queue.createTask(taskId, {
      provisionerId:    'dummy-test-provisioner',
      workerType:       'dummy-worker-type',
      created:          new Date().toJSON(),
      deadline:         new Date(new Date().getTime() + 60 * 60 * 1000).toJSON(),
      payload:          {},
      metadata: {
        name:           "Dummy Test Task",
        description:    "Task that tests task submission, nothing else!",
        owner:          "nobody@localhost.local",
        source:         "https://github.com/taskcluster/taskcluster-diagnostics"
      }
    }).then(undefined, function(err) {
      // Print the error
      debug("queue.createTask error: %j", err);
      // Retrow the error
      throw err;
    });
    // TODO: Listen for task-defined and task-pending messages, they should be
    //       published immediately...
  });
});

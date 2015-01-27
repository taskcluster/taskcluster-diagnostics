suite("createTask", function() {
  var assert              = require('assert');
  var helper              = require('../helper')();
  var slugid              = require('slugid');
  var taskcluster         = require('taskcluster-client');
  var debug               = require('debug')('diagnostics:queue:createTask');

  // Set an excessive timeout
  this.timeout(60 * 1000);

  test("can create dummy task", function() {
    // Sanity check that utils.queue is an instanceof taskcluster.Queue
    // (just because this is the first test were we use it).
    assert(helper.queue instanceof taskcluster.Queue,
           "Something is wrong with utils, expected an instance of queue");

    // Create a taskId (url-safe base64 encoded uuid without '=' padding)
    var taskId = slugid.v4();

    // Start listening for a task-defined message with the generated taskId
    return helper.receiver.listenFor(
      'dummy-task-defined',
      helper.queueEvents.taskDefined({taskId: taskId})
    ).then(function() {
      // This is the simplest task we can create.... the provisionerId and
      // workerType doesn't (and shouldn't) exist. So this task will never be
      // executed... It'll eventually go past deadline and be resolved as failed,
      // but that'll take a few days. We just do this to test that the queue will
      // accept tasks. After this we can test if we can submit tasks that are
      // picked up by a workerType and listen for AMQP messages...
      return helper.queue.createTask(taskId, {
        provisionerId:    'dummy-test-provisioner',
        workerType:       'dummy-worker-type',
        created:          taskcluster.utils.fromNow(),
        deadline:         taskcluster.utils.fromNow('1 hour'),
        payload:          {},
        metadata: {
          name:           "Dummy Test Task",
          description:    "Task that tests task submission, nothing else!",
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
      // For the message we started listening for... Specifically the
      // task-defined message.
      return helper.receiver.waitFor('dummy-task-defined');
    });
  });
});

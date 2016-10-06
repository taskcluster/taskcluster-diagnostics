'use strict';
describe('DockerWorker', function () {
  var taskcluster = require('taskcluster-client');
  var helper      = require('../../helper');
  var slugid      = require('slugid');
  var debug       = require('debug')('worker:test');
  var assume      = require('assume');
  var request     = require('superagent-promise')(require('superagent'), require('bluebird'));

  var currentListener = null;
  var failedListener = null;
  var exceptionListener = null;

  it("should create and complete a task",async function (done) {
    this.timeout(120*60*1000);
    let taskId = slugid.nice();
    let listener = helper.createNewListener();
    currentListener = listener;
    failedListener = helper.createNewListener();
    exceptionListener = helper.createNewListener();

    debug("TaskId", taskId);

    let taskCompleted = new Promise((resolve, reject) => {
      return listener.on('message', message => {
        debug(message.exchange);
        return resolve(message);
      }).on('error', reject);
    });

    failedListener.on('message', message => {
      debug(message);
      done(`Task ${ taskId } failed.`);
    });

    exceptionListener.on('message', message => {
      debug(message);
      done(`Taks ${ taskId } caused and exception.`);
    })

    try{
      await listener.bind(helper.queueEvents.taskCompleted({ taskId }));
      debug("Bound to taskCompleted");
      await failedListener.bind(helper.queueEvents.taskFailed({ taskId }));
      debug("Bound to taskFailed");
      await exceptionListener.bind(helper.queueEvents.taskException({ taskId }));
      debug("Bound to taskException");
      await listener.resume();
      await failedListener.resume();
      await exceptionListener.resume();
      debug("Listening...");
      await helper.queue.createTask(taskId, helper.simpleTaskDef(taskId));
      debug("Task created...");
      await helper.queue.scheduleTask(taskId);
      debug("Task scheduled...");
      await taskCompleted;
      debug('Task completed');
      done();
    } catch (err) {
      done(err);
    }
  });

  it('should create and fail a task', async function (done) {
    this.timeout(120*60*1000);
    let taskId = slugid.nice();
    debug("TaskId", taskId);
    let listener = helper.createNewListener();
    currentListener = listener;
    exceptionListener = helper.createNewListener();

    let taskFailed = new Promise((resolve, reject) => {
      return listener.on('message', resolve).on('error', reject);
    });
    
    exceptionListener.on('message', message => {
      debug(message);
      done(`Taks ${ taskId } caused and exception.`);
    });


    try{
      await listener.bind(helper.queueEvents.taskFailed({ taskId }));
      debug("Bound to taskFailed");
      await exceptionListener.bind(helper.queueEvents.taskException({ taskId }));
      debug("Bound tp task exception");
      await listener.resume();
      debug("Listening...");
      await helper.queue.createTask(taskId, helper.exitTaskDefEnvVars(taskId,1));
      debug("Task created...");
      await helper.queue.scheduleTask(taskId);
      debug("Task scheduled");
      await taskFailed;
      debug("Task Failed");
      return done();
    } catch (err) {
      done(err);
    }
  });

  it('should access created artifacts', async function (done) {
    this.timeout(120*60*1000);

    let taskId = slugid.nice();
    debug("TaskId", taskId);

    let listener = helper.createNewListener();
    currentListener = listener;
    failedListener = helper.createNewListener();
    exceptionListener = helper.createNewListener();

    failedListener.on('message', message => {
      done(`Task ${ taskId } failed.`);
    });
    
    exceptionListener.on('message', message => {
      debug(message);
      done(`Taks ${ taskId } caused and exception.`);
    });

    let taskCompleted = new Promise((resolve, reject) => {
      return listener.on('message', message => {
        debug(message.exchange);
        return resolve(message);
      }).on('error', reject);
    });

    try{
      await listener.bind(helper.queueEvents.taskCompleted({ taskId }));
      debug("Bound to task completed.");
      await failedListener.bind(helper.queueEvents.taskFailed({ taskId }));
      debug("Bound to task failed.");
      await exceptionListener.bind(helper.queueEvents.taskException({ taskId }));
      debug("Bound to taskException.");
      await listener.resume();
      await failedListener.resume();
      debug("Listening");
      await helper.queue.createTask(taskId, helper.simpleTaskDef(taskId));
      debug("Task created");
      await helper.queue.scheduleTask(taskId);
      debug("Task scheduled");
      await taskCompleted;
      debug("Task completed");

      let artifactName = 'public/logs/live_backing.log';
      let url = helper.queue.buildUrl(helper.queue.getArtifact, taskId, 0, artifactName);
      let response = await request.get(url).end();
      debug("Artifact retrieved");
      debug(response.text);
      assume(response.statusCode).equals(200);
      done();
    } catch (err) {
      done(err);as
    }finally {
      currentListener.close(); //Added for safety
    }

  });

  afterEach(() => {
    currentListener.close();
    if (failedListener != null) {
      failedListener.close();
      failedListener = null;
    }
    if (exceptionListener != null) {
      exceptionListener.close();
      exceptionListener = null;
    }
  });

});

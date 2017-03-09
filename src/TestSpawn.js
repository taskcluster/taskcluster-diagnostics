
var spawn         = require('child_process').spawn;
var StringDecoder = require('string_decoder').StringDecoder;
var path          = require('path');
var slugid        = require('slugid');
var Reporter      = require('./reporter/Reporter');
var debug         = require('debug')('spawn');
var base          = require('taskcluster-base');
var assume        = require('assume');
/*
  This module generates a testId and spawns a TestRunner which runs tests and
  uploads raw logs.
  The uploading and running will be separated soon
*/

class TestSpawn {
  
  constructor() {
    this.log_reporter = null;
    this.json_reporter = null;

    this._spawnTests = this._spawnTests.bind(this);
    this._uploadLogs = this._uploadLogs.bind(this);
    this.json_result = {
      pass: [],
      fail: [],
    };
  }

  async _spawnTests() {
    
    let testId = slugid.nice();

    this.outbuff = '';
    
    this.log_reporter = Reporter.createLogReporter(testId);
    this.json_reporter = Reporter.createJSONReporter(testId);
    debug('Running tests with id', testId);
    
    let startMessage = 'Test started at ' + (new Date()).toJSON() + '\n';
    this.outbuff += startMessage;
    debug(startMessage);
    
    let decoder = new StringDecoder('utf8');

    let addToBuffer = data => {
      let str = decoder.write(data);
      this.outbuff += str;
      console.log(str);
    };

    this.testProcess = spawn('node', ['lib/tests.js'], {
      cwd: path.join(__dirname, '../'),
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });

    this.testProcess.stdout.on('data', addToBuffer);
    this.testProcess.stderr.on('data', addToBuffer);

    this.testProcess.on('message', (data) => {
      this.json_result = data;
      console.log(data);
    });

    return new Promise ((resolve, reject) =>{
      return this.testProcess.on('close', async () => {
        var endMessage = 'Tests ended at '+ (new Date()).toJSON() + '\n';
        this.outbuff += endMessage;
        return resolve();
        
      }).on('error', async (error) => {
        return reject(error);
      });      
    });

  }

  async _uploadLogs() {
    
    let raw_key = await this.log_reporter.upload(this.outbuff);
    let json_key = await this.json_reporter.upload(this.json_result);
    return {raw_key, json_key};
  }

  static async runTests() {
    let ts = new TestSpawn();
    await ts._spawnTests();
    let keys = await ts._uploadLogs();
    debug(keys);
    return {
      keys,
      result: ts.json_result,
    };
  }

}

module.exports = TestSpawn;

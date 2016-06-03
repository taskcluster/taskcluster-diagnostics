'use strict';

var spawn         = require('child_process').spawn;
var StringDecoder = require('string_decoder').StringDecoder;
var path          = require('path');
var slugid        = require('slugid');
var LogReporter   = require('./reporter/Reporter').LogReporter;

/*
  This module generates a testId and spawns a TestRunner which runs tests and
  uploads raw logs.
  The uploading and running will be separated soon
*/

class TestSpawn {
  constructor () {
    this.reporter = new LogReporter();
    this.decoder = new StringDecoder('utf8');

    this._spawnTests = this._spawnTests.bind(this);
    this.run = this.run.bind(this);
  }

  _spawnTests () {
    
    let testId = slugid.nice();

    this.outbuff = '';
    
    this.reporter.setTestId(testId);
    console.log("Running tests with id",testId);
    
    let startMessage = "Test started at " + (new Date()).toJSON() + "\n";
    this.outbuff += startMessage;
    console.log(startMessage);

    let addToBuffer = data => {
      let str = this.decoder.write(data);
      this.outbuff += str;
      console.log(str);
    }

    this.testProcess = spawn('node',['lib/tests.js','--id',testId],{
      cwd: path.join(__dirname,'../'),
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.testProcess.stdout.on('data', addToBuffer);
    this.testProcess.stderr.on('data', addToBuffer);

    this.testProcess.on('close',async () => {
      var endMessage = "Tests ended at "+ (new Date()).toJSON() + "\n";
      this.outbuff += endMessage;
      var result = await this.reporter.upload(outbuff);
      console.log(result);
    });

  }

  run () {
    return this._spawnTests();
  }

}

(new TestSpawn()).run();

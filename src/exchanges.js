let base = require('taskcluster-base');
let assume = require('assume');

/*
Builds an AMQP message from the given message...
Adds a version field
*/
let cfg = base.config({});

let exchanges = new base.Exchanges({
  title:        'Diagnostics AMQP messages',
  description:  'Publish messages on test runs...',
  schemaPrefix: 'http://schemas.taskcluster.net/diagnostics/v1',
});

let commonMessageBuilder = message => {
  message.version = 1;
  return message;
};

let buildRoutingKey = () => {
  return [
    {
      name: 'routingKeyKind',
      summary: 'Identifier for the routing key kind',
      constant: 'primary',
      required: true,
    },

    {
      name: 'reserved',
      summary: 'Space reserved for future routing key entries',
      multipleWords: true,
      maxSize: 1,
    },
  ];
};

let commonRoutingKeyBuilder = (message, routing) => {
  return {
    testId:     message.testId,
    jsonLogUrl: message.jsonLogUrl,
    rawLogUrl:  message.rawLogUrl,
    payload:    message.payload,
  };
};

let commonCCBuilder = (message, routes) => {
  assume(routes).is.an.instanceOf(Array);
  return routes.map(route => 'route.' + route);
};

exchanges.declare({
  exchange: 'diagnostics-started',
  name:     'diagnosticsStarted',
  title:    'Diagnostics started message',

  description: [
    'When diagnostics are started a message is posted',
    'to this exchange.',
    'Useful for updating frontends for diagnostics.',
  ].join('\n'),
    
  routingKey: buildRoutingKey(),
  schema:     'diagnostics-started-message.json#',
  messageBuilder:    commonMessageBuilder,
  routingKeyBuilder: commonRoutingKeyBuilder,
  CCBuilder:         commonCCBuilder,
});

exchanges.declare({
  exchange: 'diagnostics-complete',
  name:     'diagnosticsCompleted',
  title:    'Diagnostics completed message',

  description: [
    'When doagnostics is completed a message is posted to this exchange',
    'Can be used for frontends and checking results',
  ].join('\n'),
    
  schema:   'diagnostics-completed-message.json#',
  messageBuilder:    commonMessageBuilder,
  routingKeyBuilder: commonRoutingKeyBuilder,
  CCBuilder:         commonCCBuilder,
});

exchanges.declare({
  exchange: 'test-passed',
  name:     'testPassed',
  title:    'Test passed message',

  description: [
    'Message is posted to exchange when a test passes',
    'Can be used for frontends and checking results',
  ].join('\n'),
    
  schema:   'diagnostics-completed-message.json#',
  messageBuilder:    commonMessageBuilder,
  routingKeyBuilder: commonRoutingKeyBuilder,
  CCBuilder:         commonCCBuilder,
});

exchanges.declare({
  exchange: 'test-failed',
  name:     'testFailed',
  title:    'Test failed message',

  description: [
    'Message posted to exchange when a test fails',
    'Can be used for frontends and checking results',
  ].join('\n'),
    
  schema:   'diagnostics-completed-message.json#',
  messageBuilder:    commonMessageBuilder,
  routingKeyBuilder: commonRoutingKeyBuilder,
  CCBuilder:         commonCCBuilder,
});

module.exports = exchanges;

suite("ping", function() {
  var taskcluster         = require('taskcluster-client');
  var assert              = require('assert');

  test("Can call queue.ping()", function() {
    var queue = new taskcluster.Queue();
    return queue.ping().then(function() {
      assert(true, "Ping was successful");
    });
  });
});

# node-dogstatsd

A node.js client for extended StatsD server of [Datadog](http://www.datadoghq.com).

Datadog added new some features(histogram and tags) to their own StatsD implementation.
This client is an extension of general StatsD client to work with that server.

Most parts of codes came from [Steve Ivy](https://github.com/sivy)'s [node-statsd](https://github.com/sivy/node-statsd).
I just added few lines to support datadog's histogram and tags features.

The name of the package is changed because this isn't really statsd client and should be able to be used with original statsd client.

    % npm install node-dogstatsd
    % node
    > var StatsD = require('node-dogstatsd').StatsD
    > c = new StatsD('example.org',8125)
    { host: 'example.org', port: 8125 }
    > c.increment('node_test.int')
    > c.incrementBy('node_test.int', 7)
    > c.decrement('node_test.int')
    > c.decrementBy('node_test.int', 12)
    > c.timing('node_test.some_service.task.time', 500) // time in millis
    > c.histogram('node_test.some_service.data', 100) // works only with datadog' StatsD
    > c.increment('node_test.int', 1, ['tag:one']) // works only with datadog' StatsD

### Event Support

This library supports raising events to a dogstatsd server as well. The convention is:

    client.event(title, description, options, tags)

Options is an object that contains one of three optional parameters that can be set on the event:

* *eventType* - There is an enum called eventType that wraps the four options (error, info, success, warning). Default is info.
* *priority* - String that sets priority. There is an enum called priority that wraps the two options (low, normal). Default is normal.
* *aggKey* - String that allows the event viewer to aggregate similar requests.

#### Example Call

    var dogstatd = require('../lib/statsd.js');
    var client = new dogstatd.StatsD('localhost',8125);

    client.event('Error Detected','error description',{eventType: dogstatd.eventType.ERROR, priority: dogstatd.priority.NORMAL, aggKey: 'Error'},['nodeApp']);

## License

node-statsd is licensed under the MIT license.

## Error handling policy

* exceptions "bubble up" into the app that uses this library
* we don't log or print to console any errors ourself, it's the toplevel app that decides how to log/write to console.
* we document which exceptions can be raised, and where. (TODO, https://github.com/sivy/node-statsd/issues/17)

in your main app, you can leverage the fact that you have access to c.socket and do something like:
(this is the best way I've found so far)

    c.socket.on('error', function (exception) {
       return console.log ("error event in socket.send(): " + exception);
    });

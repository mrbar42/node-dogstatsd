var StatsD = require('../lib/statsd').StatsD,
    dgram = require('dgram');

// Calls the given function the given number of times.
var times = function(n, fn) {
    for (var i = n - 1; i >= 0; i--) {
        fn();
    }
};

describe('StatsD', function() {
    var fakeStatsDServerSocket,
        client;

    beforeEach(function(done) {
        fakeStatsDServerSocket = dgram.createSocket('udp4');
        fakeStatsDServerSocket.bind(function() {
            client = new StatsD('localhost', fakeStatsDServerSocket.address().port);
            done();
        });
    });

    afterEach(function() {
        fakeStatsDServerSocket.close();
    });

    // Wraps up listening for the next message on our fake server and
    // verifying that it's contents match those expected. Calls back
    // once this check has been performed.
    var serverShouldReceive = function(expected, cb) {
        fakeStatsDServerSocket.once('message', function(msg) {
            try {
                msg.toString('utf8').should.eql(expected);
            } catch (e) {
                return cb(e);
            }
            cb();
        });
    };

    var serverShouldReceiveMultiple = function(expected, n, cb) {
        var remaining = n;
        fakeStatsDServerSocket.on('message', function(msg) {
            remaining--;
            try {
                msg.toString('utf8').should.eql(expected);
            } catch (e) {
                return cb(e);
            }
            if (remaining === 0) {
                fakeStatsDServerSocket.removeListener('message', arguments.callee);
                cb();
            }
        });
    };

    describe('timing', function() {
        it('should send the timing measurement in milliseconds', function(done) {
            serverShouldReceive('latency:200|ms', done);
            client.timing('latency', 200);
        });

        it('should include the tags if provided', function(done) {
            serverShouldReceive('latency:200|ms|#app:web,feature:on', done);
            client.timing('latency', 200, ['app:web', 'feature:on']);
        });

        it('should include the sample rate and sample if provided', function(done) {
            serverShouldReceiveMultiple('latency:200|ms|@0.9|#app:web,feature:on', 2, done);
            times(100, function() {
                client.timing('latency', 200, 0.9, ['app:web', 'feature:on']);
            });
        });
    });

    describe('increment', function() {
        it('should send the increment', function(done) {
            serverShouldReceive('requests:1|c', done);
            client.increment('requests');
        });

        it('should include the tags if provided', function(done) {
            serverShouldReceive('requests:1|c|#app:web,feature:on', done);
            client.increment('requests', ['app:web', 'feature:on']);
        });

        it('should include the sample rate and sample if provided', function(done) {
            serverShouldReceiveMultiple('requests:1|c|@0.9|#app:web,feature:on', 2, done);
            times(100, function() {
                client.increment('requests', 0.9, ['app:web', 'feature:on']);
            });
        });
    });

    describe('decrement', function() {
        it('should send the decrement', function(done) {
            serverShouldReceive('requests:-1|c', done);
            client.decrement('requests');
        });

        it('should include the tags if provided', function(done) {
            serverShouldReceive('requests:-1|c|#app:web,feature:on', done);
            client.decrement('requests', ['app:web', 'feature:on']);
        });

        it('should include the sample rate and sample if provided', function(done) {
            serverShouldReceiveMultiple('requests:-1|c|@0.9|#app:web,feature:on', 2, done);
            times(100, function() {
                client.decrement('requests', 0.9, ['app:web', 'feature:on']);
            });
        });
    });

    describe('gauge', function() {
        it('should send the gauge value', function(done) {
            serverShouldReceive('usable_memory:64|g', done);
            client.gauge('usable_memory', 64);
        });

        it('should include the tags if provided', function(done) {
            serverShouldReceive('usable_memory:64|g|#app:web,feature:on', done);
            client.gauge('usable_memory', 64, ['app:web', 'feature:on']);
        });

        it('should include the sample rate and sample if provided', function(done) {
            serverShouldReceiveMultiple('usable_memory:64|g|@0.9|#app:web,feature:on', 2, done);
            times(100, function() {
                client.gauge('usable_memory', 64, 0.9, ['app:web', 'feature:on']);
            });
        });
    });

    describe('histogram', function() {
        it('should send the histogram value', function(done) {
            serverShouldReceive('query_time:777|h', done);
            client.histogram('query_time', 777);
        });

        it('should include the tags if provided', function(done) {
            serverShouldReceive('query_time:777|h|#app:web,feature:on', done);
            client.histogram('query_time', 777, ['app:web', 'feature:on']);
        });

        it('should include the sample rate and sample if provided', function(done) {
            serverShouldReceiveMultiple('query_time:777|h|@0.9|#app:web,feature:on', 2, done);
            times(100, function() {
                client.histogram('query_time', 777, 0.9, ['app:web', 'feature:on']);
            });
        });
    });

    describe('set', function() {
        it('should send the set value', function(done) {
            serverShouldReceive('users.unique:1234|s', done);
            client.set('users.unique', 1234);
        });

        it('should include the tags if provided', function(done) {
            serverShouldReceive('users.unique:1234|s|#app:web,feature:on', done);
            client.set('users.unique', 1234, ['app:web', 'feature:on']);
        });

        it('should include the sample rate and sample if provided', function(done) {
            serverShouldReceiveMultiple('users.unique:1234|s|@0.9|#app:web,feature:on', 2, done);
            times(100, function() {
                client.set('users.unique', 1234, 0.9, ['app:web', 'feature:on']);
            });
        });
    });
});

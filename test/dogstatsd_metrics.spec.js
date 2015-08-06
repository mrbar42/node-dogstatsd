/**
 * Tests basic increment functionality
 */
var assert = require('assert');
var sinon = require('sinon');
var dogstatsd = require('../lib/statsd.js');

describe('dogstatsd Metrics Functionality: ', function() {
    describe('Tags Functionality', function() {
        var client, sendSpy;

        before(function() {
            client = new dogstatsd.StatsD('localhost',8125);
            //replace send with spy to test without udp.
            sendSpy = sinon.spy();
            client.send_data = sendSpy;
        });

        afterEach(function() {
            sendSpy.reset();
        });

        after(function() {
            client.close();
        });

        it('should include tags separated by commas after a |#', function() {
            client.increment('node_test.int',1,['tag1:test','tag2:test2','tag3']);
            var packet = sendSpy.args[0][0];
            assert(/\|#tag1:test,tag2:test2,tag3/.test(packet));

        });

        it('should not include the tags section if no tags are specified', function() {
            client.increment('node_test.int',1);
            var packet = sendSpy.args[0][0];
            console.log(packet.toString());
            assert.equal(packet.toString(),'node_test.int:1|c');

        });
    });
});
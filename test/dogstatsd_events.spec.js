/**
 * Created by James McNally on 27/05/2015.
 */

var assert = require('assert');
var sinon = require('sinon');
var dogstatsd = require('../lib/statsd.js');


describe('Dogstatsd Events Functionality', function() {


    describe('Dogstatd Event Calls', function() {

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

        it('should send the basic string based on core options', function() {
            client.event('TestTitle', 'TestText');
            var spyBuffer = sendSpy.args[0][0];
            assert('_e{9,8}:TestTitle|TestText' === spyBuffer.toString());
        });

        it('should include a priority if included in the options', function() {

            client.event('TestTitle', 'TestText', {priority: dogstatsd.priority.NORMAL});
            var spyBuffer = sendSpy.args[0][0];
            assert(/\|p:normal/.test(spyBuffer));
        });

        it('should include an event type if included in the options', function() {

            client.event('TestTitle', 'TestText', {eventType: dogstatsd.eventType.SUCCESS});
            var spyBuffer = sendSpy.args[0][0];
            assert(/\|t:success/.test(spyBuffer));
        });

        it('should include an aggregation key if included in the options', function() {

            client.event('TestTitle', 'TestText', {aggKey: 'testkey'});
            var spyBuffer = sendSpy.args[0][0];
            assert(/\|k:testkey/.test(spyBuffer));
        });

        it('should include tags seperated by commas after a |#', function() {

            client.event('TestTitle', 'TestText', {aggKey: 'testkey'},['tag1:test','tag2:test2','tag3']);
            var packet = sendSpy.args[0][0];
            assert(/\|#tag1:test,tag2:test2,tag3/.test(packet));

        });
    });

    describe('Event Enums', function() {

        it('should translate enumerated types to correct strings for event priorities', function() {
            assert.equal(dogstatsd.priority.NORMAL, 'normal');
            assert.equal(dogstatsd.priority.LOW, 'low');
        });

        it('should translate enumerated types to correct strings for event types', function() {

            assert.equal(dogstatsd.eventType.ERROR,'error');
            assert.equal(dogstatsd.eventType.WARNING,'warning');
            assert.equal(dogstatsd.eventType.INFO,'info');
            assert.equal(dogstatsd.eventType.SUCCESS,'success');

        });
    });
});
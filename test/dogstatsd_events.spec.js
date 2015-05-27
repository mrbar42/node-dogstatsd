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
            assert(sendSpy.calledWith('_e{9,8}:TestTitle|TestText'));
        });

        it('should include a priority if included in the options', function() {

            client.event('TestTitle', 'TestText', {priority: dogstatsd.priority.NORMAL});
            var spyBuffer = sendSpy.args[0][0];
            assert(/\|p:normal/.test(spyBuffer));
        });
    });

    describe('Event Enums', function() {

        it('should translate enumerated types to correct strings for event priorities', function() {
            assert.equal(dogstatsd.priority.NORMAL, 'normal');
            assert.equal(dogstatsd.priority.LOW, 'low');
        });

        it('should translate enumerated types to correct strings for event types', function() {

        });
    });
});
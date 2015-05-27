"use strict";

var dgram = require("dgram");
var mersenne = require("./mersenne");
var mt = new mersenne.MersenneTwister19937();

var EPHEMERAL_LIFETIME_MS = 1000;

var Client = function(host, port, socket, options) {
    this.host = host || "localhost";
    this.port = port || 8125;

    // optional shared socket
    this.socket = socket;

    // when a *shared* socked isn't provided, an ephemeral
    // socket is demand allocated.  This ephemeral socket is closed
    // after being idle for EPHEMERAL_LIFETIME_MS.
    this.ephemeral_socket = this.last_used_timer = null;

    options = options || {};
    this.global_tags = options.global_tags;
};

Client.prototype.timing = function(stat, time, sample_rate, tags) {
    var self = this;
    var stats = {};
    stats[stat] = time + "|ms";
    self.send(stats, sample_rate, tags);
};

Client.prototype.increment = function(stats, sample_rate, tags) {
    var self = this;
    self.update_stats(stats, 1, sample_rate, tags);
};

Client.prototype.incrementBy = function(stats, value, tags) {
    var self = this;
    if (value === 0) return;
    self.update_stats(stats, value, undefined, tags);
};

Client.prototype.decrement = function(stats, sample_rate, tags) {
    var self = this;
    self.update_stats(stats, - 1, sample_rate, tags);
};

Client.prototype.decrementBy = function(stats, value, tags) {
    var self = this;
    if (value === 0) return;
    self.update_stats(stats, -value, undefined, tags);
};

Client.prototype.gauge = function(stat, value, sample_rate, tags) {
    var self = this;
    var stats = {};
    stats[stat] = value + "|g";
    self.send(stats, sample_rate, tags);
};

Client.prototype.histogram = function(stat, value, sample_rate, tags) {
    var self = this;
    var stats = {};
    stats[stat] = value + "|h";
    self.send(stats, sample_rate, tags);
};

Client.prototype.set = function(stat, value, sample_rate, tags) {
    var self = this;
    var stats = {};
    stats[stat] = value + "|s";
    self.send(stats, sample_rate, tags);
};

Client.prototype.update_stats = function(stats, delta, sampleRate, tags) {
    var self = this;
    if (typeof(stats) === "string")
        stats = [stats];
    if (!delta)
        delta = 1;

    var data = {};
    for (var i = 0; i < stats.length; i++)
        data[stats[i]] = delta + "|c";
    self.send(data, sampleRate, tags);
};

Client.prototype.event = function(title, text, options, tags) {

    var self = this;

    var titleLength = title.length;
    var textLength = text.length;

    var eventString = '_e{' + titleLength + ',' + textLength + '}:';
    eventString += title + '|' + text;

    //Start of optional parameters
    if(options) {
        if (options.priority) {
            eventString += '|p:' + options.priority;
        }
    }

    self.send_data(eventString);
};

// An internal function update the last time the socket was
// used.  This function is called when the socket is used
// and causes demand allocated ephemeral sockets to be closed
// after a period of inactivity.
Client.prototype._update_last_used = function () {
    if (!this.ephemeral_socket)
        return;

    if (this.last_used_timer)
        clearTimeout(this.last_used_timer);

    var self = this;
    this.last_used_timer = setTimeout(function() {
        if (self.ephemeral_socket)
            self.ephemeral_socket.close();
        delete self.ephemeral_socket;
    }, EPHEMERAL_LIFETIME_MS);
};

Client.prototype.send_data = function (buf) {
    var socket;

    if (!this.socket) {
        if (!this.ephemeral_socket) {
            this.ephemeral_socket = dgram.createSocket("udp4");
            this.ephemeral_socket.on("error", function() {});
        }
        socket = this.ephemeral_socket;
    }
    else {
        socket = this.socket;
    }

    this._update_last_used();

    socket.send(buf, 0, buf.length, this.port, this.host);
};

Client.prototype.send = function(data, sample_rate, tags) {
    if (!tags && Array.isArray(sample_rate)) {
        tags = sample_rate;
        sample_rate = undefined;
    }

    if (!sample_rate)
        sample_rate = 1;

    var value;
    var sampled_data = {};
    if (sample_rate < 1) {
        if (mt.genrand_real2(0, 1) <= sample_rate) {
            for (stat in data) {
                value = data[stat];
                sampled_data[stat] = value + "|@" + sample_rate;
            }
        }
    }
    else
        sampled_data = data;

    if (this.global_tags || tags) {
        var merged_tags = [];

        if (Array.isArray(this.global_tags))
          merged_tags = merged_tags.concat(this.global_tags);


        if (Array.isArray(tags))
          merged_tags = merged_tags.concat(tags);

        if (merged_tags.length > 0) {
          var merged_tags_str = merged_tags.join(',');
          for (stat in sampled_data)
              sampled_data[stat] = sampled_data[stat] + "|#" + merged_tags_str;
        }
    }

    for (var stat in sampled_data) {
        var send_data = stat + ":" + sampled_data[stat];
        this.send_data(new Buffer(send_data));
    }
};

Client.prototype.close = function() {
    if (this.socket)
        this.socket.close();
    if (this.ephemeral_socket)
        this.ephemeral_socket.close();
    if (this.last_used_timer)
        clearTimeout(this.last_used_timer);

    this.ephemeral_socket =
    this.last_used_timer =
    this.socket = null;
};

exports.StatsD = Client;

//Enum types to support events generation
exports.priority = {
    NORMAL: 'normal',
    LOW: 'low'
};

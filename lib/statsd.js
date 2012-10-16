var mersenne = require("mersenne");
var mt = new mersenne.MersenneTwister19937();

var Client = function(host, port) {
    this.host = host;
    this.port = port;
    this.socket = require("dgram").createSocket("udp4");
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

Client.prototype.decrement = function(stats, sample_rate, tags) {
    var self = this;
    self.update_stats(stats, - 1, sample_rate, tags);
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

Client.prototype.update_stats = function(stats, delta, sampleRate, tags) {
    var self = this;
    if (typeof(stats) === "string") {
        stats = [stats];
    }
    if (!delta) {
        delta = 1;
    }
    var data = {};
    for (var i = 0; i < stats.length; i++) {
        data[stats[i]] = delta + "|c";
    }
    self.send(data, sampleRate, tags);
};

Client.prototype.send = function(data, sample_rate, tags) {
    var self = this;
    if (!sample_rate) {
        sample_rate = 1;
    }

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
    else {
        sampled_data = data;
    }

    if (tags && Array.isArray(tags)) {
        var tagStr = tags.join(",");

        for (stat in sampled_data) {
            sampled_data[stat] = sampled_data[stat] + "|#" + tagStr;
        }
    }

    for (var stat in sampled_data) {
        var send_data = stat + ":" + sampled_data[stat];
        send_data = new Buffer(send_data);
        this.socket.send(send_data, 0, send_data.length, self.port, self.host);
    }
};

exports.StatsD = Client;

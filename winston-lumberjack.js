/**
 * Copyright (c) 2015 Marcus Wittig
 * MIT LICENCE
 */

var net = require('net'),
    util = require('util'),
    os = require('os'),
    tls = require('tls'),
    fs = require('fs'),
    winston = require('winston'),
    common = require('winston/lib/winston/common'),
    _ = require('lodash'),
    lumberjackProtocol = require('lumberjack-protocol'),
    Lumberjack = exports.Lumberjack = function (options) {
        winston.Transport.call(this, options);
        options = options || {};

        this.name = 'lumberjack';
        this.localhost = options.localhost || os.hostname();
        this.application = options.application || process.title;
        this.pid = options.pid || process.pid;
        this.serverType = options.serverType || "Unknown";
        this.label = options.label || 'Unknown';
        this.timestamp = options.timestamp || false;
        this.serverAddress = _.assign(
            {
                host: "localhost",
                port: 5000
            },
            options.serverAddress || {}
        );
        if (!_.isUndefined(options.sslCrt) && _.isUndefined(this.serverAddress.ca)) {
            this.serverAddress.ca = [fs.readFileSync(options.sslCrt, {encoding: 'utf-8'})]
        }
        this.clientOptions = options.clientOptions;

        this.client = lumberjackProtocol.client(this.serverAddress, this.clientOptions);
    };

//
// Inherit from `winston.Transport`.
//
util.inherits(Lumberjack, winston.Transport);

//
// Define a getter so that `winston.transports.Lumberjack`
// is available and thus backwards compatible.
//
winston.transports.Lumberjack = Lumberjack;

function extractJSON(str) {
    var firstOpen, lastClose, candidate;

    firstOpen = str.indexOf('{');
    do {
        lastClose = str.lastIndexOf('}');
        if (lastClose <= firstOpen) {
            return null;
        }
        do {
            candidate = str.substring(firstOpen, lastClose + 1);
            try {
                return JSON.parse(candidate);
            }
            catch (e) {
                // intentionally left blank
            }
            lastClose = str.substr(0, lastClose).lastIndexOf('}');
        } while (lastClose > firstOpen);
        firstOpen = str.indexOf('{', firstOpen + 1);
    } while (firstOpen != -1);
    return null;
}

Lumberjack.prototype.log = function (level, msg, _meta, callback) {
    var self = this,
        meta = {},
        log_entry;

    if (self.silent) {
        return callback(null, true);
    }
    meta.details = winston.clone(_meta || {});

    // add meta fields
    meta.application = self.application;
    meta.serverName = self.localhost;
    meta.serverType = self.serverType;
    meta.pid = self.pid;
    meta.module = self.label;

    // extract JSON object from message string (if any)
    var json = extractJSON(msg);
    if (json !== null) {
        _.merge(meta.details, json);
    }

    // strip color codes from message part
    msg = msg.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '');

    log_entry = common.log({
        level: level,
        message: msg,
        meta: meta,
        // add timestamp if timestamp option is set to true
        timestamp: this.timestamp,
        json: true
    });

    self.client.writeDataFrame({
        line: log_entry,
        type: "winston-lumberjack"
    });
};
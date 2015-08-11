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
    stringify = require('json-stringify-safe'),
    lumberjackProtocol = require('lumberjack-protocol'),
    Lumberjack = exports.Lumberjack = function (options) {
        winston.Transport.call(this, options);
        options = options || {};

        this.name                = 'lumberjack';
        this.localhost           = options.localhost || os.hostname();
        this.application         = options.application || process.title;
        this.pid                 = options.pid || process.pid;
        this.serverType          = options.serverType || "Unknown";
        this.label               = options.label || 'Unknown';
        this.timestamp           = options.timestamp || false;

        this.connectionOptions  = {
            host: options.host || "localhost",
            port: options.port || 5000,
            ca: [fs.readFileSync(options.sslCrt, {encoding: 'utf-8'})]
        };
        this.clientOptions       = {
            maxQueueSize: options.maxQueueSize || 500
        };

        this.client = lumberjackProtocol.client(this.connectionOptions, this.clientOptions);
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
                return res = JSON.parse(candidate);
            }
            catch(e) {}
            lastClose = str.substr(0, lastClose).lastIndexOf('}');
        } while(lastClose > firstOpen);
        firstOpen = str.indexOf('{', firstOpen + 1);
    } while(firstOpen != -1);
    return null;
}

Lumberjack.prototype.log = function (level, msg, _meta, callback) {
    var self = this,
        meta = {},
        log_entry;

    meta.details = winston.clone(meta || {});
    if (self.silent) {
        return callback(null, true);
    }

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
        type: "winston-lumberjack",
        level: level,
        application: self.application,
        serverName: self.localhost,
        serverType: self.serverType,
        pid: self.pid,
        module: self.label
    });
};
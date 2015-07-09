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
    Lumberjack = exports.Lumberjack = function (options) {
        winston.Transport.call(this, options);
        options = options || {};

        this.name                = 'lumberjack';

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

Lumberjack.prototype.log = function (level, msg, meta, callback) {

};

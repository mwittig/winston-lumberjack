# winston-lumberjack

[![Build Status](https://travis-ci.org/mwittig/winston-lumberjack.svg?branch=master)](https://travis-ci.org/mwittig/winston-lumberjack)
[![Greenkeeper badge](https://badges.greenkeeper.io/mwittig/winston-lumberjack.svg)](https://greenkeeper.io/)

A logstash transport for winston based on 
 [node-lumberjack-protocol](https://github.com/benbria/node-lumberjack-protocol), a 
 lumberjack protocol implementation for Node.js. It allows for sending encrypted logs from your node.js app to 
 your logstash server instance.

## Usage 

### Node

    var winston = require('winston');
    // Simply requiring winston-lumberjack will assign winston.transports.Lumberjack
    require('winston-lumberjack');
    
    winston.add(winston.transports.Lumberjack, {
        "timestamp": true,
        "level": "debug",
        "serverAddress": {
            "host": "localhost",
            "port": 5000
        },
        "sslCrt": "./logstash-forwarder.crt"
    });
    
    winston.log('debug', 'Now my debug messages are written to logstash!');

### Lumberjack Configuration

*   sslCert (optional)

    Filename of the trusted CA certificate which has signed the logstash server certificate. If this is omitted several 
    well known "root" CAs will be used. These are used to authorize connections.
 
*  serverAddress

   An object to specify the host and port of the logstash server. Additionally, all options supported by 
    [tls.connect()](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback) may be provided. If the `ca` 
    property is the content of the file referenced by the `sslCert` property (if provided) will be set as `ca`.
 
    "serverAddress": {
        "host": "localhost",
        "port": 5000
    }

*  level (optional)

   Level of messages this transport should log. Defaults to 'info'.

*  timestamp (optional)

   Boolean flag indicating if log messages shall include a timestamp. Defaults to false.

*  clientOptions (optional)

   An object with additional configuration option passed on to the lumberjack protocol stack:

   * `windowSize` - the windowSize to send to the receiver. Defaults to 1000. See *Caveats* section of 
    [node-lumberjack-protocol README](https://github.com/benbria/node-lumberjack-protocol#caveats) for details.
   
   * `maxQueueSize` - the maximum number of messages to queue while disconnected.
     If this limit is hit, all messages in the queue will be filtered with
     `allowDrop(data)`.  Only messages which this function returns true for will be
     removed from the queue.  If there are still too many messages in the queue at this point
     the the oldest messages will be dropped.  Defaults to 500.
   
   * `allowDrop(data)` - this will be called when deciding which messages to drop.
     By dropping lower priority messages (info and debug level messages, for example) you can
     increase the chances of higher priority messages getting through when the Client is
     having connection issues, or if the receiver goes down for a short period of time.
     This function is used both to drop messages from the queue while disconnected, and to drop
     messages if the receiver is taking too long to acknowledge messages.
   
     Note that this function will be called on all messages in the queue every time the queue grows
     too large - if this function does not return true for any messages, then it could be called
     for every message in the queue every time a message is queued.
   
   * `options.reconnect` - time, in ms, to wait between reconnect attempts.  Defaults to 3 seconds.

## License 

Copyright (c) 2015-2018, Marcus Wittig
All rights reserved.

[MIT](https://github.com/mwittig/winston-lumberjack/blob/master/LICENSE)
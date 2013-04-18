// Copyright (c) 2013 Brandon Wang
// 
// See the file license.txt for copying permission.
//

var http = require("http");
var assert = require("assert");
var throttler = require("..");
var url = require("url");

console.log("Creating server with a per ip throttle rate of 12 req/second with 1 connection allowed.");
ipThrottler = new throttler.IPThrottler(12, 1);
port = 8888

server = http.createServer(function(req, res) {
    var t = ipThrottler.throttle(res);

    if (t != 0) {
        res.writeHead(503, {"Content-Type": "text/plain"});
        res.write("Service throttled.");
        ipThrottler.markResponseEnd(res);
        res.end(); 
        return;
    }

    var pathname = url.parse(req.url).pathname; 
    if (pathname == "/long") {
        setTimeout(function() {
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.write("Hello World");
        ipThrottler.markResponseEnd(res);
        res.end();
        }, 2000);
        return;
    }
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.write("Hello World");
    ipThrottler.markResponseEnd(res);
    res.end(); 
});
server.listen(port);
console.log("Server listening.");

options = {
    host: "localhost",
    port: port,
    path: '/'
}

console.log("Requesting localhost serially 10 times.");

numReqRecieved = 0;
numThrottled = 0;

function makeReq(i) {
    if (i <= 10) {
        console.log("Requesting.");
        http.get(options, function(res) {
            assert(res.statusCode == 200, "Request not returned with code 200.");
            console.log("OK. Request "+i+" returned correctly.");
            makeReq(i+1);
        });
        return;
    }
    
    // options for a long standing request
    var longOptions = options;
    longOptions.path = "/long";

    console.log("Cooldown 1s to allow for throttling to settle.");
    setTimeout(function() {
        console.log("Requesting two concurrent longstanding requests. One request should be throttled.");

        function c(res) {
            numReqRecieved++;
            console.log("Recieved "+res.statusCode);
            if (res.statusCode == 503) {
                numThrottled++;
            }
            if (numReqRecieved == 2) {
                assert(numThrottled == 1, "One request should have been throttled.");
                console.log("OK. One request throttled. Test passed.");
                server.close();
            }
        }

        http.get(longOptions, c);
        http.get(longOptions, c);
    }, 1000);
}

makeReq(1);

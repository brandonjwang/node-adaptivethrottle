// Copyright (c) 2013 Brandon Wang
// 
// See the file license.txt for copying permission.
//

var http = require("http");
var assert = require("assert");
var throttler = require("..");

console.log("Creating server with throttle rate of 1 req/second.");
globalThrottler = new throttler.Throttler(1);
port = 8888

server = http.createServer(function(req, res) {
    var t = globalThrottler.throttle();

    if (t > 0) {
        res.writeHead(503, {"Content-Type": "text/plain"});
        res.write("Service throttled.");
        res.end(); 
        return;
    }
    
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.write("Hello World");
    res.end(); 
});
server.listen(port);

console.log("Server listening.");

options = {
    host: "localhost",
    port: port,
    path: '/'
}

console.log("Requesting localhost.");
http.get(options, function(res) {
    assert(res.statusCode == 200, "Request not returned with code 200.");

    console.log("OK. Requesting localhost, should be throttled.");
    http.get(options, function(res) {
        assert(res.statusCode == 503, "Request should have been throttled.");

        console.log("OK. Waiting 2 seconds then requesting localhost.");

        setTimeout(function() {
            http.get(options, function(res) {
                assert(res.statusCode == 200, "Request not returned with code 200.");
                console.log("OK. Test passed.");
                server.close();
            });
        }, 2000);
    });
});


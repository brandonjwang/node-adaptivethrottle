
var http = require("http");
var assert = require("assert");
var throttler = require("..");

console.log("Creating server with a per ip throttle rate of 1 req/second with 10 concurrent connections allowed.");
ipThrottler = new throttler.IPThrottler(1, 10);
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

console.log("Requesting localhost.");
http.get(options, function(res) {
    console.log("OK. Checking number of IPs checked up on.");
    assert(res.statusCode == 200, "Request not returned with code 200.");
    assert(Object.keys(ipThrottler.ipInfo).length == 1, "IPThrottler should be keeping track of 1 IP.");
    console.log("OK. Waiting for IP info to expire.");
});

setTimeout(function() {
    console.log("Checking number of IPs checked up on, should be 0 since the server should forget about 127.0.0.1.");
    assert(Object.keys(ipThrottler.ipInfo).length == 0, "IPThrottler should be keeping track of 0 IPs.");
    console.log("OK. Sending two fast running requests to get this IP throttled.");
    http.get(options, function(res) {
        console.log(res.statusCode);
        assert(res.statusCode == 200, "Request not returned with code 200.");
        console.log("First request responeded to properly, sending second request.");
        http.get(options, function(res) {
            assert(res.statusCode == 503, "Request should have been throttled.");
            console.log("Second request throttled. Test passed.");
            server.close();
        });
    });
}, ipThrottler.deleteInterval+100);


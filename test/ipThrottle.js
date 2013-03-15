
var http = require("http");
var assert = require("assert");
var throttler = require("..");

console.log("Creating server with a per ip throttle rate of 1 req/second with 1 connection allowed.");
ipThrottler = new throttler.IPThrottler(1, 1);
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
    console.log("got response");
});

setTimeout(function() {
    console.log("size of info "+Object.keys(ipThrottler.ipInfo).length);
}, 6100);


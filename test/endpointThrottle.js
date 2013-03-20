
var http = require("http");
var assert = require("assert");
var throttler = require("..");
var url = require("url");

epInfo = new throttler.EndpointInfo(".*", 1);
epThrottler = new throttler.AdaptiveThrottler([epInfo]);
port = 8888

server = http.createServer(function(req, res) {
    var respond = function() {
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.write("Hello World");
        epThrottler.markResponseEnd(req);
        res.end();
    }
    var t = epThrottler.throttle(req);

    if (t != 0) {
        throttler.d("Throttling Request");
        res.writeHead(503, {"Content-Type": "text/plain"});
        res.write("Service throttled.");
        epThrottler.markResponseEnd(req);
        res.end(); 
        return;
    }

    var pathname = url.parse(req.url).pathname; 
    if (pathname == "/long") {
        //setTimeout(function() { respond() }, Math.random()*100); // Add randomness
        setTimeout(function() { respond() }, 50); // Add randomness
        return;
    } else {
        throw new Error("fuck you bitch");
    }
    respond();
});
server.listen(port);
console.log("Server listening.");

options = {
    host: "localhost",
    port: port,
    path: '/long'
}

var max = 100;
j = 0;
for (var i=0; i<max; ++i) {
    http.get(options, function(res) {
        //d("Made request with response: "+res.statusCode);
        if (++j == max) {
            server.close();
        }
    });
}


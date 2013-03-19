
var http = require("http");
var assert = require("assert");
var throttler = require("..");
var url = require("url");

epInfo = new throttler.EndpointInfo(".*", 1);
epThrottler = new throttler.AdaptiveThrottler([epInfo]);
port = 8888

server = http.createServer(function(req, res) {
    var t = epThrottler.throttle(req);

    if (t != 0) {
        res.writeHead(503, {"Content-Type": "text/plain"});
        res.write("Service throttled.");
        epThrottler.markResponseEnd(req);
        res.end(); 
        return;
    }

    /*
    var pathname = url.parse(req.url).pathname; 
    if (pathname == "/long") {
        setTimeout(function() {
            res.writeHead(200, {"Content-Type": "text/plain"});
            res.write("Hello World");
            epThrottler.markResponseEnd(req);
            res.end();
        }, 2000);

        return;
    }*/

    res.writeHead(200, {"Content-Type": "text/plain"});
    res.write("Hello World");
    epThrottler.markResponseEnd(req);
    res.end(); 
});
server.listen(port);
console.log("Server listening.");

options = {
    host: "localhost",
    port: port,
    path: '/'
}


i = 0;
function asf() {
    if (i >= 1000) {
        server.close();
        return;
    }
    setTimeout(function() {
        http.get(options, function(res) {
            //console.log("Made request with response: "+res.statusCode);
            i++;
            asf();
        });
    }, 1000);
}

asf();

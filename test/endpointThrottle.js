
var http = require("http");
var assert = require("assert");
var throttler = require("..");
var url = require("url");

// SETTINGS
d = throttler.d;
numReq = 1000;
numEndpoints = 10;
targetResponseTime = 1;

epInfos = [];
for (var i = 0; i<numEndpoints; ++i) {
    epInfos.push(new throttler.EndpointInfo("/ep"+i, i+1));
}
epThrottler = new throttler.AdaptiveThrottler(epInfos);
console.log
epThrottler.targetResponseTime = targetResponseTime;
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
        res.writeHead(503, {"Content-Type": "text/plain"});
        res.write("Service throttled.");
        epThrottler.markResponseEnd(req);
        res.end(); 
        return;
    }

    setTimeout(function() { respond() }, targetResponseTime*1.01);
    return;
});
server.listen(port);
console.log("Server listening.");
console.log("Making "+numReq+" requests to all endpoints");
numServed = [];
for (var i = 0; i<numEndpoints; ++i) { numServed.push(0); }

k = 0;
for (var i = 0; i<numReq; ++i) {
    for (var j = 0; j < numEndpoints; ++j) {
        http.get({host: "localhost", port: port, path:"/ep"+j}, 
            (function(m) {
                return function(res) {
                    k += 1;
                    if (res.statusCode == 200) {
                        numServed[m]++;
                        d("Request for "+m+" OK");
                    } else {
                        d("Request for "+m+" throttled with "+res.statusCode);
                    }

                    if (k == numReq*numEndpoints) {
                        for (var l = 0; l<numEndpoints; ++l) { 
                            console.log("Endpoint "+l+" with priority "+(l+1)+" with proportion "+(100*numServed[l]/numReq)+"%");
                        }
                        server.close();
                    }
                };
            })(j)
        );
    }
}



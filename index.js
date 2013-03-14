
var http = require("http");

// rate: times/second
var Throttler = function(rate) {
    this.lastCheck = Date.now();
    this.rate = rate;
    this.allowedOperations = rate;

    // returns the amount of time we need to sleep in seconds
    this.throttle = function() {
        now = Date.now();
        timePassed = now - this.lastCheck;
        this.lastCheck = now;
        this.allowedOperations += timePassed/1000 * this.rate - 1;

        if (this.allowedOperations > rate) {
            this.allowedOperations = rate;
        }

        if (this.allowedOperations < 1) { return -this.allowedOperations/this.rate; }
        return 0;
    };
};

globalThrottler = new Throttler(1);

http.createServer(function(req, res) {
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
}).listen(8888);

console.log("Server listening.");

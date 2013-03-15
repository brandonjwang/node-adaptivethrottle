
// rate: times/second
var Throttler = function(rate) {
    this.lastCheck = Date.now();
    this.rate = rate;
    this.allowedOperations = rate;

    // returns the amount of time someone needs to wait until they make a new request
    this.throttle = function() {
        var now = Date.now();
        var timePassed = now - this.lastCheck;
        this.lastCheck = now;
        this.allowedOperations += timePassed/1000 * this.rate - 1;

        if (this.allowedOperations > rate) {
            this.allowedOperations = rate;
        }

        if (this.allowedOperations < 1) { return -this.allowedOperations/this.rate; }
        return 0;
    };
};

// Information stored on each IP for use of throttling
var IPInfo = function(p) {
    this.p = p; // Parent
    this.throttler = new Throttler(p.rate);
    this.numConnections = 0;
    this.deleteTimeout = null;  // Used to delete self after a set amount of time

    // returns -1 if we exceed the number of allowed concurrent connections
    // otherwise, it returns the number of seconds someone needs to wait until they're allowed
    // to make a request
    this.throttle = function(res) {
        this.numConnections++;
        if (this.numConnections > p.numConn) {
            return -1;
        }
    }
};

// throttles ip on number of connections and the rate per ip
var IPThrottler = function(rate, numConn) {
    this.rate = rate;
    this.numConn = numConn;
    this.deleteInterval = 6000/rate;  // 1 minute/rate (ie. a rate of 10 req/s will be deleted after 6s)
    this.ipInfo = {};   // mapping from IP to information

    // returns -1 if we exceed the number of allowed concurrent connections
    // otherwise, it returns the number of seconds someone needs to wait until they're allowed
    // to make a request
    this.throttle = function(res) {
        var ip = res.connection.remoteAddress;
        console.log("connection opened.");
        if (!(ip in this.ipInfo)) {
            console.log("Creating ip info for ip "+ip);
            this.ipInfo[ip] = new IPInfo(this);
        }

        var sleepTime = this.ipInfo[ip].throttle();

        return sleepTime;
    };

    this.markResponseEnd = function(res) {
            var ip = res.connection.remoteAddress;
            var ipInfo = this.ipInfo;
            ipInfo[ip].numConnections--;

            if (ipInfo[ip].deleteTimeout != null) {
                clearTimeout(ipInfo[ip].deleteTimeout);
            }

            ipInfo[ip].deleteTimeout = setTimeout(function() {
                delete ipInfo[ip];
            }, this.deleteInterval);
        }

    this.removeIpInfo = function(ip) {
        delete this.ipInfo[ip];
    };
};

exports.Throttler = Throttler
exports.IPThrottler = IPThrottler

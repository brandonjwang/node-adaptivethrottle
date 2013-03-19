
var url = require("url");
var queue = require("./queue.js");

// rate: times/second
var Throttler = function(rate) {
    this.lastCheck = Date.now();
    this.rate = rate;
    this.allowedOperations = rate;

    // returns the amount of time someone needs to wait until they make a new request
    this.throttle = function(rate) {
        if (rate) {
            this.rate = rate;
        }

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
    this.throttle = function(req) {
        this.numConnections++;
        if (this.numConnections > p.numConn) {
            return -1;
        }

        return this.throttler.throttle();
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
    this.throttle = function(req) {
        var ip = req.connection.remoteAddress;
        if (!(ip in this.ipInfo)) {
            this.ipInfo[ip] = new IPInfo(this);
        }

        if (this.ipInfo[ip].deleteTimeout != null) {
            clearTimeout(this.ipInfo[ip].deleteTimeout);
        }

        return this.ipInfo[ip].throttle();
    };

    this.markResponseEnd = function(req) {
        var ip = req.connection.remoteAddress;
        var ipInfo = this.ipInfo;
        ipInfo[ip].numConnections--;

        if (ipInfo[ip].numConnections == 0) {
            ipInfo[ip].deleteTimeout = setTimeout(function() {
                delete ipInfo[ip];
            }, this.deleteInterval);
        }
    }

    this.removeIpInfo = function(ip) {
        delete this.ipInfo[ip];
    };
};

// path is a regexp, priority is the priority of the endpoint
var EndpointInfo = function(path, priority) {
    if (typeof path == "string") {
        path = new RegExp(path);
    }
    this.path = path;
    this.beta = 1/priority;
    this.instAvg = 0; // instantaneous time to complete a request
    this.throttler = new Throttler(0);

    this.calculateRate = function(L) {
        return L / (this.beta * this.instAvg);
    }

    this.throttle = function(L) {
        return this.throttler(this.calculateRate(L));
    }
}

// takes an array of EndpointInfo
var AdaptiveThrottler = function(infos) {
    if (infos == null || infos.length == 0) 
        throw new Error("infos must not be null or length 0");

    this.sumBeta = 0;
    this.infos = infos;
    this.avgResTime = 0;
    //this.timeHistoryBuffer = new queue.Queue(100);
    this.timeHistoryBuffer = new queue.Queue(3);
    this.targetResponseTime = 50;
    this.L = 0;

    for (i = 0; i<infos; ++i) {
        this.sumBeta += infos[i].beta;
    }

    this.throttle = function(req) {
        // Calculate new total allowed system load
        var percentDifference = (this.avgResTime - this.targetResponseTime)/this.targetResponseTime;
        this.L = this.L*(1-percentDifference);

        // Find the appropriate EndpointInfo
        var pathname = url.parse(req.url).pathname;
        var epInfo = null;
        for (var i = 0; i < this.infos.length; ++i) {
            var info = this.infos[i];
            if (info.path.test(pathname)) {
                epInfo = info;
                break;
            }
        }

        if (epInfo == null) {
            throw new Error("Failed to find the appropriate endpoint for "+pathname);
        }

        // Mark the request with a timestamp
        req.startTime = (new Date()).getTime();

        //return epInfo.throttle(this.L);
        return 0;
    }

    this.markResponseEnd = function(req) {
        var responseTime = (new Date()).getTime() - req.startTime;

        // Update avgResTime
        var oldNumElem = this.timeHistoryBuffer.numElements;
        var removedTime = this.timeHistoryBuffer.push(responseTime);
        if (removedTime) {
            this.avgResTime -= removedTime / oldNumElem;
        }

        // Normalize with new denominator
        if (oldNumElem != this.timeHistoryBuffer.numElements) {
            this.avgResTime = this.avgResTime * oldNumElem / this.timeHistoryBuffer.numElements;
        }

        this.avgResTime += responseTime / this.timeHistoryBuffer.numElements;

        console.log("Avg Time: "+this.avgResTime+" Inst Time: "+responseTime);

        // Update endpoint response time
    }
}

exports.Throttler = Throttler
exports.IPThrottler = IPThrottler
exports.EndpointInfo = EndpointInfo
exports.AdaptiveThrottler = AdaptiveThrottler


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
    this.throttle = function(res) {
        var ip = res.connection.remoteAddress;
        if (!(ip in this.ipInfo)) {
            this.ipInfo[ip] = new IPInfo(this);
        }

        if (this.ipInfo[ip].deleteTimeout != null) {
            clearTimeout(this.ipInfo[ip].deleteTimeout);
        }

        return this.ipInfo[ip].throttle();
    };

    this.markResponseEnd = function(res) {
        var ip = res.connection.remoteAddress;
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
    this.path = path;
    this.beta = 1/priority;
    this.instAvg = 0; // instantaneous time to 

    this.calculateRate = function(L) {
        return L / (this.beta * this.instAvg);
    }
}

// takes an array of EndpointInfo
var AdaptiveThrottler = function(infos) {
    this.sumBeta = 0;
    this.infos = infos;
    this.avgResTime = 0;
    this.targetResponseTime = 50;

    for (i = 0; i<infos; ++i) {
        this.sumBeta += infos[i].beta;
    }

    this.throttle = function(res) {
        if (this.avgResTime > targetResponseTime) {
        }
    }
}

exports.Throttler = Throttler
exports.IPThrottler = IPThrottler
exports.EndpointInfo = EndpointInfo
exports.AdaptiveThrottler = AdaptiveThrottler

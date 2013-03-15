
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

exports.Throttler = Throttler

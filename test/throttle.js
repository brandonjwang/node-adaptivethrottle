var globalThrottle = new Throttler(1);
var n = Date.now();

for(i=0; i<10; ++i) {
    setTimeout(function() {
            console.log("I was allowed to write at "+(Date.now()-n)/1000+" seconds after starting");
                }, globalThrottle.throttle()*1000);
                }

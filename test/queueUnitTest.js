
var assert = require("assert");
var queue = require("../queue.js");

x = new queue.Queue(10);

for (var i = 0; i < 100; ++i) {
    var v = x.push(i);
    if (i > 10) {
        console.log(v);
        assert(v%10 == (i-1)%10, "v="+v);
    }
}

console.log("Queue Test Passed");

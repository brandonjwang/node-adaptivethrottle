// Copyright (c) 2013 Brandon Wang
// 
// See the file license.txt for copying permission.
//

var assert = require("assert");
var queue = require("../queue.js");

size = 15;
x = new queue.Queue(size);

for (var i = 0; i < 10*size; ++i) {
    var v = x.push(i);
    if (i > size) {
        console.log(v);
        assert(v%10 == (i-size)%10, "v="+v);
    }
}

console.log("Queue Test Passed");

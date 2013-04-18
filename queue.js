// Copyright (c) 2013 Brandon Wang
// 
// See the file license.txt for copying permission.
//

// Simple implementation of a queue using a ring buffer implementation with maximum size of size

var Queue = function(size) {
    if (!size) 
        size = 10;

    this.size = size;
    this.buffer = new Array(size);
    this.index = -1;
    this.numElements = 0;

    // Pushes element onto the queue, if the number of elements
    // exceeds the size, return the value
    this.push = function(value) {
        var retVal = null;
        this.index = (this.index + 1) % this.size;
        if (this.numElements == this.size) {
            retVal = this.buffer[this.index];
        } else {
            this.numElements++;
        }

        this.buffer[this.index] = value;

        return retVal;
    }
}

exports.Queue = Queue

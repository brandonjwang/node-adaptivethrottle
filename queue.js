
// Simple implementation of a queue using a ring buffer implementation with maximum size of size

var Queue = function(size) {
    if (!size) 
        size = 10;

    this.size = size;
    this.buffer = new Array(size);
    this.startIndex = 0;
    this.endIndex = 0;
    this.numElements = 0;

    // Pushes element onto the queue, if the number of elements exceeds the size, return the value
    this.push = function(value) {
        var retVal = null;
        this.numElements++;

        if (this.numElements > this.size) {
            retVal = this.buffer[this.startIndex];
            this.startIndex = (this.startIndex + 1) % this.size;
            this.numElements = this.size;
        }

        this.endIndex = (this.endIndex + 1) % this.size;
        this.buffer[this.endIndex] = value;

        return retVal;
    }
}

exports.Queue = Queue

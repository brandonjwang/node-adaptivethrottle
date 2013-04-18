# Node.js Adaptive Throttling

A suite of classes for Node.js used for throttling that I wrote for a university project. 

Example usage of a simple throttler: 

```javascript
server = http.createServer(function(req, res) {
    var t = globalThrottler.throttle();

    if (t != 0) {
        res.writeHead(503, {"Content-Type": "text/plain"});
        res.write("Service throttled.");
        res.end(); 
        return;
    }
    
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.write("Hello World");
    res.end(); 
});
```

For usage of all classes, see the testcases written in /test. For an explanation of the math, justification, and so on, see report.pdf.

In this project, the following JavaScript classes are publicly exposed:

## Throttler(rate)
This class is a simple base class with one method that is used to determine if something is being used more often then rate. It can be used for a multitude of cases and is used internally to implement more sophisticated throttle classes. 

It has one method:
### throttle(rate)
In order to reduce API surface, throttle serves multiple purposes. At a high level, it simply returns 0 if the operation should be permitted. If the operation should not be permitted, it returns the amount of time that must elapse until the next operation is allowed. The intention is to be called before an operation is performed. 

It takes in an argument rate, which does not have to be specified. It is simply syntactic sugar in the case that the user wants to change the rate before determining how much time must elapse before the next request.

## IPThrottler(rate, numConn)
This class is used to impose two restrictions on a per IP basis. First, it imposes a request rate specified by the developer as rate. Second, it imposes a hard limit on the number of concurrent connections someone may have. 

It has two methods:
### throttle(req)
throttle(req) requires a request object to determine what IP a request is being made from. 

It returns -1 if the number of connections is exceeded. In the case that it is not, its behavior is similar to that of Throttler.throttle() in that it will return 0 if the request should be allowed. Otherwise, it will return the amount of time that must elapse before the next request may be made.

### markResponseEnd(req)
Used to mark when a request has been served. This must be called or else IPThrottler will believe that the request is still alive.

## AdaptiveThrottler(infos)
AdaptiveThrottler is used to adaptively throttle requests according to user specified priorities, their performance characteristics and RegExp which is used to differentiate request characteristics. For example, say we have two endpoints, /search?q=myquery, and /main.

The RegExp patterns that might be used might be something like “^\/search.*” and “^\/main$”. In addition, we might know that /main is more important for users than /search is. So we might propose priorities 1 for /main, and 10 for /search. Both the pattern and priority is encapsulated in the class EndpointInfo and is discussed later.

It has two methods:
### throttle(req)
AdaptiveThrottler.throttle() behavior is similar to that of Throttler.throttle() in that it will return 0 if the request should be allowed. Otherwise, it will return the amount of time that must elapse before the next request may be made.

### markResponseEnd(req)
Used to mark when a request has been served. This must be called or else AdaptiveThrottler will believe that the request is still alive.

## EndpointInfo(path, priority)
EndpointInfo is used in conjunction with AdaptiveThrottler. Path is a RegExp that allows someone to express an endpoint or a collection of endpoints (ie. the pattern “(\/foo|\/bar)” will match both /foo and /bar). Priority is a number which specifies relative importance compared to other endpoints.


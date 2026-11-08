# Week 1 / NetProbe

[Open the review page](https://cindycallista.github.io/anggie_se/hw1/)

I built NetProbe to understand what a curl-style client does before and after an HTTP request. It uses only the Node.js standard library and keeps redirects visible unless they are explicitly followed.

## Try it

```bash
node netprobe.mjs https://httpbin.org/get
node netprobe.mjs -i -L https://example.com
node netprobe.mjs -X POST -H "Content-Type: application/json" -d '{"status":"ready"}' https://httpbin.org/post
```

Available controls include method selection, repeated headers, a request body, response headers, redirect following, timeouts, and file output. Node.js 18 or newer is required.

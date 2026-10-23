# HW1 — NetProbe

NetProbe is a small curl-like command-line program written with the Node.js standard library. It supports redirects, request headers, JSON bodies, response headers, timeouts, and file output.

Demo and documentation: https://anggie0707.github.io/_se/hw1/

## Run

```bash
node netprobe.mjs https://httpbin.org/get
node netprobe.mjs -X POST -H "Content-Type: application/json" -d '{"message":"hello"}' https://httpbin.org/post
node netprobe.mjs -i -L --timeout 5000 https://example.com
```

## Options

```text
-X, --request METHOD
-H, --header "Key: Value"
-d, --data BODY
-i, --include
-L, --location
-o, --output FILE
    --timeout MS
-h, --help
```

Requires Node.js 18 or newer. No packages are required.

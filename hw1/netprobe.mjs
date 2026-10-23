#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';

const usage = `NetProbe — small HTTP client

Usage: node netprobe.mjs [options] <url>
  -X, --request METHOD      HTTP method
  -H, --header "Key: Value" Add request header (repeatable)
  -d, --data BODY          Send a request body
  -i, --include            Print response status and headers
  -L, --location           Follow redirects
  -o, --output FILE        Save response body
      --timeout MS         Abort after a number of milliseconds
  -h, --help               Show help`;

function parseArgs(argv) {
  const options = { method: 'GET', headers: {}, include: false, redirect: 'manual', timeout: 10000 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => {
      if (!argv[i + 1]) throw new Error(`Missing value after ${arg}`);
      return argv[++i];
    };
    if (arg === '-h' || arg === '--help') options.help = true;
    else if (arg === '-X' || arg === '--request') options.method = value().toUpperCase();
    else if (arg === '-H' || arg === '--header') {
      const header = value();
      const separator = header.indexOf(':');
      if (separator < 1) throw new Error(`Invalid header: ${header}`);
      options.headers[header.slice(0, separator).trim()] = header.slice(separator + 1).trim();
    } else if (arg === '-d' || arg === '--data') options.body = value();
    else if (arg === '-i' || arg === '--include') options.include = true;
    else if (arg === '-L' || arg === '--location') options.redirect = 'follow';
    else if (arg === '-o' || arg === '--output') options.output = value();
    else if (arg === '--timeout') options.timeout = Number(value());
    else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
    else if (options.url) throw new Error('Only one URL can be requested');
    else options.url = arg;
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || !options.url) {
    console.log(usage);
    process.exitCode = options.help ? 0 : 1;
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout);
  try {
    const response = await fetch(options.url, {
      method: options.method,
      headers: options.headers,
      body: ['GET', 'HEAD'].includes(options.method) ? undefined : options.body,
      redirect: options.redirect,
      signal: controller.signal
    });
    const body = Buffer.from(await response.arrayBuffer());
    if (options.include) {
      console.log(`HTTP ${response.status} ${response.statusText}`);
      response.headers.forEach((value, key) => console.log(`${key}: ${value}`));
      console.log('');
    }
    if (options.output) await writeFile(options.output, body);
    else process.stdout.write(body);
    if (!response.ok) process.exitCode = 22;
  } finally {
    clearTimeout(timer);
  }
}

main().catch(error => {
  console.error(`netprobe: ${error.name === 'AbortError' ? 'request timed out' : error.message}`);
  process.exitCode = 1;
});


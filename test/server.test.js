'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { createApp, getPort, parseAllowedOrigins } = require('../server');

const apiKey = '0b94fe10fb67a3d8b11ea8faa38ee9539f7dd9a143441f87be8a68e20bff5c90';
const allowedOrigin = 'https://hmi.example.test';
let server;
let port;
let temporaryDirectory;

function request({ method = 'GET', headers = {} } = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            host: '127.0.0.1',
            port,
            method,
            path: '/download-log',
            headers
        }, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve({
                body: Buffer.concat(chunks),
                headers: res.headers,
                statusCode: res.statusCode
            }));
        });
        req.on('error', reject);
        req.end();
    });
}

before(async () => {
    temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'njserverlogdown-'));
    const logFilePath = path.join(temporaryDirectory, 'connect.log');
    fs.writeFileSync(logFilePath, 'sensitive diagnostic data\n');
    const app = createApp({ apiKey, allowedOrigins: [allowedOrigin], logFilePath });
    server = await new Promise((resolve) => {
        const httpServer = app.listen(0, '127.0.0.1', () => resolve(httpServer));
    });
    port = server.address().port;
});

after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

test('rejects a request without an API key', async () => {
    const response = await request();

    assert.equal(response.statusCode, 401);
    assert.match(response.body.toString(), /X-API-Key/);
});

test('rejects an unapproved browser origin before serving the log', async () => {
    const response = await request({
        headers: { Origin: 'https://untrusted.example.test', 'X-API-Key': apiKey }
    });

    assert.equal(response.statusCode, 403);
});

test('serves a non-cacheable zip only to an allowed origin with the API key', async () => {
    const response = await request({
        headers: { Origin: allowedOrigin, 'X-API-Key': apiKey }
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['access-control-allow-origin'], allowedOrigin);
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.match(response.headers['content-disposition'], /connect\.zip/);
    assert.equal(response.body.subarray(0, 2).toString(), 'PK');
    assert.match(response.body.toString('latin1'), /connect\.log/);
});

test('permits only the configured CORS preflight', async () => {
    const response = await request({
        method: 'OPTIONS',
        headers: {
            Origin: allowedOrigin,
            'Access-Control-Request-Headers': 'X-API-Key',
            'Access-Control-Request-Method': 'GET'
        }
    });

    assert.equal(response.statusCode, 204);
    assert.equal(response.headers['access-control-allow-origin'], allowedOrigin);
    assert.match(response.headers['access-control-allow-headers'], /X-API-Key/i);
});

test('fails closed for unsafe configuration', () => {
    assert.throws(
        () => createApp({ allowedOrigins: [allowedOrigin], logFilePath: 'connect.log' }),
        /NJSERVER_LOG_API_KEY/
    );
    assert.throws(() => parseAllowedOrigins('https://hmi.example.test/path'), /Invalid allowed origin/);
    assert.throws(() => getPort('3000not-a-port'), /NJSERVER_LOG_PORT/);
});

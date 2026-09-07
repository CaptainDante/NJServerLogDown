#!/usr/bin/env node
'use strict';

const { timingSafeEqual } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const archiver = require('archiver');
const cors = require('cors');
const express = require('express');

const DEFAULT_PORT = 3000;
const DEFAULT_BIND_HOST = '127.0.0.1';

function defaultLogFilePath() {
    if (process.platform === 'win32') {
        if (!process.env.PROGRAMDATA) {
            throw new Error('PROGRAMDATA must be set on Windows.');
        }

        return path.join(process.env.PROGRAMDATA, 'WebIQ', 'connect.log');
    }

    return '/var/lib/webiq/connect.log';
}

function parseAllowedOrigins(value) {
    const values = Array.isArray(value)
        ? value
        : String(value || '').split(',').map((origin) => origin.trim()).filter(Boolean);

    if (values.length === 0) {
        throw new Error('NJSERVER_LOG_ALLOWED_ORIGINS must list at least one http(s) origin.');
    }

    return new Set(values.map((origin) => {
        const parsed = new URL(origin);
        if (!['http:', 'https:'].includes(parsed.protocol)
            || parsed.username
            || parsed.password
            || parsed.pathname !== '/'
            || parsed.search
            || parsed.hash) {
            throw new Error(`Invalid allowed origin: ${origin}`);
        }

        return parsed.origin;
    }));
}

function validateApiKey(value) {
    if (typeof value !== 'string' || Buffer.byteLength(value) < 32) {
        throw new Error('NJSERVER_LOG_API_KEY must be a secret of at least 32 bytes.');
    }

    return value;
}

function hasValidApiKey(presentedKey, expectedKey) {
    if (typeof presentedKey !== 'string') {
        return false;
    }

    const presented = Buffer.from(presentedKey);
    const expected = Buffer.from(expectedKey);
    return presented.length === expected.length && timingSafeEqual(presented, expected);
}

function createApp({
    apiKey = process.env.NJSERVER_LOG_API_KEY,
    allowedOrigins = process.env.NJSERVER_LOG_ALLOWED_ORIGINS,
    logFilePath = defaultLogFilePath()
} = {}) {
    const configuredApiKey = validateApiKey(apiKey);
    const configuredOrigins = allowedOrigins instanceof Set
        ? allowedOrigins
        : parseAllowedOrigins(allowedOrigins);
    const app = express();

    app.disable('x-powered-by');

    app.use((req, res, next) => {
        const origin = req.get('origin');
        if (origin && !configuredOrigins.has(origin)) {
            return res.status(403).send('Origin is not allowed.');
        }

        return next();
    });

    app.use(cors({
        origin(origin, callback) {
            callback(null, Boolean(origin && configuredOrigins.has(origin)));
        },
        methods: ['GET'],
        allowedHeaders: ['X-API-Key'],
        maxAge: 600,
        optionsSuccessStatus: 204
    }));

    app.get('/download-log', (req, res) => {
        if (!hasValidApiKey(req.get('x-api-key'), configuredApiKey)) {
            return res.status(401).send('A valid X-API-Key header is required.');
        }

        if (!fs.existsSync(logFilePath)) {
            return res.status(404).send('Log file not found.');
        }

        const archive = new archiver.ZipArchive({ zlib: { level: 9 } });

        archive.on('error', (error) => {
            console.error('Error creating zip file:', error);
            if (res.headersSent) {
                res.destroy(error);
            } else {
                res.status(500).send('Error creating zip file.');
            }
        });

        res.set('Cache-Control', 'no-store');
        res.attachment('connect.zip');
        archive.pipe(res);
        archive.file(logFilePath, { name: 'connect.log' });
        void archive.finalize();
    });

    return app;
}

function getPort(value = process.env.NJSERVER_LOG_PORT) {
    if (!value) {
        return DEFAULT_PORT;
    }

    const port = Number(value);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('NJSERVER_LOG_PORT must be an integer between 1 and 65535.');
    }

    return port;
}

function start() {
    const app = createApp();
    const port = getPort();
    const host = process.env.NJSERVER_LOG_BIND_HOST || DEFAULT_BIND_HOST;

    return app.listen(port, host, () => {
        console.log(`Server listening on http://${host}:${port}`);
    });
}

if (require.main === module) {
    start();
}

module.exports = { createApp, defaultLogFilePath, getPort, parseAllowedOrigins };

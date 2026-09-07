'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { build } = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const WORK_DIR = path.join(ROOT, 'dist', 'sea-work');
const OUTPUT_DIR = path.join(ROOT, 'dist');
const SEA_FUSE = 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2';

function requireSupportedNode() {
    const majorVersion = Number.parseInt(process.versions.node, 10);
    if (!Number.isInteger(majorVersion) || majorVersion < 24) {
        throw new Error(`build:sea requires Node 24 or newer; found ${process.versions.node}.`);
    }
}

async function main() {
    requireSupportedNode();
    fs.rmSync(WORK_DIR, { recursive: true, force: true });
    fs.mkdirSync(WORK_DIR, { recursive: true });

    const bundlePath = path.join(WORK_DIR, 'app.cjs');
    const blobPath = path.join(WORK_DIR, 'app.blob');
    const configPath = path.join(WORK_DIR, 'sea-config.json');
    const extension = process.platform === 'win32' ? '.exe' : '';
    const outputPath = path.join(
        OUTPUT_DIR,
        `njserverlogdown-${process.platform}-${process.arch}${extension}`
    );

    await build({
        entryPoints: [path.join(ROOT, 'server.js')],
        bundle: true,
        format: 'cjs',
        outfile: bundlePath,
        platform: 'node',
        target: 'node24'
    });

    fs.writeFileSync(configPath, JSON.stringify({
        main: bundlePath,
        output: blobPath,
        disableExperimentalSEAWarning: true,
        useCodeCache: false,
        useSnapshot: false
    }, null, 2));

    execFileSync(process.execPath, ['--experimental-sea-config', configPath], {
        cwd: ROOT,
        stdio: 'inherit'
    });
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.copyFileSync(process.execPath, outputPath);

    const postjectPackage = require.resolve('postject/package.json');
    const postjectDirectory = path.dirname(postjectPackage);
    const { bin } = require(postjectPackage);
    const postjectCli = path.join(postjectDirectory, bin.postject);
    const postjectArgs = [
        postjectCli,
        outputPath,
        'NODE_SEA_BLOB',
        blobPath,
        '--sentinel-fuse',
        SEA_FUSE
    ];

    if (process.platform === 'darwin') {
        postjectArgs.push('--macho-segment-name', 'NODE_SEA');
    }

    execFileSync(process.execPath, postjectArgs, { cwd: ROOT, stdio: 'inherit' });
    fs.rmSync(WORK_DIR, { recursive: true, force: true });
    console.log(`Created ${path.relative(ROOT, outputPath)}. Sign it before distribution.`);
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});

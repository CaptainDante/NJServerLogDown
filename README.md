# NJServerLogDown: secure WebIQ `connect.log` download

NJServerLogDown streams the WebIQ `connect.log` as `connect.zip` for support
work. It is deliberately small, but it serves diagnostic data that can contain
hostnames, IP addresses, and tag names. The download endpoint is therefore
**authenticated, origin-restricted, and loopback-only by default**.

## Requirements

- Node.js 24 or newer for source deployments and builds.
- An API key of at least 32 bytes.
- The exact browser origins that may call the service, for example
  `https://hmi.example.local`.

## Configure and run from source

Install the locked dependency tree, then set the required configuration before
starting the server:

```bash
npm ci
export NJSERVER_LOG_API_KEY="replace-with-a-32-byte-or-longer-secret"
export NJSERVER_LOG_ALLOWED_ORIGINS="https://hmi.example.local"
npm start
```

PowerShell equivalent:

```powershell
npm ci
$env:NJSERVER_LOG_API_KEY = "replace-with-a-32-byte-or-longer-secret"
$env:NJSERVER_LOG_ALLOWED_ORIGINS = "https://hmi.example.local"
npm start
```

The service fails at startup if either required setting is absent or invalid. Do
not commit the key or put it in a public WebIQ project.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NJSERVER_LOG_API_KEY` | Yes | — | 32-byte-or-longer secret required in the `X-API-Key` request header. |
| `NJSERVER_LOG_ALLOWED_ORIGINS` | Yes | — | Comma-separated, exact `http://` or `https://` browser origins. Wildcards and URL paths are rejected. |
| `NJSERVER_LOG_BIND_HOST` | No | `127.0.0.1` | Listener address. Set `0.0.0.0` only when a firewall or reverse proxy restricts source networks. |
| `NJSERVER_LOG_PORT` | No | `3000` | TCP listener port. |

Generate a suitable key with `openssl rand -hex 32` or an equivalent secret
manager. Rotate it if it appears in browser code, logs, screenshots, or source
control.

## Request the log

The only data route is `GET /download-log`. It requires the API key:

```bash
curl --fail --header "X-API-Key: $NJSERVER_LOG_API_KEY" \
  --output connect.zip http://127.0.0.1:3000/download-log
```

Responses include `Cache-Control: no-store`. Browser requests from an origin not
listed in `NJSERVER_LOG_ALLOWED_ORIGINS` are rejected before the log is read.

## WebIQ integration

Use [`WebIQ_Sample_script`](./WebIQ_Sample_script) as the button action after
replacing both placeholders. The browser origin that hosts WebIQ must appear in
`NJSERVER_LOG_ALLOWED_ORIGINS` exactly, including its scheme and port.

The browser receives the API key in this integration. Treat every user who can
read that WebIQ script as authorized to download the log; protect the WebIQ app
with its own user roles. For stronger separation, keep the service loopback-only
and put an authenticated reverse proxy in front of it instead.

## Container deployment

The image uses the supported Node 24 LTS and installs the locked production tree
with `npm ci`. It runs as the unprivileged `node` user. Mount the log read-only
and ensure that user can read the mounted file.

```bash
docker build -t njserverlogdown:local .
docker run --rm \
  -p 127.0.0.1:3000:3000 \
  -e NJSERVER_LOG_BIND_HOST=0.0.0.0 \
  -e NJSERVER_LOG_API_KEY="replace-with-a-32-byte-or-longer-secret" \
  -e NJSERVER_LOG_ALLOWED_ORIGINS="https://hmi.example.local" \
  --mount type=bind,src=/var/lib/webiq/connect.log,dst=/var/lib/webiq/connect.log,readonly \
  njserverlogdown:local
```

Publish the port to a specific trusted interface or a reverse proxy. Do not use a
public port-forward or expose port 3000 directly to an untrusted network.

## Build a standalone executable

The old `pkg` workflow embedded end-of-life Node 18 and is removed. The
`build:sea` script now creates a native single executable using Node's supported
single-executable application (SEA) workflow. Build on each target platform and
architecture using Node 24; it does not cross-compile.

```bash
npm ci
npm run build:sea
```

The artifact is written to `dist/njserverlogdown-<platform>-<architecture>`.
Sign Windows and macOS artifacts before distributing them. Rebuild and republish
executables whenever Node 24 receives a security update.

## Verify changes

```bash
npm test
npm audit --package-lock-only
```

The tests exercise denied requests, disallowed origins, allowed CORS preflight,
and an authorized ZIP response. The audit must remain clean before release.

## Project structure

```
NJServerLogDown/
├── server.js              # authenticated log-download service
├── test/server.test.js    # HTTP security and ZIP regression tests
├── scripts/build-sea.js   # native Node 24 SEA build
├── WebIQ_Sample_script    # WebIQ button action
├── Dockerfile
└── package.json
```

## License

MIT. See [LICENSE](./LICENSE).

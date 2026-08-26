# NJServerLogDown: one-click download of the WebIQ `connect.log`

<!-- Demo GIF: record ~10 seconds (browser hits /download-log, connect.zip lands in Downloads) and add it here -->

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

[WebIQ](https://www.smart-hmi.com) runtimes usually live on headless Linux
boxes or locked-down industrial PCs. When support asks for the `connect.log`,
nobody wants to walk an operator through SSH and `scp` on the plant floor.

**NJServerLogDown** is a tiny Node.js server that solves this: it zips the
WebIQ Connect log and serves it as a one-click browser download, or as a
download button inside your WebIQ application itself.

## What it does

- Exposes one endpoint: `GET /download-log`
- Finds the WebIQ `connect.log` automatically:
  - **Windows:** `%PROGRAMDATA%\WebIQ\connect.log`
  - **Linux:** `/var/lib/webiq/connect.log`
- Zips it (max compression) and streams it back as `connect.zip`
- Returns `404` with a clear message if the log file isn't there
- Ships as a standalone executable: no Node.js needed on the target machine

## Quick start

### Option A: download the executable (recommended)

1. Grab the file for your platform from the **[Releases page](https://github.com/DanteDevOps/NJServerLogDown/releases)**.
2. Run it:

   ```bash
   # Linux
   chmod +x njserverlogdown-linux
   ./njserverlogdown-linux

   # Windows
   njserverlogdown-win.exe
   ```

3. The server starts on `http://0.0.0.0:3000`.

### Option B: run from source

```bash
git clone https://github.com/DanteDevOps/NJServerLogDown.git
cd NJServerLogDown
npm install
npm start
```

## Usage

From any machine on the same network:

```
http://<SERVER_IP>:3000/download-log
```

The browser downloads `connect.zip` containing the current `connect.log`.

## Use it inside a WebIQ application

You can put a "Download log" button directly into your WebIQ HMI:

1. Log in to the [Smart HMI](https://www.smart-hmi.com) user area and download
   the free `lib-jquery3` package.
2. Install the package in your WebIQ application.
3. Use the script in [`WebIQ_Sample_script`](./WebIQ_Sample_script) as the
   button's action.

## Security notes: read before deploying

This tool is built for **trusted engineering and commissioning networks**. By design:

- There is **no authentication**. Anyone who can reach port 3000 can download the log.
- **CORS is fully open**, so a WebIQ app served from another port can call the endpoint. Restrict the origin in `server.js` if your setup allows it.
- The server listens on **all network interfaces** (`0.0.0.0`).
- Log files can contain internal hostnames, IP addresses, and tag names. **Treat the download as sensitive data.**

Do not expose this service to the open internet or route it through a firewall
port-forward. If the machine runs `ufw`, open only what you need on the local
network:

```bash
sudo ufw allow 3000/tcp    # this server
sudo ufw allow 10123/tcp   # WebIQ Runtime
sudo ufw allow 10124/tcp   # WebIQ Manager
sudo ufw enable
```

## Build your own executable

The project uses [`pkg`](https://github.com/vercel/pkg) to build standalone binaries:

```bash
npm install -g pkg
pkg .                              # build for your current platform
pkg . --targets node18-win-x64     # Windows
pkg . --targets node18-linux-x64   # Linux
```

> Note: `pkg` is no longer actively maintained. It still works fine for this
> project; if it ever breaks, Node.js now has a built-in single-executable
> feature that can replace it.

## Project structure

```
NJServerLogDown/
├── server.js             # the whole server (~45 lines)
├── WebIQ_Sample_script   # button code for your WebIQ app
├── package.json
└── Dockerfile
```

## Contributing

Issues and pull requests are welcome, especially reports from other WebIQ
deployment setups.

## License

MIT. See [LICENSE](./LICENSE).

---

Built by **[Dante Vetony](https://dantevetony.com)**, solution engineer working
where OT meets AI. More tools and writing on the site.

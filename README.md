
# Node js Server - Connect.log file Download for WebIQ

## Overview

NJServerLogDown is a Node.js server application designed to allow users to download log files from a server. The server is built using Express.js and supports CORS for cross-origin requests. The log file is zipped before being sent to the client.

## Features

- Download log files from the server
- Simple setup and usage
- Can be packaged as a standalone executable
- Automatically zips log files before download

## Download and Run

You can simply download and run the `njserverlogdown-win.exe`, `njserverlogdown-linux` from dist folder OR you can modify the code and make your own executable server.

## WebIQ Applications

For the WebIQ applications, you need to download and install the `lib-jquery3` from [Smart HMI](https://www.smart-hmi.com). You need to log in and download it from the User area and install the package in your application to use the WebIQ sample code.

## Project Structure

```
NJServerLogDown/
├── node_modules/
├── package.json
├── server.js
```

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) installed
- [npm](https://www.npmjs.com/) installed
- [pkg](https://github.com/vercel/pkg) installed globally

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/DanteDevOps/NJServerLogDown.git
   cd NJServerLogDown
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

## Usage

1. Start the server:

   ```bash
   node server.js
   ```

   The server will start running at `http://0.0.0.0:3000`.

2. To download the log file, make a GET request to:

   ```
   http://<YOUR_SERVER_IP>:3000/download-log
   ```

   Replace `<YOUR_SERVER_IP>` with the actual IP address of the server. This will download the log file as a zipped archive named `connect.zip`.  ```

## Creating an Executable

You can create a standalone executable for the server using `pkg`.

1. Ensure `pkg` is installed globally:

   ```bash
   npm install -g pkg
   ```

2. Create the executable:

   ```bash
   pkg .
   ```

   This will generate an executable for your platform in the project directory.

3. To specify a target platform, use the `--targets` option. For example, to create a Windows executable:

   ```bash
   pkg . --targets node14-win-x64
   ```
4. To create a Linux executable, use:

   ```bash
   pkg . --targets node14-linux-x64
   ```
   
## Running on Linux

1. Transfer the generated Linux executable to your Linux machine.

2. Set executable permissions:

   ```bash
   chmod +x dist/njserverlogdown-linux
   ```

3. Run the executable:

   ```bash
   ./dist/njserverlogdown-linux
   ```

   The server will start running at `http://0.0.0.0:3000`.

## Configuring Firewall and Network Settings

To ensure that the server can be accessed from other machines on the network, you need to configure the firewall and network settings on your Ubuntu server.

1. **Allow Port 3000 Through the Firewall:**

   ```bash
   sudo ufw allow 3000/tcp  //for Node js Server
   sudo ufw allow 10123/tcp  //for WebIQ Runtime
   sudo ufw allow 10124/tcp  //for WebIQ manager
   sudo ufw enable
   ```

2. **Verify Server Accessibility:**

   - From your client machine, try to access the server directly using a browser or a tool like `curl`:

     ```bash
     curl http://<YOUR_SERVER_IP>:3000/download-log
     ```

   - If the server is reachable, you should see the response or the file being downloaded.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

06061307,kHK4d0RovYefzr-ns3d1Fw,2024-10-10T11:28:13.282274+00:00

06061316,N5XhdbvONi8yljHZzvLs_g,2024-10-10T11:28:13.448957+00:00

06061315,yUFrKY3DyPWnVyh3d5cWZg,2024-10-10T11:28:13.563828+00:00

06061313,-z68Piprn-s8MN3ZtIkmJQ,2024-10-10T11:28:13.674777+00:00

```

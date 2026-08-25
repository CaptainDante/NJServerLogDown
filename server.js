const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

app.use(cors());

app.get('/download-log', (req, res) => {
    let logFilePath;

    if (process.platform === 'win32') {
        logFilePath = path.join(process.env.PROGRAMDATA, 'WebIQ', 'connect.log');
    } else {
        logFilePath = '/var/lib/webiq/connect.log';
    }

    if (fs.existsSync(logFilePath)) {
        // Create a ZIP archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Compression level
        });

        archive.on('error', (err) => {
            console.error('Error creating zip file:', err);
            res.status(500).send('Error creating zip file');
        });

        res.attachment('connect.zip');

        archive.pipe(res);
        archive.file(logFilePath, { name: 'connect.log' });
        archive.finalize();
    } else {
        res.status(404).send('Log file not found');
    }
});

const port = 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});

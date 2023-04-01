//This is the back-end server file for the SSO
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

const server = http.createServer((req, res) => {
    let q = url.parse(req.url, true);

    /*Ignore all arbitrary file requests. The only files returned are:
      - index.html
      - favicon.ico
      - client.css
      - client.js
      All file other requests are ignored

      If, instead, the client sends a login or sign up request, the server will verify that
      Finally, if another service (ex. MachTarok) asks if a token/username combination is valid, the server will send a boolean response
    */

    let filename = '404.html';
    switch (q.pathname) {
        case 'favicon.ico':
            filename = 'favicon.ico';
            break;
        case 'index':
        case 'index.html':
        case '/':
        case '':
            filename = 'index.html';
            break;
        case 'client.css':
            filename = 'client.css';
            break;
        case 'client.js':
            filename = 'client.js';
    }


    let ext = path.parse(filename).ext;
    // maps file extension to MIME type
    let MIME_TYPE = {
        '.ico': 'image/png',
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword'
    };

    fs.readFile(filename, function (err, data) {
        if (err || filename.indexOf('_') != -1) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            return res.end("404 Not Found");
        }
        res.writeHead(200, { 'Content-Type': MIME_TYPE[ext] || 'text/plain' });
        res.write(data);
        return res.end();
    });
});

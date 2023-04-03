//This is the back-end server file for the SSO
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const parser = require('body-parser');
const express = require('express');
const mariadb = require('mariadb');
const argon2 = require('argon2');
const crypto = require('crypto');

const app = express();
app.use(parser.json);//For processing JSON POST calls

const PASSWORD = process.argv[2];

if (!PASSWORD) {
    throw 'No password was given';
}

const pool = mariadb.createPool({
     //Host: localhost, port: 3306
     user:'MachSSO',
     password: PASSWORD,
     connectionLimit: 5
});

const ACTIVE_USERS = {};
function User(username, token) {
    this.username = username;
    this.token = token;
    this.time = Date.now();
}

function postLogin(req, res) {
    if(!req.headers.authorization) {
        console.log('Sent request without username or password');
        res.writeHead(403);
        return res.end();
    }

    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, password] = credentials.split(':');
    //Someone is trying to log in
    //Username: must be an alphanumeric string of 5-64 characters, - and _ allowed
    //Password: must be 12-64 characters
    //OTP: must be a 6-digit number

    console.log('Login attempt: ' + username);
    signIn(username, password).then((token) => {
        //Success
        console.log('Token successfully created: ' + token);
        res.writeHead(200, token);
        return res.end();
    }).catch((err) => {
        //Failure
        res.writeHead(403);
        return res.end();
    });
}

const server = http.createServer((req, res) => {
    let q = url.parse(req.url, true);
    if (req.method == 'GET') {

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
            case '/favicon.ico':
                filename = 'favicon.ico';
                break;
            case '/index':
            case '/index.html':
            case '/':
            case '':
                filename = 'index.html';
                break;
            case '/settings':
            case '/settings.html':
                filename = 'settings.html';
                break;
            case '/client.css':
                filename = 'client.css';
                break;
            case '/client.js':
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
    } else if (req.method == 'POST') {
        if (q.pathname == '/login') {
            return postLogin(req, res);
        }
    }
});



//MariaDB interface functions

async function asyncFunction() {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT 1 as val");
        console.log(rows); //[ {val: 1}, meta: ... ]
        const res = await conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
        console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}

async function createUser(username, password) {
    password = String.prototype.normalize(password);
    if (password.length < 12) {
        return null;//Reject short passwords
    }

    //The salt is built-in to argon2
    const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 12288,
        hashLength: 50,
        timeCost: 3,
        parallelism: 1
    });
    //TODO Verify that no other accounts exist with the same name

    //TODO Send user to MariaDB

    //Create a session token
    return signIn(username, password);
}

async function signIn(username, password, OTP) {
    throw "Temporary reject all ERROR";//TEMPORARY. TODO: implement actually auth
    password = String.prototype.normalize(password);
    //TODO Get username info from MariaDB
    mdb = {pass:'thepass', username: 'thename', otp:123456}
    if (await argon2.verify(mdb.pass, password)) {
        //Password match. Create a session token for the user
        let sessionId = crypto.randomBytes(128);
        ACTIVE_USERS[sessionId] = new User(username, sessionId);
    } else {
        // password did not match
        console.log('Mismatch username and password: ' + username);
        //DO NOT LOG PASSWORDS
        throw "Mismatch username/password combination";
    }
}

server.listen(8844);
console.log('Server listening on port 8844. Available at http://localhost:8844/');
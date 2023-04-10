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

const limiter = [];
const RESERVED = {
    'guest': true,
    'admin': true,
    'prever': true,
    'valat': true,
    'contra': true,
    'povenost': true,
    'the': true,
    'a': true
};

if (!PASSWORD) {
    throw 'No password was given';
}

const pool = mariadb.createPool({
     //Host: localhost, port: 3306
     user:'MachSSO',
     database: 'machsso',
     password: PASSWORD,
     connectionLimit: 5
});

const ACTIVE_USERS = {};
function User(username, token) {
    this.username = username;
    this.token = token;
    this.timeout = setTimeout(logout,30*60*1000,this.username);//Logout after 30 minutes of inactivity
}

function postLogin(req, res) {
    if(!req.headers.authorization) {
        console.log('Sent request without username or password');
        res.writeHead(403);
        return res.end();
    }
    let username, password;
    try {
        const base64Credentials = req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
        [username, password] = credentials.split(':');
        if (username.length == 0 || username.length > 64 || password.length < 12 || password.length > 64) {
            throw "Username or password length incorrect";
        }

    } catch (err) {
        console.log('Missing or corrupted credentials');
        res.writeHead(403);
        return res.end();
    }
    //Someone is trying to log in
    //Username: must be an alphanumeric string of 5-64 characters, - and _ allowed
    //Password: must be 12-64 characters
    //OTP: must be a 6-digit number or null
    signIn(username, password).then((token) => {
        //Success
        console.log('Token successfully created: ' + token);
        res.writeHead(200);
        res.write(token);
        return res.end();
    }).catch((err) => {
        //Failure
        res.writeHead(403);
        return res.end();
    });
}

function postSignup(req, res) {
    if(!req.headers.authorization) {
        console.log('Sent request without username or password');
        res.writeHead(403);
        return res.end();
    }
    let username, password;
    try {
        const base64Credentials = req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
        [username, password] = credentials.split(':');
        if (username.length == 0 || username.length > 64 || password.length < 12 || password.length > 64) {
            throw "Username or password length incorrect";
        }

    } catch (err) {
        console.log('Missing or corrupted credentials');
        res.writeHead(403);
        return res.end();
    }
    createUser(username, password).then((token) => {
        //Success
        console.log('Account and token successfully created: ' + username + '\n' + token);
        res.writeHead(200);
        res.write(token);
        return res.end();
    }).catch((err) => {
        //Failure
        console.log(err);
        res.writeHead(403);
        return res.end();
    });
}

function verifyUser(req, res) {
    if(!req.headers.authorization) {
        console.log('Sent request without username or password');
        res.writeHead(403);
        return res.end();
    }
    let username, token;
    try {
        [username, token] = req.headers.authorization.split(':');
        if (username.length == 0 || username.length > 64 || !token) {
            throw "Username or password length incorrect";
        }
    } catch (err) {
        console.log('Missing or corrupted credentials');
        res.writeHead(403);
        return res.end();
    }
    if (ACTIVE_USERS[username] && ACTIVE_USERS[username].token == token) {
        console.log('User verified: ' + username);
        clearTimeout(ACTIVE_USERS[username].timeout)
        ACTIVE_USERS[username].timeout = setTimeout(logout,30*60*1000,username);
        res.writeHead(200);
        return res.end();
    } else {
        console.log('Incorrect username/token combination: ' + username + '\n' + token);
        res.writeHead(403);
        return res.end();
    }
}

const server = http.createServer((req, res) => {
    let q = url.parse(req.url, true);
    if (req.headers['x-forwarded-proto'] != 'https') {
        res.writeHead(400);
        res.write('Insecure connection detected. Use https.\n');
        res.end('400 Unsupported Protocol');
    }

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
            case '/sign-up':
            case '/signup':
            case '/sign-up.html':
            case '/signup.html':
                filename = 'sign-up.html';
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
        if (q.pathname == '/verify') {
            return verifyUser(req, res);
        }
        if (limiter[req.headers['x-forwarded-for']] && limiter[req.headers['x-forwarded-for']] > Date.now()) {
            res.writeHead(429);
            res.write('429 Too many requests');
            return res.end();
        }
        limiter[req.headers['x-forwarded-for']] = Date.now() + 5000;
        //Must wait 5 seconds after each login attempt
        if (q.pathname == '/login') {
            return postLogin(req, res);
        } else if (q.pathname == '/signup') {
            limiter[req.headers['x-forwarded-for']] = Date.now() + 10000;
            //Must wait a minute after each account creation
            return postSignup(req, res);
        }
    }
});

async function createUser(username, password) {
    password = password.normalize();
    username = username.toLowerCase();
    if (password.length < 12) {
        throw "Short password";
    }
    if (/\s/.test(username)) {
        throw "Username contains whitespace";
    }
    if (RESERVED[username]) {
        throw "Attempted to use a reserved name";
    }

    //The salt is built-in to argon2
    const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 12288,
        hashLength: 50,
        timeCost: 3,
        parallelism: 1
    });

    let conn;
    try {
        conn = await pool.getConnection();
        let usernameCheck = await conn.query("SELECT id FROM auth WHERE username = ?", username);
        if (usernameCheck.length > 0) {
            throw "User already exists";
        }
        await conn.query("INSERT INTO auth (username, password) VALUES (?, ?)", [username, hash]);
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
    }

    //Create a session token
    return signIn(username, password);
}

async function signIn(username, password, OTP) {
    password = password.normalize();
    username = username.toLowerCase();
    if (/\s/.test(username)) {
        throw "Username contains whitespace";
    }
    let infoFromDatabase;
    let conn;
    try {
        conn = await pool.getConnection();
        infoFromDatabase = await conn.query("SELECT password FROM auth WHERE username = ?", username);
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
    }

    if (await argon2.verify(infoFromDatabase[0].password, password)) {
        //Password match. Create a session token for the user
        let sessionId = crypto.randomBytes(128).toString('hex');
        ACTIVE_USERS[username] = new User(username, sessionId);
        return sessionId;
    } else {
        // password did not match
        console.log('Mismatch username and password: ' + username);
        //DO NOT LOG PASSWORDS
        throw "Mismatch username/password combination";
    }
}

function logout(username) {
    delete ACTIVE_USERS[username];
}

server.listen(8844);
console.log('Server listening on port 8844. Available at http://localhost:8844/');
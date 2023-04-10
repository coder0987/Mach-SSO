let locked = false;
let userNameToken;

function reqListener() {
    unlock();
    if (this.status == 403 || this.status == 429 || this.status == 400) {
        //Login failed
        console.log('Login failed!');
        setStatus('fail');
    } else {
        //Login successful
        //Add session cookie
        userNameToken = document.getElementById('username').value + ':' + this.response;
        setStatus('success');
    }
}

function setStatus(to,reason) {
    let ls = document.getElementById('login_status');
    let lsd = document.getElementById('login_status_div');
    switch (to) {
        case 'fail':
            lsd.classList.add('fail');
            lsd.classList.remove('success');
            reason = reason || 'Login Attempt Unsuccessful';
            ls.innerHTML = reason;
            break;
        case 'success':
            lsd.classList.add('success');
            lsd.classList.remove('fail');
            ls.innerHTML = 'Success!';
            let params = new URLSearchParams(document.location.search);
            let redirect = params.get('redirect'); //is the destination URL
            if (redirect) {
                ls.innerHTML += ' Redirecting...';
                window.opener.postMessage(userNameToken, 'https://machtarok.com');
                window.close();
            }
            break;
        case 'inform':
            ls.innerHTML = reason;
            break;
        default:
            lsd.classList.remove('fail');
            lsd.classList.remove('success');
            ls.innerHTML = '';
    }
}

function login() {
    if (locked) {return;}
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    if (username.length == 0 || username.length > 64 || password.length < 12 || password.length > 64) {
        setStatus('fail','Username and password must be less than 64 characters long. Password must be at least 12 characters long.');
        return;
    }
    let authString;
    try {
        authString = btoa(username + ':' + password);
    } catch (err) {
        setStatus('fail','Invalid characters.');
        return;
    }
    lock();
    const req = new XMLHttpRequest();
    req.addEventListener("load", reqListener);
    req.open("POST", "/login", true);
    req.setRequestHeader("Authorization", 'Basic ' + authString);
    req.send();
}

function signup() {
    console.log('Sign up attempt...');
    if (locked) {return;}
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    let verifyPassword = document.getElementById('passwordVerify').value;
    if (password != verifyPassword) {return;}
    if (username.length == 0 || username.length > 64 || password.length < 12 || password.length > 64) {
        setStatus('fail','Username and password must be less than 64 characters long. Password must be at least 12 characters long.');
        return;
    }
    let authString;
    try {
        authString = btoa(username + ':' + password);
    } catch (err) {
        setStatus('fail','Invalid characters.');
        return;
    }
    lock();
    const req = new XMLHttpRequest();
    req.addEventListener("load", reqListener);
    req.open("POST", "/signup", true);
    req.setRequestHeader("Authorization", 'Basic ' + authString);
    req.send();
}

function lock() {
    locked = true;
    setStatus('inform','loading');
}

function unlock() {
    locked = false;
}
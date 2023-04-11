let locked = false;
let userNameToken;
//Replace machtarok.com with your trusted website when self hosting
const VALID_OPENERS = {'https://machtarok.com/': true}


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
        localStorage.setItem('machsso',userNameToken);
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
            let redirect = params.get('redirect'); //is the opener URL
            if (redirect && VALID_OPENERS[redirect]) {
                ls.innerHTML += ' Redirecting...';
                window.opener.postMessage(userNameToken, redirect);
                window.close();
            } else if (redirect) {
                console.log(redirect + ' is not a valid opener');
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
        if (/\s/.test(username)) {
            throw "Username contains whitespace";
        }
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
    if (password != verifyPassword) {
        setStatus('fail','Password and Password Verification must match');
        return;
    }
    if (username.length == 0 || username.length > 64 || password.length < 12 || password.length > 64) {
        setStatus('fail','Username and password must be less than 64 characters long. Password must be at least 12 characters long.');
        return;
    }
    let authString;
    try {
        if (/\s/.test(username)) {
            throw "Username contains whitespace";
        }
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

function clearSaves() {
    localStorage.clear();
}

function signOut() {
    //TODO tell the server to delete my token
}

function autoSignInCallback() {
    unlock();
    if (this.status == 200) {
        setStatus('success');
    } else {
        userNameToken = '';
        clearSaves();
        setStatus('fail','Auto Sign-In failed');
    }
}

window.onload = () => {
    document.getElementById('signup').href += document.location.search;
    if (localStorage.getItem('machsso')) {
        lock();
        userNameToken = localStorage.getItem('machsso');
        const req = new XMLHttpRequest();
        req.addEventListener("load", autoSignInCallback);
        req.open("POST", "/verify", true);
        req.setRequestHeader("Authorization", userNameToken);
        req.send();
    }
}
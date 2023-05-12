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
            lsd.classList.remove('fail');
            lsd.classList.remove('success');
            ls.innerHTML = reason;
            break;
        default:
            lsd.classList.remove('fail');
            lsd.classList.remove('success');
            ls.innerHTML = '';
    }
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
    if (username.length == 0 || username.length > 64 || password.length < 4 || password.length > 64) {
        setStatus('fail','Username and password must be less than 64 characters long. Password must be at least 4 characters long.');
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
    setStatus('inform','Signing out...');
    document.getElementById('signOut').setAttribute('hidden','hidden');
    let params = new URLSearchParams(document.location.search);
    let redirect = params.get('redirect'); //is the opener URL
    if (redirect && VALID_OPENERS[redirect]) {
        window.opener.postMessage('signOut', redirect);
        window.close();
    } else if (redirect) {
        console.log(redirect + ' is not a valid opener');
    }
}

//Force HTTPS client-side. This is likely redundant with server-side HTTPS enforcement
if (location.protocol !== 'https:') {
    location.replace('https:${location.href.substring(location.protocol.length)}');
}

window.onload = () => {
    document.getElementById('form').addEventListener('submit',(event) => {signup(); event.preventDefault(); return false;});
}

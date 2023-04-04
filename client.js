function reqListener() {
    if (this.status == 403) {
        //Login failed
        console.log('Login failed!');
        setStatus('fail');
    } else {
        //Login successful
        //Add session cookie
        document.cookie = 'This is a cookie ig';//TODO
        console.log(this.getAllResponseHeaders());
        setStatus('success');
    }
}

function setStatus(to) {
    let ls = document.getElementById('login_status');
    let lsd = document.getElementById('login_status_div');
    switch (to) {
        case 'fail':
            lsd.classList.add('fail');
            lsd.classList.remove('success');
            ls.innerHTML = 'Login Attempt Unsuccessful';
            break;
        case 'success':
            lsd.classList.add('success');
            lsd.classList.remove('fail');
            ls.innerHTML = 'Success!';
            let params = new URLSearchParams(document.location.search);
            let redirect = params.get('redirect'); //is the destination URL
            if (redirect) {
                ls.innerHTML += ' Redirecting...';
                window.location.replace(redirect);
            }
            break;
        default:
            lsd.classList.remove('fail');
            lsd.classList.remove('success');
            ls.innerHTML = '';
    }
}

function login() {
    const req = new XMLHttpRequest();
    req.addEventListener("load", reqListener);
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    req.open("POST", "/login", true);
    req.setRequestHeader("Authorization", 'Basic ' + btoa(username + ':' + password));
    req.send();
    //TODO: otp
}
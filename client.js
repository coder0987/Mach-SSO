function reqListener() {
    console.log(JSON.stringify(this.responseText));
}


function login() {
    const req = new XMLHttpRequest();
    req.addEventListener("load", reqListener);
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    req.open("POST", "/login", true, username, password);
    req.setRequestHeader("Authorization", 'Basic ' + btoa(username + ':' + password));
    req.send();
    //TODO: otp
}
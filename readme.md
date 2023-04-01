### Mach SSO

A simple single sign-on solution for MachTarok and related projects

Note that Mach SSO can be used for applications besides MachTarok, but it was built specifically for that

### Usage

Mach SSO is currently under active development and cannot be used at all

### How It Works

Mach SSO creates a MariaDB instance and stores usernames and hashed passwords (with salt) in it

Upon log-in request, Mach SSO will fetch the corresponding username/password from the database and perform a validity check

If all goes well, Mach SSO will create a session token and return that to the user. Otherwise, Mach SSO will return an error

Upon sign-up, Mach SSO will verify username and password validity, then hash the password with salt and store the information in the database

Upon success, Mach SSO will return a session token to the client. Upon failure, Mach SSO will return an error

### Verifying Tokens

MachTarok and other services will receive tokens from the client on connection. The service will then send the token and username to Mach SSO

If the token/username combination match and are not outdated, Mach SSO will return true

Otherwise, Mach SSO will return a corresponding error (token outdated, token does not match username, etc.)

It is then up to the service to keep track of who is validated and who is not
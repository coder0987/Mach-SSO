### Mach SSO

A simple single sign-on solution for MachTarok and related projects

Note that Mach SSO can be used for applications besides MachTarok, but it was built specifically for that

### Usage

1. Install MariaDB
2. Create a MariaDB database and user
```
mariadb -p -u root
CREATE DATABASE machsso;
USE machsso;
CREATE TABLE auth (
id MEDIUMINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
username TEXT NOT NULL,
password TEXT NOT NULL);
CREATE USER 'MachSSO'@'localhost' IDENTIFIED BY 'p@sSw0rD';
```
3. Set the new user's permissions to be as limited as possible
```
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'MachSSO'@'localhost';
GRANT SELECT ON auth TO 'MachSSO'@'localhost';
GRANT INSERT ON auth TO 'MachSSO'@'localhost';
FLUSH PRIVILEGES;
exit;
```
4. Create a .env File

Create a file named ``.env`` with the text
``
PASSWORD=p@sSw0rD
``
Where p@sSw0rD is your password

It's important to keep this file safe and prevent others from accessing it

5. Run the server
```
node _server.js
```
6. Connect a reverse proxy and enable HTTPS (Apache, NGinx, BoringProxy, etc.)\
This final step is necessary as MachSSO automatically rejects all HTTP requests
7. Trust your project\
Edit index.html `VALID_OPENERS` to include your website's domain name instead of machtarok.com

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

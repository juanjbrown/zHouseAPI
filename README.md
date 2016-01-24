# zHouseAPI

Part of the [zHouse Suite](https://github.com/search?q=user%3Apauljdehmer+zHouse).

A restful API for home automation built on top of [node-openzwave-shared](https://github.com/OpenZWave/node-openzwave-shared).

Included is a [postman](https://www.getpostman.com/) collection with all endpoints.

Upon first launch a user with username 'admin' and password 'password' is created. For security, please change this password.

This program has capabilities to record camera feeds during an alarm. The feeds are saved on the docker host machine in the directory /media/drive1/serverData/security/.

### Prerequisites

  1. You will need a mysql database to connect to. Please rename the config.template to config.js, and replace the template values with your values.
  
  2. (OPTIONAL) You will need an aws account to be able to send sms and emails.
  
### Config

  1. frontend: url to your frontend installation. this is used in the email template for user registration, and forgot password functionality
  
  2. server: hostname and port you would like to run the API server under
  
  3. database: your mysql database info
  
  4. aws: your aws credentials
  
  5. cameras: how long to record cameras when an alarm is tripped (value is in seconds)

### Quickstart

  1. Install docker

    [Docker](http://docs.docker.com/mac/started/)
    
  2. Run docker script

    ```
    $ ./scripts/run.sh
    ```
    
    This builds the docker image and runs the zHouseAPI application on the docker host's network
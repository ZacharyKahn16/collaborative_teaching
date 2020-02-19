#!/usr/bin/env bash

apt-get update && apt-get upgrade -y
apt install -y curl gnupg2
apt-get -y install mongodb
service mongodb stop
mkdir $HOME/db
mongod --dbpath $HOME/db --port 80 --fork --logpath /var/tmp/mongodb
exit

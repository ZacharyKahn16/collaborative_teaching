#!/usr/bin/env bash
PROJECT_ID=$(curl -s "http://metadata.google.internal/computeMetadata/v1/project/project-id" -H "Metadata-Flavor: Google")

apt-get update && apt-get upgrade -y
apt-get install -yq ca-certificates build-essential supervisor curl gnupg2

apt-get -y install mongodb
service mongodb stop
mkdir $HOME/db
mongod --dbpath $HOME/db --port 80 --fork --logpath /var/tmp/mongodb

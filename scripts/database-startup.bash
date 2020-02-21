#!/usr/bin/env bash
PROJECT_ID=$(curl -s "http://metadata.google.internal/computeMetadata/v1/project/project-id" -H "Metadata-Flavor: Google")
NAME=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/name" -H "Metadata-Flavor: Google")

# Install dependencies
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -yq ca-certificates build-essential supervisor curl gnupg2 nano vim net-tools wget gnupg
wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list
sudo apt-get update
sudo apt-get install -y mongodb

sudo service mongodb stop
sudo systemctl daemon-reload
sudo mkdir $HOME/db
sudo mkdir $HOME/data
sudo mkdir $HOME/data/db

sudo mongod --dbpath $HOME/db --port 80 --fork --logpath /var/tmp/mongodb

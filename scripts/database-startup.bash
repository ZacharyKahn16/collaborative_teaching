#!/usr/bin/env bash
PROJECT_ID=$(curl -s "http://metadata.google.internal/computeMetadata/v1/project/project-id" -H "Metadata-Flavor: Google")
NAME=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/name" -H "Metadata-Flavor: Google")

# Install dependencies
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -yq ca-certificates build-essential supervisor curl gnupg2 nano vim net-tools
sudo apt-get -y install mongodb

sudo service mongodb stop
sudo mkdir $HOME/db
sudo mongod --dbpath $HOME/db --port 80 --fork --logpath /var/tmp/mongodb


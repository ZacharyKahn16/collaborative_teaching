#!/usr/bin/env bash

PROJECT_ID=$(curl -s "http://metadata.google.internal/computeMetadata/v1/project/project-id" -H "Metadata-Flavor: Google")
NAME=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/name" -H "Metadata-Flavor: Google")

# Install dependencies
apt-get update
apt-get install -y mongodb

service mongodb stop
mkdir $HOME/db
mongod --dbpath $HOME/db --port 80 --bind_ip 0.0.0.0 --fork --logpath /var/tmp/mongodb

gcloud compute --project=${PROJECT_ID} instances add-metadata ${NAME} --metadata startup-status=running,startup-on=$(date +%s) --zone=us-central1-a

#!/usr/bin/env bash

PROJECT_ID=$(curl -s "http://metadata.google.internal/computeMetadata/v1/project/project-id" -H "Metadata-Flavor: Google")
NAME=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/name" -H "Metadata-Flavor: Google")

# Install dependencies
apt-get update && apt-get upgrade -y
apt-get install -yq ca-certificates build-essential curl gnupg2 nano vim net-tools
apt-get install -y mongodb

systemctl status mongodb
sed -i '/bind_ip = 127.0.0.1/c\bind_ip = 0.0.0.0' /etc/mongodb.conf
sed -i '/#port = 27017/c\port = 80' /etc/mongodb.conf
systemctl restart mongodb
mongo --eval 'db.runCommand({ connectionStatus: 1, showPrivileges: true})'

gcloud compute --project=${PROJECT_ID} instances add-metadata ${NAME} --metadata startup-status=running,startup-on=$(date +%s) --zone=us-central1-a

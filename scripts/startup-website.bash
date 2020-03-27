#!/usr/bin/env bash
PROJECT_ID=$(curl -s "http://metadata.google.internal/computeMetadata/v1/project/project-id" -H "Metadata-Flavor: Google")
NAME=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/name" -H "Metadata-Flavor: Google")

# Install dependencies
apt-get update && apt-get upgrade -y
apt-get install -yq ca-certificates build-essential supervisor curl gnupg2 nano vim net-tools nginx ufw

sudo ufw allow 'Nginx Full'
sudo systemctl status nginx

cd /var/www/html/
gsutil cp -r gs://collaborative-teaching.appspot.com/build ./
mv  -v /var/www/html/build/* /var/www/html/
sudo rm index.nginx-debian.html
sudo rm -rf build/
sudo systemctl restart nginx
sudo systemctl status nginx

gcloud compute --project=${PROJECT_ID} instances add-metadata ${NAME} --metadata startup-status=running,startup-on=$(date +%s) --zone=us-central1-a

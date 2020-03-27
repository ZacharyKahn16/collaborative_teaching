#!/usr/bin/env bash

# Install dependencies
apt-get update && apt-get upgrade -y
apt-get install -yq ca-certificates build-essential supervisor curl gnupg2 nano vim net-tools nginx ufw

sudo ufw allow 'Nginx HTTP'
systemctl status nginx

cd /var/www/html/
gsutil cp -r gs://collaborative-teaching.appspot.com/client ./
mv  -v ~/var/www/html/client/* /var/www/html/
sudo index.nginx-debian.html
sudo systemctl restart nginx


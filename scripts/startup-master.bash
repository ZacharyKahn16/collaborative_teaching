#!/usr/bin/env bash
# Installs all the dependencies required to build a Master
# Copies the code for Master from our file storage
# Builds the code using Node.js
# Starts up a Node.js server and attaches it to the Master process

PROJECT_ID=$(curl -s "http://metadata.google.internal/computeMetadata/v1/project/project-id" -H "Metadata-Flavor: Google")
NAME=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/name" -H "Metadata-Flavor: Google")

# Install dependencies
apt-get update && apt-get upgrade -y
apt-get install -yq ca-certificates build-essential supervisor curl gnupg2 nano vim net-tools
mkdir /opt/nodejs
curl https://nodejs.org/dist/v12.16.1/node-v12.16.1-linux-x64.tar.gz | tar xvzf - -C /opt/nodejs --strip-components=1
ln -s /opt/nodejs/bin/node /usr/bin/node
ln -s /opt/nodejs/bin/npm /usr/bin/npm

# Get Code
gsutil cp -r gs://collaborative-teaching.appspot.com/master /opt

# Install Dependencies
cd /opt/master
npm install
npm run build
cp package.json build/
cp package-lock.json build/
cp -r node_modules/ build/

# Create a nodeapp user. The application will run as this user.
useradd -m -d /home/nodeapp nodeapp
chown -R nodeapp:nodeapp /opt/master

# Configure supervisor to run the node app.
cat >/etc/supervisor/conf.d/node-app.conf << EOF
[program:nodeapp]
directory=/opt/master/build
command=npm start
autostart=true
autorestart=true
user=nodeapp
environment=HOME="/home/nodeapp",USER="nodeapp",NODE_ENV="production",PROJECT_ID=${PROJECT_ID},NAME=${NAME}
stdout_logfile=syslog
stderr_logfile=syslog
EOF

supervisorctl reread
supervisorctl update
# Application should now be running under supervisor

gcloud compute --project=${PROJECT_ID} instances add-metadata ${NAME} --metadata startup-status=running,startup-on=$(date +%s) --zone=us-central1-a

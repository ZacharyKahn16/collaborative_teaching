#!/usr/bin/env bash
apt-get update && apt-get upgrade -y
apt install -y curl

# Add the Cloud SDK distribution URI as a package source
echo "deb http://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
# Import the Google Cloud Platform public key
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
# Update the package list and install the Cloud SDK
apt-get update && apt-get install -y google-cloud-sdk

gcloud compute --project $PROJECT_ID ssh --zone us-central1-a db1
apt-get -y install mongodb
service mongodb stop
mkdir $HOME/db
mongod --dbpath $HOME/db --port 80 --fork --logpath /var/tmp/mongodb
exit



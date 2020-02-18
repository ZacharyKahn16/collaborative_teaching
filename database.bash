#!/usr/bin/env bash
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] http://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
sudo apt-get update && sudo apt-get install google-cloud-sdk

gcloud beta compute --project=collaborative-teaching instances create db1 --zone=us-central1-a --machine-type=n1-standard-1 --subnet=default --network-tier=PREMIUM --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com --scopes=https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/trace.append --tags=http-server --image=ubuntu-1604-xenial-v20200129 --image-project=ubuntu-os-cloud --boot-disk-size=10GB --reservation-affinity=any
gcloud compute --project $PROJECT_ID ssh --zone us-central1-a db1
sudo apt-get update
sudo apt-get install mongodb
sudo service mongodb stop
sudo mkdir $HOME/db
sudo mongod --dbpath $HOME/db --port 80 --fork --logpath /var/tmp/mongodb
exit



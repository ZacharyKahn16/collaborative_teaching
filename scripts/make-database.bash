#!/usr/bin/env bash

apt-get update && apt-get upgrade -y
apt install -y curl gnupg2

echo -e "Add key"
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 6A030B21BA07F4FB
apt-get update
echo "deb http://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -

echo -e "Install GCloud"
apt-get update && apt-get install -y google-cloud-sdk

echo -e "Make Database VM"
gcloud beta compute --project=collaborative-teaching instances create database-1 \
  --zone=us-central1-a --machine-type=f1-micro --subnet=default --network-tier=PREMIUM \
  --metadata=startup-script-url=gs://collaborative-teaching.appspot.com/scripts/database-startup.bash \
  --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com \
  --scopes=https://www.googleapis.com/auth/cloud-platform --tags=database-server \
  --image=ubuntu-minimal-1804-bionic-v20200131 --image-project=ubuntu-os-cloud --boot-disk-size=10GB \
  --boot-disk-type=pd-standard --boot-disk-device-name=database-1 --no-shielded-secure-boot --shielded-vtpm \
  --shielded-integrity-monitoring --reservation-affinity=any


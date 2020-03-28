#!/usr/bin/env bash

# Creates Database 1

gcloud beta compute --project=collaborative-teaching instances create database-1 \
  --zone=us-central1-a --machine-type=n1-standard-2 --subnet=default --network-tier=PREMIUM \
  --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com \
  --scopes=https://www.googleapis.com/auth/cloud-platform --tags=database-server \
  --image=ubuntu-minimal-1804-bionic-v20200317 --image-project=ubuntu-os-cloud --boot-disk-size=10GB \
  --boot-disk-type=pd-standard --boot-disk-device-name=database-1 --no-shielded-secure-boot --shielded-vtpm \
  --shielded-integrity-monitoring --reservation-affinity=any \
  --metadata=startup-script-url=gs://collaborative-teaching.appspot.com/scripts/startup-database.bash,startup-status=initializing,created-on=$(date +%s)


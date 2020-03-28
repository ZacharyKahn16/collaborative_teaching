#!/usr/bin/env bash

## Creates Website

gcloud beta compute --project=collaborative-teaching instances create website \
  --zone=us-central1-a --machine-type=n1-standard-8 --subnet=default --network-tier=PREMIUM \
  --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com \
  --scopes=https://www.googleapis.com/auth/cloud-platform --tags=http-server \
  --image=ubuntu-minimal-1804-bionic-v20200317 --image-project=ubuntu-os-cloud --boot-disk-size=10GB \
  --boot-disk-type=pd-standard --boot-disk-device-name=website --no-shielded-secure-boot --shielded-vtpm \
  --shielded-integrity-monitoring --reservation-affinity=any \
  --metadata=startup-script-url=gs://collaborative-teaching.appspot.com/scripts/startup-website.bash,startup-status=initializing,created-on=$(date +%s)


#!/usr/bin/env bash

## Creates Master 1

gcloud beta compute --project=collaborative-teaching instances create master-1 \
  --zone=us-central1-a --machine-type=g1-small --subnet=default --network-tier=PREMIUM \
  --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com \
  --scopes=https://www.googleapis.com/auth/cloud-platform --tags=http-server \
  --image=ubuntu-minimal-1804-bionic-v20200131 --image-project=ubuntu-os-cloud --boot-disk-size=10GB \
  --boot-disk-type=pd-standard --boot-disk-device-name=master-1 --no-shielded-secure-boot --shielded-vtpm \
  --shielded-integrity-monitoring --reservation-affinity=any --address=35.224.26.195 \
  --metadata=startup-script-url=gs://collaborative-teaching.appspot.com/scripts/startup-master.bash,startup-status=initializing,created-on=$(date +%s)


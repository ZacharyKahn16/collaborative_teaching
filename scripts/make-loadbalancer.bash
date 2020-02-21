#!/usr/bin/env bash

## Creates Load Balancer 1

gcloud beta compute --project=collaborative-teaching instances create loadbalancer-1 \
  --zone=us-central1-a --machine-type=f1-micro --subnet=default --network-tier=PREMIUM \
  --maintenance-policy=MIGRATE --service-account=165250393917-compute@developer.gserviceaccount.com \
  --scopes=https://www.googleapis.com/auth/cloud-platform --tags=http-server \
  --image=ubuntu-minimal-1804-bionic-v20200131 --image-project=ubuntu-os-cloud --boot-disk-size=10GB \
  --boot-disk-type=pd-standard --boot-disk-device-name=loadbalancer-1 --no-shielded-secure-boot --shielded-vtpm \
  --shielded-integrity-monitoring --reservation-affinity=any --address=35.208.223.194 \
  --metadata=startup-script-url=gs://collaborative-teaching.appspot.com/scripts/startup-loadbalancer.bash,startup-status=initializing,created-on=$(date +%s)


#!/usr/bin/env bash

curl -v -XPOST -H "Content-type: application/json" -d '{
  "kind": "compute#instance",
  "name": "db-3",
  "zone": "projects/collaborative-teaching/zones/us-central1-a",
  "machineType": "projects/collaborative-teaching/zones/us-central1-a/machineTypes/n1-standard-1",
  "displayDevice": {
    "enableDisplay": false
  },
  "metadata": {
    "kind": "compute#metadata",
    "items": []
  },
  "tags": {
    "items": [
      "http-server",
      "https-server"
    ]
  },
  "disks": [
    {
      "kind": "compute#attachedDisk",
      "type": "PERSISTENT",
      "boot": true,
      "mode": "READ_WRITE",
      "autoDelete": true,
      "deviceName": "db-3",
      "initializeParams": {
        "sourceImage": "projects/debian-cloud/global/images/debian-9-stretch-v20200210",
        "diskType": "projects/collaborative-teaching/zones/us-central1-a/diskTypes/pd-standard",
        "diskSizeGb": "10"
      },
      "diskEncryptionKey": {}
    }
  ],
  "canIpForward": false,
  "networkInterfaces": [
    {
      "kind": "compute#networkInterface",
      "subnetwork": "projects/collaborative-teaching/regions/us-central1/subnetworks/default",
      "accessConfigs": [
        {
          "kind": "compute#accessConfig",
          "name": "External NAT",
          "type": "ONE_TO_ONE_NAT",
          "networkTier": "PREMIUM"
        }
      ],
      "aliasIpRanges": []
    }
  ],
  "description": "",
  "labels": {},
  "scheduling": {
    "preemptible": false,
    "onHostMaintenance": "MIGRATE",
    "automaticRestart": true,
    "nodeAffinities": []
  },
  "deletionProtection": false,
  "reservationAffinity": {
    "consumeReservationType": "ANY_RESERVATION"
  },
  "serviceAccounts": [
    {
      "email": "165250393917-compute@developer.gserviceaccount.com",
      "scopes": [
        "https://www.googleapis.com/auth/cloud-platform"
      ]
    }
  ]
}' 'https://www.googleapis.com/compute/v1/projects/collaborative-teaching/zones/us-central1-a/instances'




gcloud compute --project $PROJECT_ID ssh --zone us-central1-a db1
apt-get update && apt-get upgrade -y
apt-get -y install mongodb
service mongodb stop
mkdir $HOME/db
mongod --dbpath $HOME/db --port 80 --fork --logpath /var/tmp/mongodb
exit



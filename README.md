# Collaborative Teaching

---

## Downloading dependencies

### Pre-reqs

    1. Getting access to Github Repo
    2. Getting access to Google Cloud Console project
    3. For these email: james.peralta@ucalgary.ca

### Downloading and configuring Gloud CLI

    1. Open a browser and navigate to: https://cloud.google.com/sdk/docs/quickstarts
    2. Choose the quickstart depending on which operating system you are running
    3. Run: gcloud config set project collaborative-teaching
    4. You are now setup to run the bash scripts in the "How to deploy cluster section"

---

## Running application

### How to deploy cluster

    1. Run ./scripts/make-master.bash and it will create the first master. Afterwards this master will create the rest of the cluster.
    2. Run ./scripts/make-website.bash and it will deploy the website.
    3. Open a browser and navigate to: https://console.cloud.google.com/compute
    4. Find the external ip of the virtual machine with "website" as the name
    5. Navigate to: http://<external_ip> -> ex) http://35.184.240.189/
    6. You can now access the complete system

---

## Locations of interesting code

### Retrieving files from workers (TODO: Dan or Garland)

### Retrieving files from FDBs (TODO: James)

### Handling failures/heartbeat mechanism (TODO: Satyaki)

### Creating replicas of data (TODO: James)

### Consistency algorithm (TODO: Zach)

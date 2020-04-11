# Collaborative Teaching

---

## Downloading dependencies

### Downloading and configuring Gloud CLI

    1. Select the download appropriate sdk package from: https://cloud.google.com/sdk/
    2. Untar the sdk package: tar -xvf google-cloud-sdk*
    3. Install the sdk using the following command: ./google-cloud-sdk/install.sh
    4. Follow through the installation instruction and select the required options.
    5. Run gcloud init
    6. Accept the google login option for logging in to your google cloud account.
    7. From the browser login to your google cloud account and grant permissions to access google cloud resources.
    8. At the command prompt, you will be prompted with options for initial configurations which are self explanatory.
    9. Run: gcloud config set project collaborative-teaching
    10. You are now setup to run the bash scripts in the "How to deploy cluster section"

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

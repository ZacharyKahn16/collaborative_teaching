# Collab Learn

---

## Dependencies

### Pre-reqs

```
1. Access to Github Repo
2. Access to our Google Cloud project
3. For these email: james.peralta@ucalgary.ca
```

### Downloading and configuring GCloud CLI

1. Follow the instructions here: [https://cloud.google.com/sdk/docs/quickstarts](https://cloud.google.com/sdk/docs/quickstarts)
2. Choose the quickstart depending on which operating system you are using
3. Run: `gcloud config set project collaborative-teaching` using a terminal
4. You are now setup to run the bash scripts in the _How to deploy cluster section_

## Running application

### How to deploy cluster

```
    1. Run ./scripts/make-master.bash and it will create the first master. Afterwards this master will create the rest of the cluster.
    2. Run ./scripts/make-website.bash and it will deploy the website.
    3. Navigate to: https://console.cloud.google.com/compute
    4. Find the <external_ip> of the virtual machine with "website" as the name
    5. Navigate to: http://<external_ip> (e.g http://35.184.240.189/)
    6. You can now access the complete system
```

---

## Locations of interesting code

### Retrieving files from workers (TODO: Dan or Garland)

The files are retrieved in the [GlobalContext](./client/src/GlobalContext.tsx) (line 164) using sockets.
Then passed down to the children components using React Context.
In files [ContentBank](./client/src/ContentBank.jsx), [CoursePage](./client/src/CoursePage.jsx) and [MyFiles](./client/src/MyFiles.jsx), all files are retrieved then filtered if needed.

### Retrieving files from FDBs, and Client to Worker socket communication

View the code in [app.ts](./worker/src/app.ts)

### Communication with the Google Cloud DNS

View the code in [GCloud.ts](./master/src/GCloud.ts)

### Communication with the Firebase Database (Metadata Cloud Database)

View the code in [Firebase.ts](./master/src/Firebase.ts)

And, in [MCDB.ts](./master/src/MCDB.ts)

### Round Robin Worker selection by the Master Responder

View the code in [WorkerTracker.ts](./master/src/WorkerTracker.ts)

### Handling failures/heartbeat mechanism for Workers and FileDatabases

View the code in [InstanceChecker.ts](./master/src/InstanceChecker.ts)

And, in [GCloud.ts](./master/src/GCloud.ts)

### Creating replicas of data

View the code in the createReplicas() function in [WorkerUtilities.ts](./worker/src/HelperFunctions/WorkerUtilities.ts)

### Consistency and Synchronization algorithm for files stored in the FileDatabases

View the code in [masterCoordinator.js](./master/src/masterCoordinator.js)

# Testing Procedure

The main testing methodologies used were:

1. Integration tests
2. Use of GCP Cloud Logging service

## Integration Tests

The integration tests are used to verify that the MC correctly handles inconsistent files, incorrect number of replicas, inconsistency between the FDBs and MCDB, and that an empty FDB gets populated. The file to perform these tests can be found in [testMasterCoordinator.js](https://github.com/ZacharyKahn16/collaborative_teaching/blob/master/master/test/testMasterCoordinator.js).

To run this:

1. Manually replace the `fdbIps` array to contain the IP addresses that run MongoDb.
2. Uncomment one of the following:

   1. `entireAutoMcTest(fdbIps, mc, mockDataCreater);`
   2. `autoFillEmptyFdbsTest(fdbIps, mc, mockDataCreater);`

3. Run `node testMasterCoordinator.js`

The `entireAutoMcTest(fdbIps, mc, mockDataCreater);` function runs various scenarios the system might face in production, such as:

1. Trying to make updates if there is no data in the system yet.
2. Correct inconsistent replicas.
3. Adding replicas.
4. Deleting replicas.
5. Updating the MCDB.

The `autoFillEmptyFdbsTest(fdbIps, mc, mockDataCreater);` function handles the case when an empty FDBs are in the system and need to be populated. It performs the following checks:

1. Handles the case when there is no data in system (FDBs are empty but nothing to do).
2. Populates empty FDBs and deletes extra files.
3. Reruns to ensure FDBs are all populated.
4. Does nothing if there are no empty FDBs.

**Note**

Make sure you are in the `masters` directory, then:

```
npm run build
cd build/
node testMasterCoordinator.js
```

There is also the option to manually run each of the commands being run by the
integration tests. Please refer to [testMasterCoordinator.js](https://github.com/ZacharyKahn16/collaborative_teaching/blob/master/master/test/testMasterCoordinator.js) for the full list of available tests that can be run.

## GCP Cloud Logging

Testing that all the components work together is a challenging process and for this system this was accomplished by using logs that ran for each of the processes in the system. These logs enable you to see how the system performs when all processes are running and to kill various processes throughout the system and see how the system recovers. To analyze the logs please refer to GCP's [Cloud Logging](https://console.cloud.google.com/logs/viewer).

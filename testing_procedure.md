# Testing Procedure

The main testing methodologies used were:

1. Integration tests
2. Use of GCP Cloud Logging service

## Integration Tests

The integration tests are used to verify that the MC correctly handles inconsistent files, incorrect number of replicas, inconsistency between the FDBs and MCDB, and that an empty FDB gets populated. The file to perform these tests can be found in [testMasterCoordinator.js](https://github.com/ZacharyKahn16/collaborative_teaching/blob/master/master/test/testMasterCoordinator.js).

To run this:

1. Manually replace the fdbIps array to contain the IP addresses that run
   an MongoDb.
2. Uncomment one of the following:

   1. `entireAutoMcTest(fdbIps, mc, mockDataCreater);`
   2. `autoFillEmptyFdbsTest(fdbIps, mc, mockDataCreater);`

3. Run `\$ node testMasterCoordinator.js`

**Note**

Depending on the version of nodejs you have run, you might need to run in the masters/src directory:

```
$ npm run build
$ cd ../build
$ node testMasterCoordinator.js

```

There is also the option to manually run each of the commands being run by the
integration tests. Please refer to [testMasterCoordinator.js](https://github.com/ZacharyKahn16/collaborative_teaching/blob/master/master/test/testMasterCoordinator.js) for the full list of avialble tests that can be run.

## GCP Cloud Logging

Testing that all components work together is a challenging process and for this system was accomplished by using logs that ran for each of the processes in the system. These logs enabled the you to see how the system performs when all processes are running and to kill various processes throughout the system and see how the system recovers. To analyze the logs please refer to GCP's [Cloud Logging](https://cloud.google.com/logging).

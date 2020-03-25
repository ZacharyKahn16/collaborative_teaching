// Test all functionality for the masterCoordinator.

// TODO: Update this to correct directory.
import * as mcdb from '../src/MCDB';
const MasterCoordinator = require('../src/masterCoordinator.js');

const MongoClient = require('mongodb').MongoClient;
// TODO: MAKE A TEST COLLECTION FOR INSERTING FAKE FILES.
// TODO: require this when running on gcp, or leave it out if you want to use
// console.info
// const { LOGGER } = require('../src/Logger');

class CreateMockDataForMC {
  /**
   * @class
   *
   * @param {MasterCoordinator} testMc Instance of MasterCoordinator class.
   **/
  constructor(testMc) {
    // Name of FDB database.
    this.dbName = 'FDB';
    // Name of collection that stores files.
    this.fileCollectionName = 'fileInformation';
    this.testMc = testMc;
  }

  /**
   * Create fake data with only 1 copy of each file.
   *
   * @param {Array} fbdIps List of fdbIps, eg. ['1.1.1.1']
   **/
  insertOneCopyPerFdb(fdbIps) {
    const _this = this;
    const numfdbs = fdbIps.length;
    let insertPromises = [];

    (async () => {
      try {
        for (let i = 0; i < numfdbs; i++) {
          let fdbIp = fdbIps[i];
          insertPromises.push(
            _this.testMc.insertFile(
              i,
              fdbIp,
              `${i}.txt`,
              `Hello world for ${i}`,
              `hash${i}`,
              'txt',
              Date.now(),
              i, // ownerId = fileId here, but not necessary.
            ),
          );
        }
        // Create replicas.
        Promise.all(insertPromises).then(
          (vals) => {
            console.info('SUCCESSFULLY CREATED FAKE DATA');
          },
          (err) => {
            console.error('ERROR WHEN CREATED FAKE DATA.', err);
          },
        );
        return 0;
      } catch (err) {
        console.error(err);
      }
    })();
  }

  /**
   * Create fake data with only too many copies of one file copy of each file.
   *
   * @param {Array} fbdIps List of fdbIps, eg. ['1.1.1.1']
   **/
  insertTooManyCopies(fdbIps) {
    const _this = this;
    const numfdbs = fdbIps.length;
    let insertPromises = [];

    (async () => {
      try {
        let copyId = 99;
        let ts = Date.now();
        for (let i = 0; i < numfdbs; i++) {
          let fdbIp = fdbIps[i];
          insertPromises.push(
            _this.testMc.insertFile(
              copyId,
              fdbIp,
              `${copyId}.txt`,
              `Hello world for ${copyId}`,
              `hash${copyId}`,
              'txt',
              ts,
              copyId,
            ),
          );
        }
        // Create replicas.
        Promise.all(insertPromises).then(
          (vals) => {
            console.info('SUCCESSFULLY CREATED FAKE DATA');
          },
          (err) => {
            console.error('ERROR WHEN CREATED FAKE DATA.', err);
          },
        );
        return 0;
      } catch (err) {
        console.error(err);
      }
    })();
  }

  /**
   * Create fake data with deliberate inconsistent copies.
   *
   * @param {Array} fbdIps List of fdbIps, eg. ['1.1.1.1']
   **/
  createInconsistentCopies(fdbIps) {
    const _this = this;
    const numfdbs = fdbIps.length;
    let insertPromises = [];

    (async () => {
      try {
        let copyId = 50;
        let ts = Date.now();
        let ts_correct = ts + 3600;
        for (let i = 0; i < numfdbs; i++) {
          // Make the last one inserted the correct one.
          if (i == numfdbs - 1) {
            ts = ts_correct;
          }
          let fdbIp = fdbIps[i];
          insertPromises.push(
            _this.testMc.insertFile(
              copyId,
              fdbIp,
              `${copyId}.txt`,
              `Hello world for ${copyId} v${i}`,
              `hash${copyId}${i}`,
              'txt',
              ts,
              copyId,
            ),
          );
        }
        // Create replicas.
        Promise.all(insertPromises).then(
          (vals) => {
            console.info('SUCCESSFULLY MADE INCONSITENT FAKE DATA');
          },
          (err) => {
            console.error('ERROR WHEN CREATED INCONSISTENT FAKE DATA.', err);
          },
        );
        return 0;
      } catch (err) {
        console.error(err);
      }
    })();
  }

  /**
   * Retrieve all data from all fdbs.
   *
   * @param {Array} fbdIps List of fdbIps, eg. ['1.1.1.1']
   *
   * @returns {Promise} data All data.
   **/
  retrieveAllData(fdbIps) {
    const _this = this;
    const numfdbs = fdbIps.length;
    let retrievePromises = [];

    return (async () => {
      try {
        for (let i = 0; i < numfdbs; i++) {
          let fdbIp = fdbIps[i];
          retrievePromises.push(_this.testMc.getFDBInfo(fdbIp));
        }
        // Create replicas.
        return Promise.all(retrievePromises).then(
          (vals) => {
            console.info('SUCCESSFULLY RETRIEVED FAKE DATA');
            return vals;
          },
          (err) => {
            console.error('ERROR WHEN RETRIEVING FAKE DATA.', err);
          },
        );
      } catch (err) {
        consocle.error(err);
      }
    })();
  }

  /**
   * Clear contents of an FDB.
   *
   * @param {Integer} docId ID of document.
   * @param {Integer} fdbIP IP of fdb with file to delete.
   *
   * @return {Promise} Promise that returns documents on success, error otherwise.
   **/
  clearFdb(fdbIp) {
    const url = `mongodb://${fdbIp}:80`;
    const _dbName = this.dbName;
    const _fileCollectionName = this.fileCollectionName;
    let _db;
    return MongoClient.connect(url)
      .then(
        function(db) {
          _db = db;
          const dbo = db.db(_dbName);
          return dbo.collection(_fileCollectionName);
        },
        function(err) {
          console.info('ERROR CONNECTING TO DB');
          throw err;
        },
      )
      .then(
        function(collection) {
          return collection.drop();
        },
        function(err) {
          console.info('ERROR DELETING DATA FROM DB');
          throw err;
        },
      )
      .then(function(items) {
        return items;
      })
      .catch(function(err) {
        console.info('ERROR: Something went wrong with deletion.');
        console.info(err);
        throw err;
      })
      .finally(function() {
        _db.close();
      });
  }

  /**
   * Delete data from all FBDs.
   *
   * @param {Array} fbdIps List of fdbIps, eg. ['1.1.1.1']
   **/
  deleteAllData(fdbIps) {
    const _this = this;
    const numfdbs = fdbIps.length;
    let deletePromises = [];

    (async () => {
      try {
        for (let i = 0; i < numfdbs; i++) {
          let fdbIp = fdbIps[i];
          deletePromises.push(_this.clearFdb(fdbIp));
        }
        // Create replicas.
        Promise.all(deletePromises).then(
          (vals) => {
            console.info('SUCCESSFULLY DELETED FAKE DATA');
            // console.info(vals);
          },
          (err) => {
            console.error('ERROR WHEN DELETING FAKE DATA.', err);
          },
        );
        return 0;
      } catch (err) {
        console.error(err);
      }
    })();
  }

  insertFakeInconsistentMcdbData() {
    // Insert some entries that the FDBs have.
    (async () => {
      try {
        let mcdbPromises = [];
        // Since we have 4 IPs, by defualt we have ids 0-3 in FDBs, so we'll
        // include 0,1 in MCDB.
        for (let i = 0; i < 2; i++) {
          mcdbPromises.push(
            mcdb.insertFileWithSpecifiedFileId(
              i,
              Date.now(),
              [], // defualt to no fdbs.
              [],
              [],
              `${i}.txt`,
              'some incorrect hash',
              i,
            ),
          );
        }
        // Insert some entries into MCDB that will not be in MCDB, namely for this
        // example, have fileIds > 3.
        for (let i = 8; i < 10; i++) {
          mcdbPromises.push(
            mcdb.insertFileWithSpecifiedFileId(
              i,
              Date.now(),
              [], // defualt to no fdbs.
              [],
              [],
              `${i}.txt`,
              'some nonexistent file hash',
              i,
            ),
          );
        }

        // Insert MCDB data.
        Promise.all(mcdbPromises).then(
          (vals) => {
            console.info('SUCCESSFULLY INSERTED FAKE MCDB DATA');
          },
          (err) => {
            console.error('ERROR WHEN INSERTING FAKE MCDB DATA.', err);
          },
        );
        return 0;
      } catch (err) {
        console.error(err);
      }
    })();
  }
}

// let myArgs = process.argv.slice(2);
// const fdbIps = myArgs[0];
// Manually copy past in from gcloud console.
const fdbIps = ['35.193.171.27', '35.222.45.75', '35.223.205.69', '104.198.215.78'];
let mc = new MasterCoordinator();
let mockDataCreater = new CreateMockDataForMC(mc);
// TODO: Could put tests below into a script instead of just running each
// individually.

// Insert single copy of each file mock data
// mockDataCreater.insertOneCopyPerFdb(fdbIps);

// Insert too many copies of one file
// mockDataCreater.insertTooManyCopies(fdbIps);

// Insert inconsistent data
// mockDataCreater.createInconsistentCopies(fdbIps);

// Insert fake, inconsistent data into MCDB.
// mockDataCreater.insertFakeInconsistentMcdbData();

// Retrieve fake data.
// mockDataCreater.retrieveAllData(fdbIps).then(
//   function(items) {
//     console.info("The promise was fulfilled with items!", items);
//   },
//   function(err) {
//     console.error(
//       "*******\nTHE PROMISE WAS REJECTED\n*******\n",
//       err,
//       err.stack
//     );
//   }
// );

// Delete fake data.
// mockDataCreater.deleteAllData(fdbIps);

// *** Tests for MC *** //

// Retrieve File --> Tested with retrieve fake data.
// Insert File --> Tested with insertOne and TooMany file functions.
// getFDBInfo --> Tested with retrieveAllData.

// Test organizeByDocId
// mc.organizeByDocId(fdbIps[0]).then(
//   function(items) {
//     console.info("The promise was fulfilled with items!", items);
//   },
//   function(err) {
//     console.error(
//       "*******\nTHE PROMISE WAS REJECTED\n*******\n",
//       err,
//       err.stack
//     );
//   }
// );

// Test getAllFDBsOrganizedByDocId
// mc.getAllFDBsOrganizedByDocId(fdbIps).then(
//   function(items) {
//     console.info("The promise was fulfilled with items!", items);
//   },
//   function(err) {
//     console.error(
//       "*******\nTHE PROMISE WAS REJECTED\n*******\n",
//       err,
//       err.stack
//     );
//   }
// );

// Test getCorrectFileInfo
// mc.getCorrectFileInfo(fdbIps).then(
//   function(items) {
//     console.info("The promise was fulfilled with items!", items);
//   },
//   function(err) {
//     console.error(
//       "*******\nTHE PROMISE WAS REJECTED\n*******\n",
//       err,
//       err.stack
//     );
//   }
// );

// Test getUpdatesForEachFile
// mc.getUpdatesForEachFile(fdbIps).then(
//   function(items) {
//     console.info("The promise was fulfilled with items!", items);
//   },
//   function(err) {
//     console.error(
//       "*******\nTHE PROMISE WAS REJECTED\n*******\n",
//       err,
//       err.stack
//     );
//   }
// );

// Test makeAllFileCopiesConsistent
// mc.makeAllFileCopiesConsistent(fdbIps).then(
//   function(items) {
//     console.info("The promise was fulfilled with items!", items);
//   },
//   function(err) {
//     console.error(
//       "*******\nTHE PROMISE WAS REJECTED\n*******\n",
//       err,
//       err.stack
//     );
//   }
// );

// Test getReplicaUpdateInfo
// mc.getReplicaUpdateInfo(fdbIps).then(
//   function(items) {
//     console.info("The promise was fulfilled with items!", items);
//   },
//   function(err) {
//     console.error(
//       "*******\nTHE PROMISE WAS REJECTED\n*******\n",
//       err,
//       err.stack
//     );
//   }
// );

// Test makeCorrectNumberOfReplicas
// Deletion works.
// Addition works.
// mc.makeCorrectNumberOfReplicas(fdbIps).then(
//   function(items) {
//     console.info('The promise was fulfilled with items!', items);
//   },
//   function(err) {
//     console.error('*******\nTHE PROMISE WAS REJECTED\n*******\n', err, err.stack);
//   },
// );

// Test updateMCDBWithCorrectFDBInfo
// This should make MCDB match what is presented in the FDBs.
// mc.updateMCDBWithCorrectFDBInfo(fdbIps).then(
//   function(items) {
//     console.info('The promise was fulfilled with items!', items);
//   },
//   function(err) {
//     console.error('*******\nTHE PROMISE WAS REJECTED\n*******\n', err, err.stack);
//   },
// );

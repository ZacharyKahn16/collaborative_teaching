/**
 * Classes for master coordinator.
 **/

const MongoClient = require('mongodb').MongoClient;
const Promise = require('promise');
// TODO: Import GCloud class for getting list of all instances.

class MasterCoordinator {
  /**
   * @class
   **/
  constructor() {
    // Name of FDB database.
    this.dbName = 'FDB';
    // Name of collection that stores files.
    this.fileCollectionName = 'fileInformation';
  }

  // TODO: Use Gcloud class to get list of instances.
  getInstances() {}
  getFDBInstances() {}

  /**
   * Retrieve file with given document id from an FDB.
   *
   * @param {Integer} docId ID of document.
   * @param {Integer} FDBIp IP of FDB node.
   *
   * @return {Promise} Promise that returns document on success, error otherwise.
   **/
  retrieveFile(docId, fdbIp) {
    const _dbName = this.dbName;
    const _fileCollectionName = this.fileCollectionName;

    // Generate query for retrieve documents.
    const query = { docId: docId };
    let _db;

    // TODO(zacharykahn): Update this to use FdbIp
    const url = 'mongodb://localhost:27017/';
    return MongoClient.connect(url)
      .then(
        function(db) {
          _db = db;
          const dbo = db.db(_dbName);
          return dbo.collection(_fileCollectionName);
        },
        function(err) {
          console.log('ERROR CONNECTING TO DB');
          throw err;
        },
      )
      .then(
        function(collection) {
          return collection.findOne(query);
        },
        function(err) {
          console.log('ERROR RETRIEVING DATA FROM DB');
          throw err;
        },
      )
      .then(function(items) {
        return items;
      })
      .catch(function(err) {
        console.log('ERROR: Something went wrong with retrieval.');
        console.log(err);
        throw err;
      })
      .finally(function() {
        _db.close();
      });
  }

  /**
   * Updates a file.
   *
   * @param {Integer}  docId _id of document.
   * @param {Integer} FDBIp IP of FDB node.
   * @param {String} fileName name of file.
   * @param {Binary} fileContents File contents.
   * @param {String} fileType Type of file.
   * @param {Integer} ts Timestamp.
   *
   * @return {Promise} Promise that returns if insertion was a success, error otherwise.
   **/
  updateFile(docId, fdbIp, fileName, fileContents, fileType, ts) {
    const _dbName = this.dbName;
    const _fileCollectionName = this.fileCollectionName;
    const query = { docId: docId };
    const updateInfo = {
      fileName: fileName,
      fileContents: fileContents,
      fileType: fileType,
      fileCreationTime: ts,
    };
    // TODO(zacharykahn): Update this to use FdbIp
    const url = 'mongodb://localhost:27017/';
    let _db;
    return MongoClient.connect(url)
      .then(
        function(db) {
          _db = db;
          const dbo = db.db(_dbName);
          return dbo.collection(_fileCollectionName);
        },
        function(err) {
          console.log('ERROR CONNECTING TO DB');
          throw err;
        },
      )
      .then(
        function(collection) {
          const newUpdate = { $set: updateInfo };
          return collection.updateOne(query, newUpdate, { upsert: true });
        },
        function(err) {
          console.log('ERROR UPDATING DOCUMENT.');
          throw err;
        },
      )
      .then(function(resp) {
        return resp;
      })
      .catch(function(err) {
        console.log('ERROR: Something went wrong with update.');
        console.log(err);
        throw err;
      })
      .finally(function() {
        _db.close();
      });
  }

  /**
   * Grabs hash, file name, and file timestamp for each file in an FDB.
   *
   * @param {Integer} FDBIp IP of FDB node.
   *
   * @return {Promise} Promise that returns all contents of queried FDB on success, error otherwise.
   **/
  getFDBInfo(FDBIP) {
    // TODO: use FDBIP to connect to FDB. For now, use localhost.
    const url = 'mongodb://localhost:27017/';

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
          console.log('ERROR CONNECTING TO DB');
          throw err;
        },
      )
      .then(
        function(collection) {
          // Only need to return the docId, fileName, fileHash, and
          // fileCreationTime for each FDB.
          return collection
            .find()
            .project({
              docId: 1,
              fileName: 1,
              fileHash: 1,
              fileCreationTime: 1,
            })
            .toArray();
        },
        function(err) {
          console.log('ERROR RETRIEVING DATA FROM DB');
          throw err;
        },
      )
      .then(function(items) {
        return items;
      })
      .catch(function(err) {
        console.log('ERROR: Something went wrong with retrieval.');
        console.log(err);
        throw err;
      })
      .finally(function() {
        _db.close();
      });
  }

  /**
   * Organize queried file by docId.
   *
   * For each FDB in network, query them and store the resulting information
   * to use for updating out of sync files.
   * Data structure has following format:
   * organizedDocData = { docId : [[fdbIp, fileHash, fileCreationTime]] }
   *
   * @return {Promise} Promise contains organizedDocData, which contains array
   *                   of FDBs that have a given file and the hash they contain
   *                   for each file.
   **/
  organizeByDocId() {
    // Go through each FDB in network, call getFDBInfo and then store the info.
    let organizedDocData = {};
    let _id, docId, fileName, fileHash, fileCreationTime;

    // TODO: Loop through all fdbs. FDBIP would be different for each node, but for now fix
    let fdbIp = 1001;
    // TODO: Loop through all fbds. For now only call this once, don't loop through.
    return this.getFDBInfo(123).then(
      function(items) {
        for (let i = 0; i < items.length; i++) {
          console.log(items[i]);

          docId = items[i].docId;
          fileName = items[i].fileName;
          fileHash = items[i].fileHash;
          fileCreationTime = items[i].fileCreationTime;

          if (docId in organizedDocData) {
            organizedDocData[docId].push([fdbIp, fileHash, fileCreationTime]);
          } else {
            organizedDocData[docId] = [[fdbIp, fileHash, fileCreationTime]];
          }
        }

        return organizedDocData;
      },
      function(err) {
        console.log('Error: could not grab data for FDB.');
        throw err;
      },
    );
  }

  /**
   * Get correct, up-to-date file.
   *
   * Looks through files contained at each worker, checks if there are any
   * discrepancies and gets the correct file (file with latest timestamp)
   * for each file queried.
   *
   * Data structures returned:
   * organizedDocData = { docId : [[fdbIp, fileHash, fileCreationTime]] }
   * updateInfoPerFile = {docId: [fdbIpWithCorrectFile, corretHash, latestTs]}
   *
   * @returns {Promise} Promise contains organizedDocData and updateInfoPerFile
   *                    objects.
   *
   **/
  getCorrectFileInfo() {
    // organizedDocData structure: {docId: [[fdbIp, hash, ts]]}
    return this.organizeByDocId().then(
      function(organizedDocData) {
        let updateInfoPerFile = {};
        // Go through each docId.
        for (let fileId in organizedDocData) {
          const allDataForFile = organizedDocData[fileId];

          // Grab the latest timestamp.
          let latestTs = 0;
          let correctFileInfo;

          for (let i = 0; i < allDataForFile.length; i++) {
            let curTs = allDataForFile[i][2];
            let curInfo = allDataForFile[i];
            if (curTs > latestTs) {
              latestTs = curTs;
              correctFileInfo = curInfo;
            }
          }
          updateInfoPerFile[fileId] = correctFileInfo;
        }
        return {
          organizedDocData: organizedDocData,
          updateInfoPerFile: updateInfoPerFile,
        };
      },
      function(err) {
        console.error(err);
        throw err;
      },
    );
  }

  /**
   * Creates update list.
   *
   * Goes through all files and returns list of files that need to be updated.
   * updateList structure: {docId: [outOfDateFdbIp ...]}
   *
   * @returns {Promise} Promise contains updateInfoPerFile and updateList objects.
   **/
  getUpdatesForEachFile() {
    return this.getCorrectFileInfo().then(
      function({ organizedDocData, updateInfoPerFile }) {
        // organizedDocData structure: {docId: [[fdbIp, hash, ts]]}
        // updateInfoPerFile structure: {docId: [fdbIpWithCorrectFile, corretHash, latestTs]}
        let updateList = {};
        // Go through each docId and add hashes that don't match correctHash to
        // update list.
        let correctHash;
        let fdbIpWithCorrectFile;
        let correcTs;

        for (let docId in organizedDocData) {
          fdbIpWithCorrectFile = updateInfoPerFile[docId][0];
          correctHash = updateInfoPerFile[docId][1];

          for (let i = 0; i < organizedDocData[docId].length; i++) {
            let curFdbIp = organizedDocData[docId][i][0];
            let curHash = organizedDocData[docId][i][1];

            // Hashes don't match, we have an incosistency, so add this out of
            // date file to update list.
            if (curHash !== correctHash) {
              if (fileId in updateList) {
                updateList[docId].push(curFdbIp);
              } else {
                updateList[docId] = [curFdbIp];
              }
            }
          }
        }

        return { updateInfoPerFile: updateInfoPerFile, updateList: updateList };
      },
      function(err) {
        console.error(err);
        throw err;
      },
    );
  }

  /**
   * Make all files consistent.
   *
   * Main workhorse of making all files consistent. Queries all FBDs, sees
   * which file are out of sync, and updates any of of sync files.
   *
   * @returns {Promise} Promise returns 1 if no changes made 0 if changes
   *                    successfully made.
   **/
  makeAllFileCopiesConsistent() {
    // updateInfoPerFile structure: {docId: [fdbIpWithCorrectFile, corretHash, latestTs]}
    let _updateInfoPerFile;
    // updateList structure: {docId: [outOfDateFdbIp ...]}
    let _updateList;

    let _this = this;

    return this.getUpdatesForEachFile()
      .then(function({ updateInfoPerFile, updateList }) {
        // If updateList is empty, all files are consistent.
        if (Object.entries(updateList).length === 0 && updateList.constructor === Object) {
          console.log('All files consistent already.');
          // TODO: uncomment this.
          return 0;
        }
        console.log('Files are inconsistent, fixing this now.');

        _updateInfoPerFile = updateInfoPerFile;
        _updateList = updateList;
        return 1;
      })
      .then(
        function(status) {
          console.log('STATUS: ' + status);
          if (status === 0) {
            return 0;
          }
          // Need to update inconsistencies.
          // Go through each file and make updates to out of date FDBs
          // TODO: Remove below line. Mock _updateList for now
          _updateList = { 123: [1, 2, 3], 124: [4, 5, 6] };
          console.log('UPDATE LIST');
          console.log(_updateInfoPerFile);

          // Loop through each docId in _updateList and for each docId
          // retrieve the correct update date file and
          // for each outOfDateFdbIp in _updateList[docId]
          // make the update.
          (async () => {
            try {
              for (let docId in _updateList) {
                // Get fdbIp with correct file.
                let fdbIpCorrect = _updateInfoPerFile[docId][0];

                // Grab correct data for file.
                let docIdInt = parseInt(docId);
                let retData = await _this.retrieveFile(docIdInt, 12321);
                let correctFileName = retData.fileName;
                let correctFileContents = retData.fileContents;
                let correctFileType = retData.fileType;
                let lastestTs = retData.fileCreationTime;
                let updatePromises = [];

                // Write this data to all files.
                for (let j = 0; j < _updateList[docId].length; j++) {
                  let updateFdbIp = _updateList[docId][j];
                  // Make update.
                  updatePromises.push(
                    _this.updateFile(
                      docIdInt,
                      updateFdbIp,
                      correctFileName,
                      correctFileContents,
                      correctFileType,
                      lastestTs,
                    ),
                  );
                }

                // Update all out of sync files.
                Promise.all(updatePromises).then(
                  (vals) => {
                    console.log(
                      'SUCCESSFULLY UPDATED ALL INCONSITENT COPIES FOR DOC ' + docId + '.',
                    );
                  },
                  (err) => {
                    console.error('ERROR WHEN UPDATING INCOSISTENT FILES.');
                    console.error(err);
                  },
                );
              }
            } catch (err) {
              console.error(err);
            }
          })();

          return 0;
        },
        function(err) {
          console.error(err);
          throw err;
        },
      );
  }
}

// DUMMY CODE
// // Retrieve a file.
let master = new MasterCoordinator();
// master.getFDBInfo(123).then(
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
// master.organizeByDocId().then(
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

// master.getCorrectFileInfo().then(
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

// master.getUpdatesForEachFile().then(
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

master.makeAllFileCopiesConsistent().then(
  function(items) {
    console.info('The promise was fulfilled with items!', items);
  },
  function(err) {
    console.error('*******\nTHE PROMISE WAS REJECTED\n*******\n', err, err.stack);
  },
);

// master.retrieveFile(123, 1223).then(
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

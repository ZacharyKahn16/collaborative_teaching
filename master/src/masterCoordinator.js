/**
 * Classes for master coordinator.
 **/

const MongoClient = require('mongodb').MongoClient;
// TODO: Uncomment.
// const { Logger } = require("./Logger");

// TODO: Make sure to put note that fbdIps must be passed in.
// TODO: Using LOGGER.info changer to Logger.

module.exports = class MasterCoordinator {
  /**
   * @class
   **/
  constructor() {
    // Name of FDB database.
    this.dbName = 'FDB';
    // Name of collection that stores files.
    this.fileCollectionName = 'fileInformation';
  }

  /**
   * Retrieve file with given document id from an FDB.
   *
   * @param {Integer} docId ID of document.
   * @param {String} FDBIp IP of FDB node.
   *
   * @return {Promise} Promise that returns document on success, error otherwise.
   **/
  retrieveFile(docId, fdbIp) {
    const _dbName = this.dbName;
    const _fileCollectionName = this.fileCollectionName;

    // Generate query for retrieve documents.
    const query = { docId: docId };
    let _db;

    const url = `mongodb://${fdbIp}:80`;
    return MongoClient.connect(url)
      .then(
        function(db) {
          _db = db;
          const dbo = db.db(_dbName);
          return dbo.collection(_fileCollectionName);
        },
        function(err) {
          LOGGER.error('ERROR CONNECTING TO DB', err);
          throw err;
        },
      )
      .then(
        function(collection) {
          return collection.findOne(query);
        },
        function(err) {
          LOGGER.error('ERROR RETRIEVING DATA FROM DB', err);
          throw err;
        },
      )
      .then(function(items) {
        return items;
      })
      .catch(function(err) {
        LOGGER.error('Something went wrong with retrieval.', err);
        throw err;
      })
      .finally(function() {
        _db.close();
      });
  }

  /**
   * Insert new file.
   *
   * @param {Integer}  docId ID of document.
   * @param {String} fdbIp IP of FDB.
   * @param {String} fileName name of file.
   * @param {String} fileContents TODO (zacharykahn): Do we want to store file in binary?
   * @param {String} fileHash Hash of the file.
   * @param {String} fileType Type of file.
   * @param {Integer} ts Timestamp.
   *
   * @return {Promise} Promise that returns if insertion was a success, error otherwise.
   **/
  insertFile(docId, fdbIp, fileName, fileContents, fileHash, fileType, ts) {
    const _dbName = this.dbName;
    const _fileCollectionName = this.fileCollectionName;
    const url = `mongodb://${fdbIp}:80`;
    const fDBInsertInfo = {
      docId: docId,
      fileName: fileName,
      fileContents: fileContents,
      fileHash: fileHash,
      fileType: fileType,
      fileCreationTime: ts,
    };

    let _db;
    return MongoClient.connect(url)
      .then(
        function(db) {
          _db = db;
          const dbo = db.db(_dbName);
          return dbo.collection(_fileCollectionName);
        },
        function(err) {
          LOGGER.info('ERROR CONNECTING TO DB');
          throw err;
        },
      )
      .then(
        function(collection) {
          return collection.insertOne(fDBInsertInfo);
        },
        function(err) {
          LOGGER.info('ERROR INSERTING INTO DB');
          throw err;
        },
      )
      .then(function(resp) {
        return resp;
      })
      .catch(function(err) {
        LOGGER.info('ERROR: Something went wrong with insertion.');
        LOGGER.info(err);
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
   * @param {String} FDBIp IP of FDB node.
   * @param {String} fileName name of file.
   * @param {Binary} fileContents File contents.
   * @param {String} fileType Type of file.
   * @param {Integer} ts Timestamp.
   *
   * @return {Promise} Promise that returns if insertion was a success, error otherwise.
   **/
  updateFile(docId, fdbIp, fileName, fileContents, fileHash, fileType, ts) {
    const _dbName = this.dbName;
    const _fileCollectionName = this.fileCollectionName;
    const query = { docId: docId };
    const updateInfo = {
      fileName: fileName,
      fileContents: fileContents,
      fileHash: fileHash,
      fileType: fileType,
      fileCreationTime: ts,
    };

    const url = `mongodb://${fdbIp}:80`;
    let _db;
    return MongoClient.connect(url)
      .then(
        function(db) {
          _db = db;
          const dbo = db.db(_dbName);
          return dbo.collection(_fileCollectionName);
        },
        function(err) {
          LOGGER.error('ERROR CONNECTING TO DB', err);
          throw err;
        },
      )
      .then(
        function(collection) {
          const newUpdate = { $set: updateInfo };
          return collection.updateOne(query, newUpdate, { upsert: true });
        },
        function(err) {
          LOGGER.error('ERROR UPDATING DOCUMENT.', err);
          throw err;
        },
      )
      .then(function(resp) {
        return resp;
      })
      .catch(function(err) {
        LOGGER.error('ERROR: Something went wrong with update.', err);
        throw err;
      })
      .finally(function() {
        _db.close();
      });
  }

  /**
   * Delete file with given document id.
   *
   * @param {Integer} docId ID of document.
   * @param {Integer} fdbIP IP of fdb with file to delete.
   *
   * @return {Promise} Promise that returns documents on success, error otherwise.
   **/
  deleteFile(docId, fdbIp) {
    // TODO: use FDBIP to connect to FDB. For now, use localhost.
    // const url = "mongodb://localhost:27017/";
    const url = `mongodb://${fdbIp}:80`;
    const _dbName = this.dbName;
    const _fileCollectionName = this.fileCollectionName;
    // Generate query for delete documents (same as retrieve).
    const query = { docId: docId };
    let _db;
    return MongoClient.connect(url)
      .then(
        function(db) {
          _db = db;
          const dbo = db.db(_dbName);
          return dbo.collection(_fileCollectionName);
        },
        function(err) {
          LOGGER.info('ERROR CONNECTING TO DB');
          throw err;
        },
      )
      .then(
        function(collection) {
          return collection.deleteOne(query);
        },
        function(err) {
          LOGGER.info('ERROR DELETING DATA FROM DB');
          throw err;
        },
      )
      .then(function(items) {
        return items;
      })
      .catch(function(err) {
        LOGGER.info('ERROR: Something went wrong with deletion.');
        LOGGER.info(err);
        throw err;
      })
      .finally(function() {
        _db.close();
      });
  }

  /**
   * Grabs hash, file name, and file timestamp for each file in an FDB.
   *
   * @param {String} FDBIp IP of FDB node.
   *
   * @return {Promise} Promise that returns all contents of queried FDB on success, error otherwise.
   **/
  getFDBInfo(fdbIp) {
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
          LOGGER.error('ERROR CONNECTING TO DB', err);
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
          LOGGER.error('ERROR RETRIEVING DATA FROM DB', err);
          throw err;
        },
      )
      .then(function(items) {
        return items;
      })
      .catch(function(err) {
        LOGGER.error('ERROR: Something went wrong with retrieval.', err);
        throw err;
      })
      .finally(function() {
        _db.close();
      });
  }

  /**
   * Organize queried file by docId.
   *
   * For an FDB in network, query ot and store the resulting information
   * to use for updating out of sync files.
   * Data structure has following format:
   * organizedDocData = { docId : [[fdbIp, fileHash, fileCreationTime]] }
   *
   * @param {String} FDBIp IP of FDB node.
   *
   * @return {Promise} Promise contains organizedDocData, which contains array
   *                   of FDBs that have a given file and the hash they contain
   *                   for each file.
   **/
  organizeByDocId(fdbIp) {
    // Go through each FDB in network, call getFDBInfo and then store the info.
    let organizedDocData = {};
    let _id, docId, fileName, fileHash, fileCreationTime;

    return this.getFDBInfo(fdbIp).then(
      function(items) {
        for (let i = 0; i < items.length; i++) {
          LOGGER.info(items[i]);

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
        LOGGER.error('Error: could not grab data for FDB.', err);
        throw err;
      },
    );
  }

  /**
   * Organize queried file by docId.
   *
   * For each FDB in network, query them and store the resulting information
   * to use for updating out of sync files.
   * Data structure has following format:
   * organizedDocData = { docId : [[fdbIp, fileHash, fileCreationTime]] }
   *
   * @param {Array} fbdIps List of fdbIps, eg. ['1.1.1.1']
   *
   * @return {Promise} Promise contains organizedDocData, which contains array
   *                   of FDBs that have a given file and the hash they contain
   *                   for each file.
   **/
  getAllFDBsOrganizedByDocId(fdbIps) {
    const _this = this;
    const numfdbs = fdbIps.length;
    let retrievePromises = [];

    return (async () => {
      try {
        for (let i = 0; i < numfdbs; i++) {
          let fdbIp = fdbIps[i];
          // Get organized data for from each FDB.
          retrievePromises.push(_this.organizeByDocId(fdbIp));
        }
        // Get organized data for all FDBs.
        return Promise.all(retrievePromises).then(
          (vals) => {
            LOGGER.info('SUCCESSFULLY RETRIEVED ALL DATA FROM EACH FDB.');

            // Merge results from all FDBs.
            // Example of objects to merge.
            // [{0: [info0a...], 1:[info1a...]},
            //  {0: [info0b...], 2:[info2b...]}]
            // => Merge into:
            // {0: [info0a..., info0b...], 1:[info1a...], 2:[info2b...]}
            let allData = {};
            for (let i = 0; i < vals.length; i++) {
              let fdbData = vals[i];

              for (const key in fdbData) {
                if (key in allData) {
                  allData[key] = allData[key].concat(fdbData[key]);
                } else {
                  allData[key] = fdbData[key];
                }
              }
            }
            return allData;
          },
          (err) => {
            LOGGER.error('ERROR WHEN RETRIEVING DATA.', err);
          },
        );
      } catch (err) {
        LOGGER.error(err);
      }
    })();
  }

  /**
   * Get replication info.
   *
   * Determines how many replicas need to be made, or files need to be deleleted
   * to ensure system has correct number of copies.
   * Data structure
   * replicaUpdateInfo: { 'docIda': x, 'docIdb': -y}
   * Indicates docId needs x additional copies and docIdb needs y copies deleted.
   *
   * @param {Array} fbdIps List of fdbIps, eg. ['1.1.1.1']
   *
   * @returns {Promise} Promise with organizedDocData and replicaUpdateInfo.
   **/
  getReplicaUpdateInfo(fdbIps) {
    return this.getAllFDBsOrganizedByDocId(fdbIps).then(
      function(organizedDocData) {
        // Number of replicas dynamically to n/3 + 1.
        let replicaUpdateInfo = {};
        const desiredReplicas = Math.floor(fdbIps.length / 3) + 1;
        LOGGER.info('GET REPLICA UPDATE INFO');
        for (let fileId in organizedDocData) {
          // Positive difference indicates how many replicas need to be added
          // for a given docId. Negative difference tells us how many replicas
          // need to be removed.
          replicaUpdateInfo[fileId] = desiredReplicas - organizedDocData[fileId].length;
        }
        return {
          organizedDocData: organizedDocData,
          replicaUpdateInfo: replicaUpdateInfo,
        };
      },
      function(err) {
        LOGGER.error(err);
        throw err;
      },
    );
  }

  /**
   * Workhorse that makes the system have the correct number of replicas.
   *
   * Determines how many replicas need to be made, or files need to be deleleted
   * to ensure system has correct number of copies, and then makes updates and
   * deletions.
   *
   * @param {Array} fbdIpList List of fdbIps, eg. ['1.1.1.1']
   *
   * @returns {Promise} Promise indicating all updates made successfully, error otherwise.
   **/
  makeCorrectNumberOfReplicas(fdbIpList) {
    const _this = this;
    return this.getReplicaUpdateInfo(fdbIpList).then(
      function({ organizedDocData, replicaUpdateInfo }) {
        for (let fileId in organizedDocData) {
          let rep = replicaUpdateInfo[fileId];
          // Make following object: {docId : [fdbIp]}
          const fdbsForFile = organizedDocData[fileId].map((ele) => ele[0]);

          if (rep > 0) {
            LOGGER.info('MAKE ' + rep + ' more replicas');
            // Choose rep fdbIPs that don't already have the given fileId.
            // Only add file to FDBs that don't already have the file.
            const newFdbChoices = fdbIpList.filter((ele) => !fdbsForFile.includes(ele));

            LOGGER.info('REPLICAS TO CHOOSE');
            LOGGER.info(newFdbChoices);

            // Get list of FDBs to add fileId to.
            const replicationList = _this._getRandomFDBs(newFdbChoices, rep);
            LOGGER.info('FileID: ' + fileId);
            LOGGER.info('Replication list: ');
            LOGGER.info(replicationList);

            // Retrieve correct replica and copy to other FDBs.
            (async () => {
              try {
                const resp = await _this._retrieveAndInsert(fileId, fdbsForFile, replicationList);
                LOGGER.info('RESPONSE FROM NEW FUNC: ' + resp);
              } catch (err) {
                LOGGER.error(err);
              }
            })();
          } else if (rep < 0) {
            LOGGER.info('REMOVE ' + -1 * rep + ' replicas');

            const deletions = -1 * rep;
            // Get list of FDBs to delete fileId from.
            const deletionList = _this._getRandomFDBs(fdbsForFile, deletions);
            LOGGER.info('DELETEION LIST');
            LOGGER.info(deletionList);

            // Delete extra file copies.
            (async () => {
              try {
                const resp = await _this._deleteExtraFiles(fileId, deletionList);
                LOGGER.info('RESPONSE FROM NEW FUNC: ' + resp);
              } catch (err) {
                LOGGER.error(err);
              }
            })();
          }
        }

        return 0;
      },
      function(err) {
        LOGGER.error(err);
        throw err;
      },
    );
  }

  /**
   * Used to get rep random FBDs from newFdbChoices list.
   *
   * @param {Array} newFdbChoices List of fdbIps to choose from.
   * @param {Integer} rep Number of fbds to choose from list.
   *
   * @returns {Array} Random sublist of newFdbChoices.
   **/
  _getRandomFDBs(newFdbChoices, rep) {
    // Choose rep fdbs from newFdbChoices randomly.
    let opts = newFdbChoices.length;
    let replicationList = [];
    let randIndex;

    // if additional replications (or deletions) needed is greater than number
    // of FDB choices, set replications (or deletions) equal to number of choices.
    if (rep > opts) {
      LOGGER.info(
        'Trying to add/delete from more fdbs than available. Resetting rep to max allowable value for given fdb.',
      );
      rep = opts;
    }

    for (let i = 0; i < rep; i++) {
      // Get random index.
      randIndex = Math.floor(Math.random() * Math.floor(opts));
      // Get this random fdb, add to replication (or deltion) list, and delete this
      // option from options list.
      replicationList.push(newFdbChoices.splice(randIndex, 1)[0]);
      // Decrease length of newFdbChoices list.
      opts = opts - 1;
    }

    return replicationList;
  }

  /**
   * Retrieve correct copy of file and insert it into a new FDB.
   *
   * @param {String} fileId fileId to replicate.
   * @param {Array} fdbsForFile List of FDBs with correct up-to-date file.
   * @param {Array} replicationList List of FDBs to copy file to.
   *
   * @returns 0 on success, throws error otherwise.
   **/
  async _retrieveAndInsert(fileId, fdbsForFile, replicationList) {
    const _this = this;
    try {
      const randCopyFDB = fdbsForFile[Math.floor(Math.random() * Math.floor(fdbsForFile.length))];
      // Get copy of file.
      let docIdInt = parseInt(fileId);
      let retData = await _this.retrieveFile(docIdInt, randCopyFDB);
      let correctFileName = retData.fileName;
      let correctFileContents = retData.fileContents;
      let correctFileType = retData.fileType;
      let lastestTs = parseInt(retData.fileCreationTime);
      let updatePromises = [];

      // Write this data to all files.
      for (let j = 0; j < replicationList.length; j++) {
        let updateFdbIp = replicationList[j];
        // Make update.
        // docId, fdbIp, fileName, fileContents, fileHash, fileType, ts
        updatePromises.push(
          _this.insertFile(
            docIdInt,
            updateFdbIp,
            correctFileName,
            correctFileContents,
            correctFileType,
            lastestTs,
          ),
        );
      }

      // Create replicas.
      Promise.all(updatePromises).then(
        (vals) => {
          LOGGER.info('SUCCESSFULLY REPLICATED ALL COPIES FOR ' + fileId + '.');
        },
        (err) => {
          LOGGER.error('ERROR WHEN REPLICATING FILES.', err);
        },
      );
      return 0;
    } catch (err) {
      LOGGER.error(err);
    }
  }

  /**
   * Delete extra files.
   *
   * @param {String} fileId fileId to replicate.
   * @param {Array} deletionList List of FDBs to delete file from.
   *
   * @returns 0 on success, throws error otherwise.
   **/
  async _deleteExtraFiles(fileId, deletionList) {
    const _this = this;
    try {
      let updatePromises = [];
      let docIdInt = parseInt(fileId);
      for (let j = 0; j < deletionList.length; j++) {
        let deletionFdbIp = deletionList[j];
        updatePromises.push(_this.deleteFile(docIdInt, deletionFdbIp));
      }

      // Delete replicas.
      Promise.all(updatePromises).then(
        (vals) => {
          LOGGER.info('SUCCESSFULLY DELETED EXTRA COPIES FOR ' + fileId + '.');
        },
        (err) => {
          LOGGER.error('ERROR WHEN DELETING COPIES.', err);
        },
      );
      return 0;
    } catch (err) {
      LOGGER.error(err);
    }
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
   * @param {Array} fbdIpList List of fdbIps, eg. ['1.1.1.1']
   *
   * @returns {Promise} Promise contains organizedDocData and updateInfoPerFile
   *                    objects.
   *
   **/
  getCorrectFileInfo(fdbIps) {
    // organizedDocData structure: {docId: [[fdbIp, hash, ts]]}
    return this.getAllFDBsOrganizedByDocId(fdbIps).then(
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
        LOGGER.error(err);
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
  getUpdatesForEachFile(fdbIps) {
    return this.getCorrectFileInfo(fdbIps).then(
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
              if (docId in updateList) {
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
        LOGGER.error(err);
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
   * @returns {Promise} Promise returns 0 on success, otherwise throws error.
   **/
  makeAllFileCopiesConsistent(fdbIps) {
    // updateInfoPerFile structure: {docId: [fdbIpWithCorrectFile, corretHash, latestTs]}
    let _updateInfoPerFile;
    // updateList structure: {docId: [outOfDateFdbIp ...]}
    let _updateList;

    let _this = this;

    return this.getUpdatesForEachFile(fdbIps)
      .then(function({ updateInfoPerFile, updateList }) {
        // If updateList is empty, all files are consistent.
        if (Object.entries(updateList).length === 0 && updateList.constructor === Object) {
          LOGGER.info('All files consistent already.');
          return 0;
        }
        LOGGER.info('Files are inconsistent, fixing this now.');

        _updateInfoPerFile = updateInfoPerFile;
        _updateList = updateList;
        return 1;
      })
      .then(
        function(status) {
          LOGGER.info('STATUS: ' + status);
          if (status === 0) {
            return 0;
          }
          // Need to update inconsistencies.
          // Go through each file and make updates to out of date FDBs
          LOGGER.info('UPDATE INFO PER FILE', _updateInfoPerFile);

          // Loop through each docId in _updateList and for each docId
          // retrieve the correct update date file and
          // for each outOfDateFdbIp in _updateList[docId]
          // make the update.
          (async () => {
            try {
              for (let docId in _updateList) {
                // Get fdbIp with correct file.
                let fdbIpCorrect = _updateInfoPerFile[docId][0];
                let correctHash = _updateInfoPerFile[docId][1];

                // Grab correct data for file.
                let docIdInt = parseInt(docId);
                let retData = await _this.retrieveFile(docIdInt, fdbIpCorrect);
                let correctFileName = retData.fileName;
                let correctFileContents = retData.fileContents;
                let correctFileType = retData.fileType;
                let lastestTs = parseInt(retData.fileCreationTime);
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
                      correctHash,
                      correctFileType,
                      lastestTs,
                    ),
                  );
                }

                // Update all out of sync files.
                Promise.all(updatePromises).then(
                  (vals) => {
                    LOGGER.info(
                      'SUCCESSFULLY UPDATED ALL INCONSITENT COPIES FOR DOC ' + docId + '.',
                    );
                  },
                  (err) => {
                    LOGGER.error('ERROR WHEN UPDATING INCONSISTENT FILES.', err);
                  },
                );
              }
            } catch (err) {
              LOGGER.error(err);
            }
          })();

          return 0;
        },
        function(err) {
          LOGGER.error(err);
          throw err;
        },
      );
  }
};

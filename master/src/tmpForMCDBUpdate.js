import * as mcdb from './MCDB';

// CAN ONLY RUN AFTER MAKE CORRECT NUMBER OF REPLICAS AND MAKE REPLICAS CONSISTENT
// HAVE COMPLETED.

// TODO: Check that ids of both data structures contain strings.
// TODO: Test this out!
function updateMCDBWithCorrectFDBInfo(fdbIps) {
  // organizedDocData structure: {docId: [[fdbIp, hash, ts, ownerId, fileName]]}
  return this.getAllFDBsOrganizedByDocId(fdbIps).then(
    function(organizedDocData) {
      // Read all MCDB info in.
      mcdb.getAllFiles().then(
        // TODO: Check this is array of file ids
        // mcdbFiles: [{docId: str_id, docData: {all file data}}]
        function(mcdbFiles) {
          const mcdbFileIds = new Set(
            mcdbFiles.map((doc) => {
              doc.id;
            }),
          );
          const fdbFileIds = new Set(Object.keys(organizedDocData));

          const inFdbButNotMcdb = fdbFileIds.filter((ele) => !mcdbFileIds.has(ele));
          const inMcdbButNotFdb = mcdbFileIds.filter((ele) => !fdbFileIds.has(ele));
          const inBoth = fdbFileIds.filter((ele) => mcdbFileIds.has(ele));

          // Sanity check.
          if (inMcdbButNotFdb.size == 0) {
            console.log('FDB has everything MCDB has, great!');
          }

          // Delete extra file ids from MCDB.
          (async () => {
            try {
              await deleteExtras(inMcdbButNotFdb);
            } catch (err) {
              console.error(err);
            }
          })();

          // Sanity check.
          if (inFdbButNotMcdb.size == 0) {
            console.log('MCDB has everything FDBs have, great!');
          }

          // Add missing file ids to MCDB.
          (async () => {
            try {
              await addMissingFileIds(organizedDocData, inFdbButNotMcdb);
            } catch (err) {
              console.error(err);
            }
          })();

          // Check all data in the FDBs and MCDB is consistent.
          // FDBs have the ground truth, so if info does not match, update
          // MCDB.
          (async () => {
            try {
              await updateMCDBwithCorrectFDBInfo(organizedDocData, mcdbFiles, inBoth);
            } catch (err) {
              console.error(err);
            }
          })();

          // // Loop through FDB files and make updates accordingly.
          // let docData;
          // let indexOfFileIdInMcdb;
          // for (let docId in organizeByDocId) {
          //   docData = organizedDocData[docId];
          //   // TODO: check if fileId from FDBs is in MCDB.
          //   // Yes --> Make sure they are the same, if not add to update list.
          //   // No --> Add the missing info to update list.
          //   // TODO: check if MCDB has file Id not in FDB.
          //   // Yes --> Add to removal list.
          //   // If
          // }
        },
        function(err) {
          console.error(err);
          throw err;
        },
      );
    },
    function(err) {
      console.error(err);
      throw err;
    },
  );
}

async function deleteExtras(inMcdbButNotFdb) {
  try {
    let deletePromises = [];
    // Loop through entries if there are any.
    for (let extraFileId of inMcdbButNotFdb) {
      // Delete fileIds in MCDB that are not found in any of the FDBs.
      deletePromises.push(mcdb.deleteFile(extraFileId));
    }

    // Delete extra file IDs.
    Promise.all(deletePromises).then(
      (vals) => {
        console.log('SUCCESSFULLY DELETED ERRONEOUS FILE IDS FROM MCDB.');
      },
      (err) => {
        console.error('ERROR WHEN DELETING ERRONEOUS FILE IDS FROM MCDB.', err);
      },
    );
    return 0;
  } catch (err) {
    console.error(err);
  }
}

async function addMissingFileIds(organizedDocData, inFdbButNotMcdb) {
  try {
    let addPromises = [];
    for (let missingFileId of inFdbButNotMcdb) {
      // Add fileIds to MCDB that are not in the MCDB but is in at least
      // one of the FDBs.
      // organizedDocData structure: {docId: [[fdbIp, hash, ts, ownerId, fileName]]}
      // Since consistency checker has already ran by this point, it is fine to
      // choose the first entry of the docData array.
      let docData = organizedDocData[missingFileId];
      let fileHash = docData[0][1];
      let timestamp = Math.max(...docData.map((ele) => ele[2]));
      let ownerId = docData[0][3];
      let fileName = docData[0][4];
      let fdbLocations = docData.map((ele) => ele[0]);
      addPromises.push(
        mcdb.insertedFile(
          timestamp,
          fdbLocations,
          [], // courseIds reset to empty
          [], // readOnlyUserIds reset to empty
          fileName,
          fileHash,
          ownerId,
        ),
      );
    }

    // Add missing file IDs.
    Promise.all(addPromises).then(
      (vals) => {
        console.log('SUCCESSFULLY ADDED MISSING FILE IDS TO MCDB.');
      },
      (err) => {
        console.error('ERROR WHEN ADDING MISSING FILE IDS TO MCDB.', err);
      },
    );
    return 0;
  } catch (err) {
    console.error(err);
  }
}

async function updateMCDBwithCorrectFDBInfo(organizedDocData, mcdbFiles, inBoth) {
  try {
    // mcdbFiles: [{docId: str_id, docData: {all file data}}]
    let mcdbFastLookUp = {};
    for (const doc in mcdbFiles) {
      mcdbFastLookUp[doc.id] = doc.data();
    }

    let updatePromises = [];
    for (let fileId of inBoth) {
      // Check that the following fields are the same:
      // fileHash, timestamp, fdbLocations, ownerId, fileName
      let docData = organizedDocData[fileId];
      let fileHashFdb = docData[0][1];
      let timestampFdb = Math.max(...docData.map((ele) => ele[2]));
      let ownerIdFdb = docData[0][3];
      let fileNameFdb = docData[0][4];
      let fdbLocationsFdb = docData.map((ele) => ele[0]);

      // Get MCDB data
      let mcdbData = mcdbFastLookUp[fileId];
      let fileHashMcdb = mcdbData.fileHash;
      let timestampMcdb = mcdbData.fileCreationTime;
      let ownerIdMcdb = mcdbData.ownerId;
      let fileNameMcdb = mcdbData.name;
      let fdbLocationsMcdb = mcdbData.fdbLocations;

      // Make sure all entries are equal
      if (
        fileHashFdb === fileHashMcdb &&
        timestampFdb === timestampMcdb &&
        ownerIdFdb === ownerIdFdb &&
        fileNameFdb === fileNameMcdb &&
        fdbLocationsFdb.sort() === fdbLocationsFdb.sort()
      ) {
        console.log(fileNameFdb + 'is same in FDB and MCDB');
      } else {
        console.log(fileNameFdb + 'IS NOT SAME IN FDB AND MCDB.\nUpdating this now.');
        updatePromises.push(
          mcdb.updateFile(
            fileId,
            timestampFdb,
            fdbLocationsFdb.sort(),
            fileNameFdb,
            fileHashFdb,
            ownerIdFdb,
          ),
        );
      }
    }

    // Update all inconsistencies between FDB and MCDB.
    Promise.all(updatePromises).then(
      (vals) => {
        console.log('SUCCESSFULLY SYNCED FDB AND MCDB ENTRIES.');
      },
      (err) => {
        console.error('ERROR WHEN SYNCING FDB AND MCDB ENTRIES.', err);
      },
    );
    return 0;
  } catch (err) {
    console.error(err);
  }
}

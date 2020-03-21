import { AccessFDB } from './workerToFDBConnection.js';
import { LOGGER } from './Logger';
import { insertedFile, addFdbLocation, getFile } from './MCDB';
import { shuffle, findFdbUsingIp } from './HelperFunctions/WorkerUtilities';

import express from 'express';
import { Server } from 'http';
import io from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const httpServer = new Server(app);
const socketServer = io(httpServer);

// List of all FDBs in system
let fdbList: AccessFDB[] = [];

// Client events
const CONNECTION_EVENT = 'connection';
const RETRIEVE_FILE = 'Retrieve File';
const INSERT_FILE = 'Insert File';
const UPDATE_FILE = 'Update File';
const DELETE_FILE = 'Delete File';
const SERVER_RESP = 'Server Response';

// Master events
const DATABASE_LIST = 'database-instances';

socketServer.on(CONNECTION_EVENT, function(socket) {
  /**
   * Retrieves a file from the FDBs
   *
   * Sample request JSON
   {
    "docId": "Event name 2",
    "requestId": "XCJ321CSAD"
   }
   */
  socket.on(RETRIEVE_FILE, async function(req) {
    const docId = req.docId;
    const requestId = req.requestId;

    let docData = null;
    const document = await getFile(docId)
      .then((doc) => {
        if (!doc.exists) {
          socket.emit(SERVER_RESP, {
            requestId,
            message: 'This document does not exist',
          });
        } else {
          docData = doc.data();
        }
      })
      .catch((err) => {
        socket.emit(SERVER_RESP, {
          requestId,
          message: `Error getting document: ${err}`,
        });
      });

    if (docData === null) {
      return;
    }

    const fileLocations = docData['fdbLocations'];
    shuffle(fileLocations);
    console.log(fdbList);
    const fdbRef = findFdbUsingIp(fileLocations[0], fdbList);

    if (!fdbRef) {
      return;
    }

    fdbRef.retrieveFile(docId).then(
      function(resp: any) {
        socket.emit(SERVER_RESP, {
          requestId,
          message: resp,
        });
      },
      function(err: any) {
        socket.emit(SERVER_RESP, {
          requestId,
          message: `Error retrieving file ${err}`,
        });
        throw err;
      },
    );
  });

  /**
   * Create a new file
   * Sample request JSON
   {
    "fileName": "Event name 2",
    "fileContents": "Hello World",
    "fileType": String
    "requestId": "XCJ321CSAD"
    "ownerId": "192.168.12.0"
   }
   */
  socket.on(INSERT_FILE, async function(req) {
    const timeStamp = Date.now();

    const fileName = req.fileName;
    const fileContents = req.fileContents;
    const fileType = req.fileType; // Infer type later
    const requestId = req.requestId;
    const ownerId = req.ownerId;
    const fileHash = req.fileHash; // Generate File hash later

    if (fdbList.length <= 0) {
      socket.emit(SERVER_RESP, {
        requestId,
        message: 'Not enough active FDBs',
      });
      return;
    }

    const insertedResult = insertedFile(timeStamp, [], [], [], fileName, fileHash, ownerId);
    const docId = insertedResult[0];

    let insertSuccess = true;
    await insertedResult[1]
      .then(function() {
        LOGGER.debug('Successfully created entry MCDB');
      })
      .catch(function() {
        LOGGER.debug('Error creating entry into the MCDB');
        insertSuccess = false;
      });

    if (!insertSuccess) {
      socket.emit(SERVER_RESP, {
        requestId,
        message: 'Unable to create an entry into the MCDB, try again',
      });
      return;
    }

    const successfulInserts: string[] = [];
    const replicasToMake = Math.floor(fdbList.length / 3 + 1);
    shuffle(fdbList);
    for (let i = 0; i < replicasToMake; i++) {
      const fdbConnection = fdbList[i];
      await fdbConnection
        .insertFile(docId, fileName, fileContents, fileHash, fileType, timeStamp)
        .then(
          function(resp: any) {
            successfulInserts.push(fdbConnection.getIp());
            socket.emit(SERVER_RESP, {
              requestId,
              message: resp,
            });
          },
          function(err: any) {
            socket.emit(SERVER_RESP, {
              requestId,
              message: `Error inserting file ${err} into server ${fdbList[i].getUrl()}`,
            });
            throw err;
          },
        );
    }

    if (successfulInserts.length <= 0) {
      socket.emit(SERVER_RESP, {
        requestId,
        message: 'No successful inserts into FDBs',
      });
      LOGGER.debug('No successful inserts into FDBs');
      return;
    }

    for (let i = 0; i < successfulInserts.length; i++) {
      await addFdbLocation(docId, successfulInserts[i]);
    }
  });

  // TODO: Retrieve list of files from Firebase
  // socket.on(UPDATE_FILE, function(req) {
  //   const docId = req.docId;
  //   const fileName = req.fileName;
  //   const fileContents = req.fileContents;
  //   const fileHash = req.fileHash;
  //   const fileType = req.fileType;
  //   const timeStamp = Date.now();
  //
  //   accessFDB.updateFile(docId, fileName, fileContents, fileHash, fileType, timeStamp).then(
  //     function(resp) {
  //       socket.emit(SERVER_RESP, {
  //         // TODO: Add a request ID
  //         message: resp,
  //       });
  //     },
  //     function(err) {
  //       socket.emit(SERVER_RESP, {
  //         // TODO: Add a request ID
  //         message: `Error updating file ${err}`,
  //       });
  //       throw err;
  //     },
  //   );
  // });

  // TODO: Retrieve list of files from Firebase
  // socket.on(DELETE_FILE, function(req) {
  //   const docId = req.docId;
  //
  //   accessFDB.deleteFile(docId).then(
  //     function(resp) {
  //       socket.emit(SERVER_RESP, {
  //         // TODO: Add a client request ID
  //         message: resp,
  //       });
  //     },
  //     function(err) {
  //       socket.emit(SERVER_RESP, {
  //         // TODO: Add a client request ID
  //         message: `Error deleting file ${err}`,
  //       });
  //       throw err;
  //     },
  //   );
  // });

  // Master Handlers
  socket.on(DATABASE_LIST, function(req) {
    socket.emit('health-response', 'I am alive');
    fdbList = []; // Reset fdbList
    for (let i = 0; i < req.length; i++) {
      const ipAddress = req[i]['publicIp'];
      const instanceRunning = req[i]['instanceRunning'] === true;
      const instanceServing = req[i]['instanceServing'] === true;

      if (instanceRunning && instanceServing) {
        const fdbInstance = new AccessFDB(ipAddress);
        fdbList.push(fdbInstance);
      }
    }
  });
});

const PORT = process.env.PORT || 4001;
httpServer.listen(PORT, () => {
  LOGGER.debug(`Server started at http://localhost:${PORT}`);
});

import { AccessFDB } from './workerToFDBConnection.js';
import { LOGGER } from './Logger';
import { v4 } from 'uuid';
import { insertedFile, addFdbLocation } from './MCDB';

import express from 'express';
import { Server } from 'http';
import io from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const httpServer = new Server(app);
const socketServer = io(httpServer);

// List of all FDBs in system
let fdbList: any = [];

// Client events
const CONNECTION_EVENT = 'connection';
const RETRIEVE_FILE = 'Retrieve File';
const INSERT_FILE = 'Insert File';
const UPDATE_FILE = 'Update File';
const DELETE_FILE = 'Delete File';
const SERVER_RESP = 'Server Response';

// Master events
const DATABASE_LIST = 'database-instances';

function shuffle(array: any) {
  let currentIndex = array.length;
  let temporaryValue;
  let randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

socketServer.on(CONNECTION_EVENT, function(socket) {
  // TODO: Retrieve list of files from Firebase
  // socket.on(RETRIEVE_FILE, function(req) {
  //   const docId = req.docId;
  //
  //   accessFDB.retrieveFile(docId).then(
  //     function(resp) {
  //       socket.emit(SERVER_RESP, {
  //         // TODO: Add a client request ID
  //         message: resp,
  //       });
  //     },
  //     function(err) {
  //       socket.emit(SERVER_RESP, {
  //         // TODO: Add a client request ID
  //         message: `Error retrieving file ${err}`,
  //       });
  //       throw err;
  //     },
  //   );
  // });

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
    // Server generated
    const timeStamp = Date.now();

    const fileName = req.fileName;
    const fileContents = req.fileContents;
    const fileType = req.fileType; // Infer type later
    const requestId = req.requestId;
    const ownerId = req.ownerId;
    const fileHash = req.fileHash; // Generate File hash later

    if (fdbList <= 0) {
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

import { AccessFDB } from './workerToFDBConnection.js';
import { LOGGER } from './Logger';
import { v4 } from 'uuid';
import { insertedFile } from './MCDB';

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

  socket.on(INSERT_FILE, function(req) {
    const docId = v4();
    const fileName = req.fileName;
    const fileContents = req.fileContents;
    const fileHash = req.fileHash;
    const fileType = req.fileType;
    const timeStamp = Date.now();
    const successfulInserts: string[] = [];

    if (fdbList <= 0) {
      socket.emit(SERVER_RESP, {
        // TODO: Add a request ID
        message: 'Not enough active FDBs',
      });
      return;
    }

    const replicasToMake = Math.floor(fdbList.length / 3 + 1);
    shuffle(fdbList);
    for (let i = 0; i < replicasToMake; i++) {
      const fdbConnection = fdbList[i];
      fdbConnection.insertFile(docId, fileName, fileContents, fileHash, fileType, timeStamp).then(
        function(resp: any) {
          // Write this information to the MCDB to ensure other workers know of this change
          successfulInserts.push(fdbConnection.getIp());
          socket.emit(SERVER_RESP, {
            // TODO: Add a client request ID
            message: resp,
          });
        },
        function(err: any) {
          socket.emit(SERVER_RESP, {
            // TODO: Add a client request ID
            message: `Error inserting file ${err} into server ${fdbList[i].getUrl()}`,
          });
          throw err;
        },
      );
    }

    if (successfulInserts.length <= 0) {
      LOGGER.debug('No successful inserts into FDBs');
      return;
    }

    // Update MCDB with successful create
    insertedFile(timeStamp, successfulInserts, [], [], fileName)
      .then(function() {
        LOGGER.debug('Successfully inserted in MCDB');
      })
      .catch(function() {
        LOGGER.debug('Error inserting into the MCDB');
      });
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

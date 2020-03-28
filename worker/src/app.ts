import { AccessFDB } from './HelperFunctions/workerToFDBConnection';
import { LOGGER } from './Logger';
import { insertedFile, getAllFiles, setClient } from './MCDB';
import {
  shuffle,
  findFdbUsingIp,
  retrieveFdbLocations,
  createReplicas,
  replicasNeeded,
} from './HelperFunctions/WorkerUtilities';

import express from 'express';
import { Server } from 'http';
import io from 'socket.io';
import cors from 'cors';
import { SHA256 } from 'crypto-js';

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
const SET_CLIENT = 'Set Client';

// Server message constants
const SERVER_RESP = 'Server Response';
const SEND_ALL_FILES = 'All Files';
const SUCCESS = 'success';
const FAILED = 'failed';

// Master events
const DATABASE_LIST = 'database-instances';

/**
 * This function sends an ERROR message to the socket passed
 * to it
 */
function sendErrorMessage(socket: any, requestId: string, message: any) {
  socket.emit(SERVER_RESP, {
    requestId: requestId,
    status: FAILED,
    message: message,
  });
}

/**
 * This function sends a SUCCESS message to the socket passed
 * to it
 */
function sendSuccessMessage(socket: any, requestId: string, message: any) {
  socket.emit(SERVER_RESP, {
    requestId: requestId,
    status: SUCCESS,
    message: message,
  });
}

// Send all files to a single client
async function sendAllFilesToClient(socket: any) {
  const allFiles = await getAllFiles();
  socket.emit(SEND_ALL_FILES, allFiles);
}

// Broadcast all files to all clients in network
async function broadcastAllFilesToClients() {
  const allFiles = await getAllFiles();
  socketServer.emit(SEND_ALL_FILES, allFiles);
}

socketServer.on(CONNECTION_EVENT, function(socket) {
  sendAllFilesToClient(socket);

  socket.on(SET_CLIENT, (req) => {
    setClient(req);
  });

  /**
   * Retrieves a File
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
    if (!docId || !requestId) {
      sendErrorMessage(socket, requestId, 'Missing request parameters');
      return;
    }

    let fdbLocations: any[];
    try {
      fdbLocations = await retrieveFdbLocations(docId);
      if (!fdbLocations) {
        sendErrorMessage(socket, requestId, 'Error finding FDB locations in the MCDB');
        return;
      }
    } catch (err) {
      sendErrorMessage(socket, requestId, `Error getting document: ${err}`);
      return;
    }

    shuffle(fdbLocations);
    const fdbRef = findFdbUsingIp(fdbLocations[0], fdbList);
    if (!fdbRef) {
      sendErrorMessage(socket, requestId, 'Error finding FDB IP in current Fdb List');
      return;
    }

    /**
      TODO: Show what success response will look like
     */
    fdbRef.retrieveFile(docId).then(
      function(resp: any) {
        sendSuccessMessage(socket, requestId, resp);
      },
      function(err: any) {
        sendErrorMessage(socket, requestId, `Error retrieving file ${err}`);
        throw err;
      },
    );
  });

  /**
   * Create a new file
   *
   * Sample request JSON
   {
    "fileName": "Event name 2",
    "fileContents": "Hello World",
    "fileType": String,
    "requestId": "XCJ321CSAD",
    "ownerId": "192.168.12.0",
    "fileHash": "XXADFAFDAASD"
   }
   */
  socket.on(INSERT_FILE, async function(req) {
    const timeStamp = Date.now();
    const fileName = req.fileName;
    const fileType = req.fileType; // Infer type later
    const fileContents = req.fileContents;
    const fileHash = req.fileHash; // Generate File hash later
    const requestId = req.requestId;
    const ownerId = req.ownerId;

    if (!fileName || !fileType || !fileContents || !fileHash || !requestId || !ownerId) {
      sendErrorMessage(socket, requestId, 'Missing request parameters');
      return;
    }

    if (fdbList.length <= 0) {
      sendErrorMessage(socket, requestId, 'Not enough active FDBs');
      return;
    }

    const newHash = SHA256(fileContents).toString();

    if (newHash !== fileHash) {
      sendErrorMessage(socket, requestId, 'File hashes do not match');
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
      sendErrorMessage(socket, requestId, 'Unable to create an entry into the MCDB, try again');
      return;
    }

    const replicasToMake = replicasNeeded(fdbList);
    try {
      const successfulInserts = await createReplicas(
        fdbList,
        replicasToMake,
        docId,
        fileName,
        fileContents,
        fileHash,
        fileType,
        timeStamp,
      );

      if (successfulInserts.length <= 0) {
        sendErrorMessage(socket, requestId, 'No successful inserts into FDBs');
        LOGGER.debug('No successful inserts into FDBs');
        return;
      }

      sendSuccessMessage(
        socket,
        requestId,
        `Successful inserts into ${successfulInserts.map((elem) => elem.getIp()).join()}`,
      );
    } catch (err) {
      sendErrorMessage(socket, requestId, `Unable to create replicas because: ${err}`);
    }

    broadcastAllFilesToClients();
  });

  /**
   * Updates a File
   *
   * Sample request JSON
   {
    "docId": "8oKHFT2KrieG5Ghus9bm",
    "fileName": "Event name 2",
    "fileContents": "Hello World",
    "fileType": String,
    "requestId": "XCJ321CSAD",
    "fileHash": "XXADFAFDAASD"
   }
   */
  socket.on(UPDATE_FILE, async function(req) {
    const docId = req.docId;
    const timeStamp = Date.now();
    const fileName = req.fileName;
    const fileContents = req.fileContents;
    const fileType = req.fileType; // Infer type later
    const requestId = req.requestId;
    const fileHash = req.fileHash; // Generate File hash later

    if (!docId || !fileName || !fileContents || !fileType || !requestId || !fileHash) {
      sendErrorMessage(socket, requestId, 'Missing request parameters');
      return;
    }

    let fdbLocations: any[];
    try {
      fdbLocations = await retrieveFdbLocations(docId);
      if (!fdbLocations) {
        sendErrorMessage(socket, requestId, 'Error finding FDB locations in the MCDB');
        return;
      }
    } catch (err) {
      sendErrorMessage(socket, requestId, `Error getting document: ${err}`);
      return;
    }

    const successfulUpdates: AccessFDB[] = [];
    const missingFdbIps: string[] = [];
    for (let i = 0; i < fdbLocations.length; i++) {
      const fdbRef = findFdbUsingIp(fdbLocations[i], fdbList);
      if (!fdbRef) {
        missingFdbIps.push(fdbLocations[i]);
        continue;
      }

      await fdbRef.updateFile(docId, fileName, fileContents, fileHash, fileType, timeStamp).then(
        function(resp: any) {
          successfulUpdates.push(fdbRef);
        },
        function(err: any) {
          throw err;
        },
      );
    }

    // If it was unable to update any FDB, create replicas elsewhere
    if (successfulUpdates.length <= 0) {
      sendErrorMessage(socket, requestId, 'No successful updates into FDBs');
      LOGGER.debug('No successful updates into FDBs');

      const replicasToMake = replicasNeeded(fdbList);
      try {
        const successfulInserts = await createReplicas(
          fdbList,
          replicasToMake,
          docId,
          fileName,
          fileContents,
          fileHash,
          fileType,
          timeStamp,
          requestId,
        );

        if (successfulInserts.length <= 0) {
          sendErrorMessage(socket, requestId, 'No successful inserts into FDBs');
          LOGGER.debug('No successful inserts into FDBs');
          return;
        }

        sendSuccessMessage(
          socket,
          requestId,
          `Successful inserts into ${successfulInserts.map((elem) => elem.getIp()).join()}`,
        );
      } catch (err) {
        sendErrorMessage(socket, requestId, `Unable to create replicas because: ${err}`);
      }
      return;
    }

    sendSuccessMessage(
      socket,
      requestId,
      `Successful updates into ${successfulUpdates.map((elem) => elem.getIp()).join()}`,
    );

    // If the MCDBs entry for FDB FileLocations of a file has a mismatch
    // between the current FDBs that are alive in the system, populate
    // new ones. Also make sure over here, that you don't insert the file
    // a second time into the same FDB
    if (missingFdbIps.length > 0) {
      const replicasToMake = missingFdbIps.length;
      try {
        const successfulInserts = await createReplicas(
          fdbList,
          replicasToMake,
          docId,
          fileName,
          fileContents,
          fileHash,
          fileType,
          timeStamp,
          successfulUpdates, // Avoid the previous successful updates
        );

        if (successfulInserts.length <= 0) {
          sendErrorMessage(socket, requestId, 'No successful inserts into FDBs');
          LOGGER.debug('No successful inserts into FDBs');
          return;
        }

        sendSuccessMessage(
          socket,
          requestId,
          `Successful inserts into ${successfulInserts.map((elem) => elem.getIp()).join()}`,
        );
      } catch (err) {
        sendErrorMessage(socket, requestId, `Unable to create replicas because: ${err}`);
      }
    }

    broadcastAllFilesToClients();
  });

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
  setInterval(() => {
    broadcastAllFilesToClients();
  }, 1000 * 60);
});

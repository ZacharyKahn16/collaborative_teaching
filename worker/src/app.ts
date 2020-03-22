import { AccessFDB } from './HelperFunctions/workerToFDBConnection.js';
import { LOGGER } from './Logger';
import { insertedFile, addFdbLocation, getFile } from './MCDB';
import {
  shuffle,
  findFdbUsingIp,
  retrieveFdbLocations,
  createReplicas,
} from './HelperFunctions/WorkerUtilities';

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

    const fdbLocations: any[] = await retrieveFdbLocations(socket, docId, requestId)
      .then((result) => {
        return result;
      })
      .catch((err) => {
        throw err;
      });
    if (fdbLocations === []) {
      return;
    }

    shuffle(fdbLocations);
    const fdbRef = findFdbUsingIp(fdbLocations[0], fdbList);

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

    const replicasToMake = Math.floor(fdbList.length / 3 + 1);
    await createReplicas(
      socket,
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
  });

  /**
   * Updates a File
   *
   * Sample request JSON
   {
    "docId": "Event name 2",
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

    const fdbLocations: any[] = await retrieveFdbLocations(socket, docId, requestId).then(
      (result) => {
        return result;
      },
    );
    if (!fdbLocations) {
      return;
    }

    const successfulUpdates: string[] = [];
    const missingFdbIps: string[] = [];
    for (let i = 0; i < fdbLocations.length; i++) {
      const fdbRef = findFdbUsingIp(fdbLocations[i], fdbList);

      if (!fdbRef) {
        missingFdbIps.push(fdbLocations[i]);
        continue;
      }

      await fdbRef.updateFile(docId, fileName, fileContents, fileHash, fileType, timeStamp).then(
        function(resp: any) {
          successfulUpdates.push(fdbRef.getIp());
          socket.emit(SERVER_RESP, {
            requestId,
            message: resp,
          });
        },
        function(err: any) {
          socket.emit(SERVER_RESP, {
            requestId,
            message: `Error updating file ${err}`,
          });
          throw err;
        },
      );
    }

    // If it was unable to update any FDB, create replicas elsewhere
    if (successfulUpdates.length <= 0) {
      socket.emit(SERVER_RESP, {
        requestId,
        message: 'No successful updates into FDBs',
      });
      LOGGER.debug('No successful updates into FDBs');

      // Pick random MCDBs and insert this file into
      const replicasToMake = Math.floor(fdbList.length / 3 + 1);
      await createReplicas(
        socket,
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
      return;
    }

    // If the MCDBs entry for FDB FileLocations of a file has a mismatch
    // between the current FDBs that are alive in the system, populate
    // new ones.
    const replicasToMake = missingFdbIps.length;
    await createReplicas(
      socket,
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
});

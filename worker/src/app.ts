import { AccessFDB } from './HelperFunctions/workerToFDBConnection';
import { LOGGER } from './Logger';
import {
  insertedFile,
  getAllFiles,
  setClient,
  verifyClientExists,
  createNewCourse,
  getAllCourses,
  verifyCourseExists,
  verifyFileExists,
  getCourse,
  addCourseIdToFile,
  addFileToCourse,
  removeFileFromCourse,
  removeCourseIdFromFile,
  updateCourse,
  verifyOwner,
  updateFile,
  deleteFile,
} from './MCDB';
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
import * as fs from './Firebase';

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

const ADD_COURSE = 'Add Course';
const UPDATE_COURSE = 'Update Course';
const ADD_FILE_TO_COURSE = 'Add File To Course';
const REMOVE_FILE_FROM_COURSE = 'Remove File From Course';

// Server message constants
const SERVER_RESP = 'Server Response';
const SEND_ALL_FILES = 'All Files';
const SEND_ALL_COURSES = 'All Courses';
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

// Send all metadata to a single client
async function sendAllMetadataToClient(socket: any) {
  const allFiles = await getAllFiles();
  const allCourses = await getAllCourses();

  socket.emit(SEND_ALL_FILES, allFiles);
  socket.emit(SEND_ALL_COURSES, allCourses);
}

// Broadcast all metadata to all clients in network
async function broadcastAllMetadataToClients() {
  const allFiles = await getAllFiles();
  const allCourses = await getAllCourses();

  socketServer.emit(SEND_ALL_FILES, allFiles);
  socketServer.emit(SEND_ALL_COURSES, allCourses);
}

socketServer.on(CONNECTION_EVENT, function(socket) {
  sendAllMetadataToClient(socket);

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
      sendErrorMessage(
        socket,
        requestId,
        `Error getting document: ${err.message ? err.message : err}`,
      );
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
        sendErrorMessage(
          socket,
          requestId,
          `Error retrieving file ${err.message ? err.message : err}`,
        );
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
    "ownerId": "192.168.12.0",
    "requestId": "XCJ321CSAD",
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
        ownerId,
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
      sendErrorMessage(
        socket,
        requestId,
        `Unable to create replicas because: ${err.message ? err.message : err}`,
      );
    }

    broadcastAllMetadataToClients();
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
    "ownerId": "192.168.12.0",
    "requestId": "XCJ321CSAD",
    "fileHash": "XXADFAFDAASD"
   }
   */
  socket.on(UPDATE_FILE, async function(req) {
    const timeStamp = Date.now();
    const docId = req.docId;
    const fileName = req.fileName;
    const fileContents = req.fileContents;
    const fileType = req.fileType; // Infer type later
    const ownerId = req.ownerId;
    const requestId = req.requestId;
    const fileHash = req.fileHash; // Generate File hash later

    if (!docId || !fileName || !fileContents || !fileType || !requestId || !fileHash) {
      sendErrorMessage(socket, requestId, 'Missing request parameters');
      return;
    }

    const newHash = SHA256(fileContents).toString();

    if (newHash !== fileHash) {
      sendErrorMessage(socket, requestId, 'File hashes do not match');
      return;
    }

    const fileExists = await verifyFileExists(docId);
    const userIsOwner = await verifyOwner(docId, ownerId);

    if (!fileExists) {
      sendErrorMessage(socket, requestId, 'File does not exist');
      return;
    }

    if (!userIsOwner) {
      sendErrorMessage(
        socket,
        requestId,
        'Invalid operation: This user is not the owner of this file',
      );
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
      sendErrorMessage(
        socket,
        requestId,
        `Error getting document: ${err.message ? err.message : err}`,
      );
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
          ownerId,
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
        sendErrorMessage(
          socket,
          requestId,
          `Unable to create replicas because: ${err.message ? err.message : err}`,
        );
      }
      return;
    }

    sendSuccessMessage(
      socket,
      requestId,
      `Successful updates into ${successfulUpdates.map((elem) => elem.getIp()).join()}`,
    );

    try {
      await updateFile(docId, {
        fileHash: fileHash,
        lastUpdated: timeStamp,
        name: fileName,
      });
    } catch (err) {
      sendErrorMessage(
        socket,
        requestId,
        `Unable to update entry in the MCDB: ${err.message ? err.message : err}`,
      );
      return;
    }

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
          ownerId,
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
          `Successful inserts into ${successfulInserts.length} file databases`,
        );
        broadcastAllMetadataToClients();
      } catch (err) {
        sendErrorMessage(
          socket,
          requestId,
          `Unable to create replicas because: ${err.message ? err.message : err}`,
        );
      }
    }
  });

  /**
   * Deletes a file
   *
   * Sample request JSON
   {
    "docId": "Event name 2",
    "ownerId": "James Peralta",
    "requestId": "XCJ321CSAD"
   }
   */
  socket.on(DELETE_FILE, async function(req) {
    const docId = req.docId;
    const ownerId = req.ownerId;
    const requestId = req.requestId;

    const fileExists = await verifyFileExists(docId);
    const userIsOwner = await verifyOwner(docId, ownerId);

    if (!fileExists) {
      sendErrorMessage(socket, requestId, 'File does not exist');
      return;
    }

    if (!userIsOwner) {
      sendErrorMessage(
        socket,
        requestId,
        'Invalid operation: This user is not the owner of this file',
      );
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
      sendErrorMessage(
        socket,
        requestId,
        `Error getting document: ${err.message ? err.message : err}`,
      );
      return;
    }

    const successfulDeletes: AccessFDB[] = [];
    for (let i = 0; i < fdbLocations.length; i++) {
      const fdbRef = findFdbUsingIp(fdbLocations[i], fdbList);
      if (!fdbRef) {
        continue;
      }

      await fdbRef.deleteFile(docId).then(
        function(resp: any) {
          successfulDeletes.push(fdbRef);
        },
        function(err: any) {
          throw err;
        },
      );
    }

    if (successfulDeletes.length <= 0) {
      sendErrorMessage(socket, requestId, 'No successful deletes from FDBs');
      LOGGER.debug('No successful deletes from FDBs');
      return;
    }

    try {
      await deleteFile(docId);
      broadcastAllMetadataToClients();
    } catch (err) {
      sendErrorMessage(
        socket,
        requestId,
        `Unable to delete entry in the MCDB: ${err.message ? err.message : err}`,
      );
    }
  });

  socket.on(ADD_COURSE, async (req) => {
    const { ownerId, courseName, courseDesc, requestId } = req;

    if (!ownerId) {
      sendErrorMessage(socket, requestId, 'Missing owner id');
      return;
    }

    if (!courseName) {
      sendErrorMessage(socket, requestId, 'Missing course name');
      return;
    }

    if (!courseDesc) {
      sendErrorMessage(socket, requestId, 'Missing course description');
      return;
    }

    const clientExists = await verifyClientExists(ownerId);

    if (!clientExists) {
      sendErrorMessage(socket, requestId, 'Client does not exist');
      return;
    }

    const result = createNewCourse(courseName, courseDesc, ownerId);

    try {
      await result[1];
      sendSuccessMessage(socket, requestId, `Created new course`);
      broadcastAllMetadataToClients();
      return;
    } catch (err) {
      LOGGER.error('Failed to create course', err);
      sendErrorMessage(socket, requestId, 'Could not create course');
      return;
    }
  });

  socket.on(UPDATE_COURSE, async (req) => {
    const { ownerId, courseId, courseName, courseDesc, requestId } = req;

    if (!ownerId) {
      sendErrorMessage(socket, requestId, 'Missing owner id');
      return;
    }

    if (!courseId) {
      sendErrorMessage(socket, requestId, 'Missing course id');
      return;
    }

    if (!courseName) {
      sendErrorMessage(socket, requestId, 'Missing course name');
      return;
    }

    if (!courseDesc) {
      sendErrorMessage(socket, requestId, 'Missing course description');
      return;
    }

    const clientExists = await verifyClientExists(ownerId);
    const courseExists = await verifyCourseExists(courseId);

    if (!clientExists) {
      sendErrorMessage(socket, requestId, 'Client does not exist');
      return;
    }

    if (!courseExists) {
      sendErrorMessage(socket, requestId, 'Course does not exist');
      return;
    }

    const courseData = await getCourse(courseId);
    if (!courseData) {
      sendErrorMessage(socket, requestId, 'Could not get course data');
      return;
    }

    if (courseData.ownerId !== ownerId) {
      sendErrorMessage(socket, requestId, 'You are not owner of this course');
      return;
    }

    try {
      await updateCourse(courseId, courseName, courseDesc);
      sendSuccessMessage(socket, requestId, `Updated the course`);
      broadcastAllMetadataToClients();
      return;
    } catch (err) {
      LOGGER.error('Failed to update course', err);
      sendErrorMessage(socket, requestId, 'Could not update course');
      return;
    }
  });

  socket.on(ADD_FILE_TO_COURSE, async (req) => {
    const { ownerId, courseId, fileId, requestId } = req;

    if (!ownerId) {
      sendErrorMessage(socket, requestId, 'Missing owner id');
      return;
    }

    if (!courseId) {
      sendErrorMessage(socket, requestId, 'Missing course id');
      return;
    }

    if (!fileId) {
      sendErrorMessage(socket, requestId, 'Missing file id');
      return;
    }

    const clientExists = await verifyClientExists(ownerId);
    const courseExists = await verifyCourseExists(courseId);
    const fileExists = await verifyFileExists(fileId);

    if (!clientExists) {
      sendErrorMessage(socket, requestId, 'Client does not exist');
      return;
    }

    if (!courseExists) {
      sendErrorMessage(socket, requestId, 'Course does not exist');
      return;
    }

    if (!fileExists) {
      sendErrorMessage(socket, requestId, 'File does not exist');
      return;
    }

    const courseData = await getCourse(courseId);
    if (!courseData) {
      sendErrorMessage(socket, requestId, 'Could not get course data');
      return;
    }

    if (courseData.ownerId !== ownerId) {
      sendErrorMessage(socket, requestId, 'You are not owner of this course');
      return;
    }

    try {
      await addCourseIdToFile(fileId, courseId);
      await addFileToCourse(courseId, fileId);

      sendSuccessMessage(socket, requestId, 'Added file to the course');
      broadcastAllMetadataToClients();
      return;
    } catch (err) {
      LOGGER.error('Failed to add file to course', err);
      sendErrorMessage(socket, requestId, 'Could not add file to course');
      return;
    }
  });

  socket.on(REMOVE_FILE_FROM_COURSE, async (req) => {
    const { ownerId, courseId, fileId, requestId } = req;

    if (!ownerId) {
      sendErrorMessage(socket, requestId, 'Missing owner id');
      return;
    }

    if (!courseId) {
      sendErrorMessage(socket, requestId, 'Missing course id');
      return;
    }

    if (!fileId) {
      sendErrorMessage(socket, requestId, 'Missing file id');
      return;
    }

    const clientExists = await verifyClientExists(ownerId);
    const courseExists = await verifyCourseExists(courseId);
    const fileExists = await verifyFileExists(fileId);

    if (!clientExists) {
      sendErrorMessage(socket, requestId, 'Client does not exist');
      return;
    }

    if (!courseExists) {
      sendErrorMessage(socket, requestId, 'Course does not exist');
      return;
    }

    if (!fileExists) {
      sendErrorMessage(socket, requestId, 'File does not exist');
      return;
    }

    const courseData = await getCourse(courseId);
    if (!courseData) {
      sendErrorMessage(socket, requestId, 'Could not get course data');
      return;
    }

    if (courseData.ownerId !== ownerId) {
      sendErrorMessage(socket, requestId, 'You are not owner of this course');
      return;
    }

    try {
      await removeCourseIdFromFile(fileId, courseId);
      await removeFileFromCourse(courseId, fileId);

      sendSuccessMessage(socket, requestId, 'Removed file from the course');
      broadcastAllMetadataToClients();
      return;
    } catch (err) {
      LOGGER.error('Failed to file from course', err);
      sendErrorMessage(socket, requestId, 'Could not remove file from course');
      return;
    }
  });

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
    broadcastAllMetadataToClients();
  }, 1000 * 60);
});

/**
 *  Main worker class. This class represents a socket server that clients will connect to
 *  and it will service all of the clients requests.
 */
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
  getAllCourseIdsWithFile,
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
const DEBUG = 'Debug';

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

/**
 * Sends a list of all files and courses to a single client
 */
async function sendAllMetadataToClient(socket: any) {
  const allFiles = await getAllFiles();
  const allCourses = await getAllCourses();

  socket.emit(SEND_ALL_FILES, allFiles);
  socket.emit(SEND_ALL_COURSES, allCourses);
}

/**
 * Sends a list of all files and courses to all clients attached to
 * this worker
 */
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
   * Services a retrieve operation for a client.
   *
   * Ex) Client wants the file README.md
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

    // Get the ip addresses of FDBs that have this file
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

    // Shuffle fdb list to randomize the order of fdb locations.
    // This ensures we randomly choose an fdb to request from.
    shuffle(fdbLocations);
    const successfulRetrievals: any[] = [];
    // Cycle through all FDBs that have this file until we get
    // a successful retrieval
    for (let i = 0; i < fdbLocations.length; i++) {
      if (successfulRetrievals.length > 0) {
        break;
      }

      // Get instance of AccessFdb object for this given IP address
      const fdbRef = findFdbUsingIp(fdbLocations[i], fdbList);
      if (!fdbRef) {
        continue;
      }

      await fdbRef.retrieveFile(docId).then(
        function(resp: any) {
          sendSuccessMessage(socket, requestId, resp);
          successfulRetrievals.push(fdbRef);
          return;
        },
        function(err: any) {
          console.log(err);
        },
      );
    }

    if (successfulRetrievals.length <= 0) {
      sendErrorMessage(socket, requestId, 'Error retrieving file');
    }
  });

  /**
   * Services a Insert/Create file from a client
   *
   * Ex) Client wants to insert Lecture1.pdf
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
    const fileType = req.fileType;
    const fileContents = req.fileContents;
    const fileHash = req.fileHash;
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

    // Compare hashes to ensure file was not corrupted when sent
    const newHash = SHA256(fileContents).toString();
    if (newHash !== fileHash) {
      sendErrorMessage(socket, requestId, 'File hashes do not match');
      return;
    }

    // Insert the metadata of this file into the MCDB
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

    // Insert the file contents into the fdbs and ensure it is replicated
    // across multiple instances
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
        `Successful inserts into ${successfulInserts.length} file databases`,
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
   * Services an update request for a client
   *
   * Ex) A client wants to make an update to their README.md
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
    const fileType = req.fileType;
    const ownerId = req.ownerId;
    const requestId = req.requestId;
    const fileHash = req.fileHash;

    if (!docId || !fileName || !fileContents || !fileType || !requestId || !fileHash) {
      sendErrorMessage(socket, requestId, 'Missing request parameters');
      return;
    }

    // Hash file contents to ensure data was not corrupted
    const newHash = SHA256(fileContents).toString();
    if (newHash !== fileHash) {
      sendErrorMessage(socket, requestId, 'File hashes do not match');
      return;
    }

    // Ensure file exists and user who wants to perform an update is the
    // owner of this file
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

    // Get the ip addresses of FDBs that have this file
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

    // Attempt to update this file at each location
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
          LOGGER.debug(err);
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
      `Successful updates to ${successfulUpdates.length} file databases`,
    );

    // Update the MCDB with the latest information of these files
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
    // new ones. Also make sure that we don't insert the file
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
   * Services a delete request for a client
   *
   * Ex) A client wants to delete their README.md file
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

    // Verify this file exists and that the user whos wants to delete
    // this file is also the owner of this file.
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

    // Find the IP addresses of all fdbs that have this file
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

    // Delete this file from every FDB
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
          LOGGER.debug(err);
        },
      );
    }

    // Delete file from courses in MCDB
    const allCoursesWithFile = await getAllCourseIdsWithFile(docId);
    for (const course of allCoursesWithFile) {
      removeFileFromCourse(course, docId).catch((err) => {
        console.log(err);
      });
    }

    if (successfulDeletes.length <= 0) {
      sendErrorMessage(socket, requestId, 'No successful deletes from FDBs');
      LOGGER.debug('No successful deletes from FDBs');
      return;
    }

    try {
      await deleteFile(docId);
      sendSuccessMessage(socket, requestId, 'File has been deleted');
      broadcastAllMetadataToClients();
    } catch (err) {
      sendErrorMessage(
        socket,
        requestId,
        `Unable to delete entry in the MCDB: ${err.message ? err.message : err}`,
      );
    }
  });

  /**
   * Services a add course request for a client
   * Sample request JSON
   {
    "courseName": "course name",
    "courseDesc": "course desc",
    "ownerId": "James Peralta",
    "requestId": "XCJ321CSAD"
   }
   */
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
      sendSuccessMessage(socket, requestId, 'Created new course');
      broadcastAllMetadataToClients();
      return;
    } catch (err) {
      LOGGER.error('Failed to create course', err);
      sendErrorMessage(socket, requestId, 'Could not create course');
      return;
    }
  });

  /**
   * Services a update course request for a client
   * Sample request JSON
   {
    "courseName": "course name",
    "courseDesc": "course desc",
    "courseId": "asdasdas",
    "ownerId": "James Peralta",
    "requestId": "XCJ321CSAD"
   }
   */
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
      sendSuccessMessage(socket, requestId, 'Updated the course');
      broadcastAllMetadataToClients();
      return;
    } catch (err) {
      LOGGER.error('Failed to update course', err);
      sendErrorMessage(socket, requestId, 'Could not update course');
      return;
    }
  });

  /**
   * Services a add file to course request for a client
   * Sample request JSON
   {
    "fileId": "asdasdas desc",
    "courseId": "asdasdas",
    "ownerId": "James Peralta",
    "requestId": "XCJ321CSAD"
   }
   */
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

  /**
   * Services a remove file from course request for a client
   * Sample request JSON
   {
    "fileId": "asdasdas desc",
    "courseId": "asdasdas",
    "ownerId": "James Peralta",
    "requestId": "XCJ321CSAD"
   }
   */
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

  /**
   *  This socket is open for Masters to check if this worker
   *  is still alive. It is also used for masters to give this worker a
   *  list of active fdbs in the system.
   */
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

  // Used for debugging
  socket.on(DEBUG, function(req) {
    const fdbIps: any[] = [];
    for (const fdb of fdbList) {
      fdbIps.push(fdb.getIp());
    }

    socket.emit(SERVER_RESP, {
      Message: 'Debug FdbList',
      fdbList: fdbIps,
    });
  });
});

const PORT = process.env.PORT || 4001;
httpServer.listen(PORT, () => {
  LOGGER.debug(
    `${(process.env.NAME || 'Server').toUpperCase()} started at http://localhost:${PORT}`,
  );
  // Every 15 seconds broadcast all metadata
  setInterval(() => {
    broadcastAllMetadataToClients();
  }, 1000 * 15);
});

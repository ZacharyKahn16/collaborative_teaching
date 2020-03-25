import { AccessFDB } from './workerToFDBConnection';
import { LOGGER } from '../Logger';
import { addFdbLocation, getFile } from '../MCDB';
const SERVER_RESP = 'Server Response';
const SUCCESS = 'success';
const FAILED = 'failed';

import deepCopy from 'rfdc';
const deepCopyFunc = deepCopy({ proto: true });

export function shuffle(array: any) {
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

export function findFdbUsingIp(ip: string, fdbList: AccessFDB[]) {
  return fdbList.find((fdb: AccessFDB) => {
    return fdb.getIp() === ip;
  });
}

/**
 * Creates replicas of a given file
 * and will inform the user if it is unable to
 * insert any files
 */
export async function createReplicas(
  socket: any,
  fdbList: AccessFDB[],
  replicasToMake: number,
  docId: string,
  fileName: string,
  fileContents: string,
  fileHash: string,
  fileType: string,
  timeStamp: number,
  requestId: string,
  fdbsToAvoid: AccessFDB[] = [],
) {
  // Filter out fdbs that you need to avoid
  let fdbs = deepCopyFunc(fdbList);
  fdbs = fdbs.filter((fdb: AccessFDB) => {
    const toAvoid = fdbsToAvoid.find((fdbToAvoid: AccessFDB) => {
      return fdbToAvoid.getIp() === fdb.getIp();
    });

    if (toAvoid == undefined) {
      return true;
    }
    return false;
  });

  const successfulInserts: AccessFDB[] = [];
  shuffle(fdbs);
  for (let i = 0; i < replicasToMake; i++) {
    // Avoid Index out of bounds
    if (i >= fdbs.length) {
      break;
    }

    const fdbRef = fdbList[i];

    await fdbRef.insertFile(docId, fileName, fileContents, fileHash, fileType, timeStamp).then(
      function(resp: any) {
        successfulInserts.push(fdbRef);
      },
      function(err: any) {
        LOGGER.debug('Unable to insert file into FDB');
      },
    );
  }

  if (successfulInserts.length <= 0) {
    socket.emit(SERVER_RESP, {
      requestId,
      status: FAILED,
      message: 'No successful inserts into FDBs',
    });
    LOGGER.debug('No successful inserts into FDBs');
    return;
  }

  socket.emit(SERVER_RESP, {
    requestId,
    status: SUCCESS,
    message: `Successful inserts into ${successfulInserts.map((elem) => elem.getIp())}`,
  });

  for (let i = 0; i < successfulInserts.length; i++) {
    await addFdbLocation(docId, successfulInserts[i].getIp());
  }
}

/**
 * Returns a list of FDB locations for a given document ID
 * from the MCDB
 *
 * return example: [34.70.206.197, 35.184.8.156] or false
 */
export async function retrieveFdbLocations(
  socket: any,
  docId: string,
  requestId: string,
): Promise<any[]> {
  let docData = null;
  await getFile(docId)
    .then((doc) => {
      if (!doc.exists) {
        socket.emit(SERVER_RESP, {
          requestId,
          SUCCESS: FAILED,
          message: 'This document does not exist',
        });
      } else {
        docData = doc.data();
      }
    })
    .catch((err) => {
      socket.emit(SERVER_RESP, {
        requestId,
        SUCCESS: FAILED,
        message: `Error getting document: ${err}`,
      });
    });

  if (docData === null) {
    return [];
  }

  return docData['fdbLocations'];
}

/**
 * This function returns the number of replicas needed to
 * ensure the system will have the required amount of
 * fault tolerance.
 *
 * return example: [34.70.206.197, 35.184.8.156] or false
 */
export function replicasNeeded(fdbList: AccessFDB[]): number {
  return Math.floor(fdbList.length / 3 + 1);
}

/**
 * This function sends an ERROR message to the socket passed
 * to it
 */
export function sendErrorMessage(socket: any, requestId: string, message: any) {
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
export function sendSuccessMessage(socket: any, requestId: string, message: any) {
  socket.emit(SERVER_RESP, {
    requestId: requestId,
    status: SUCCESS,
    message: message,
  });
}

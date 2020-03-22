import { AccessFDB } from './workerToFDBConnection';
import { LOGGER } from '../Logger';
import { addFdbLocation, getFile } from '../MCDB';

const SERVER_RESP = 'Server Response';

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
  for (let i = 0; i < fdbList.length; i++) {
    if (fdbList[i].getIp() === ip) {
      return fdbList[i];
    }
  }

  return false;
}

/**
 * Creates n / (3 + 1) replicas of a given file
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
) {
  const successfulInserts: string[] = [];
  shuffle(fdbList);
  for (let i = 0; i < replicasToMake; i++) {
    const fdbRef = fdbList[i];
    await fdbRef.insertFile(docId, fileName, fileContents, fileHash, fileType, timeStamp).then(
      function(resp: any) {
        successfulInserts.push(fdbRef.getIp());
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
}

/**
 * Returns a list of FDB locations for a given document ID
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
    return [];
  }

  const fileLocations = docData['fdbLocations'];

  return fileLocations;
}

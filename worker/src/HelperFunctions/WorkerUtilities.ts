import { AccessFDB } from './workerToFDBConnection';
import { LOGGER } from '../Logger';
import { addFdbLocation, getFile } from '../MCDB';

/**
 *  Shuffle an array of objects
 */
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

/**
 *  Finds the fdb object instance inside of the AccessFdb list using
 *  a given IP address
 */
export function findFdbUsingIp(ip: string, fdbList: AccessFDB[]) {
  return fdbList.find((fdb: AccessFDB) => {
    return fdb.getIp() === ip;
  });
}

/**
 * Creates replicas of a given file
 * and will inform the user if it is unable to
 * insert any files
 *
 * @param fdbList - List of all FDBs that are available in the system
 * @param replicasToMake - Number of FDBs to insert this file into
 * @param docId - Unique identifier for this file given by Firebase
 * @param fileName - Name of the file
 * @param fileContents - File binary
 * @param fileHash - SHA-256 hash
 * @param fileType - Content type of file
 * @param ownerId - Id of the user who is creating this file
 * @param timeStamp - Epoch time for when this file was created
 * @param fdbsToAvoid - If there are any FDBs that this file should not be inserted to, add them here
 *
 * @returns AccessFDB[] - A list of FDBs where this file was successfully inserted into
 */
export async function createReplicas(
  fdbList: AccessFDB[],
  replicasToMake: number,
  docId: string,
  fileName: string,
  fileContents: string,
  fileHash: string,
  fileType: string,
  ownerId: string,
  timeStamp: number,
  fdbsToAvoid: AccessFDB[] = [],
) {
  // Filter out fdbs that you need to avoid
  let fdbs = [...fdbList];
  fdbs = fdbs.filter((fdb: AccessFDB) => {
    const toAvoid = fdbsToAvoid.find((fdbToAvoid: AccessFDB) => {
      return fdbToAvoid.getIp() === fdb.getIp();
    });

    return toAvoid === undefined;
  });

  const successfulInserts: AccessFDB[] = [];
  shuffle(fdbs);
  for (let i = 0; i < replicasToMake; i++) {
    // Avoid Index out of bounds
    if (i >= fdbs.length) {
      break;
    }

    const fdbRef = fdbs[i];

    await fdbRef
      .insertFile(docId, fileName, fileContents, fileHash, fileType, ownerId, timeStamp)
      .then(
        function(resp: any) {
          successfulInserts.push(fdbRef);
        },
        function(err: any) {
          LOGGER.debug('Unable to insert file into FDB');
        },
      );
  }

  for (let i = 0; i < successfulInserts.length; i++) {
    await addFdbLocation(docId, successfulInserts[i].getIp());
  }

  return successfulInserts;
}

/**
 * Returns a list of FDB locations for a given document ID
 * from the MCDB
 *
 * @returns [34.70.206.197, 35.184.8.156] or []
 */
export async function retrieveFdbLocations(docId: string): Promise<any[]> {
  let docData = null;
  await getFile(docId)
    .then((doc) => {
      docData = doc.data();
    })
    .catch((err) => {
      console.error(err);
    });

  if (!docData) {
    return [];
  }

  return docData['fdbLocations'];
}

/**
 * This function returns the number of replicas needed to
 * ensure the system will have the required amount of
 * fault tolerance.
 *
 * @returns [34.70.206.197, 35.184.8.156] or false
 */
export function replicasNeeded(fdbList: AccessFDB[]): number {
  return Math.ceil(fdbList.length / 3) + 1;
}

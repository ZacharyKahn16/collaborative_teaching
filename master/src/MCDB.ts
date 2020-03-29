import * as fs from './Firebase';
import admin from 'firebase-admin';
import { getDb } from './Firebase';
import { LOGGER } from './Logger';

// Collection constants
const FILE_COLLECTION = 'File';
const CLIENT_COLLECTION = 'Client';
const COURSE_COLLECTION = 'Course';

// fileId created by firestore.
export function insertedFile(
  timestamp: number,
  fdbLocations: string[],
  courseIds: string[],
  readOnlyUserIds: string[],
  fileName: string,
  fileHash: string,
  ownerId: string,
) {
  return fs.addToCollection(FILE_COLLECTION, {
    lastUpdated: timestamp,
    fdbLocations: fdbLocations,
    courseIds: courseIds,
    readOnlyUserIDs: readOnlyUserIds,
    name: fileName,
    fileHash: fileHash,
    ownerId: ownerId,
  });
}

// Insert new doc with specified fileId.
export function insertFileWithSpecifiedFileId(
  fileId: string,
  timestamp: number,
  fdbLocations: string[],
  courseIds: string[],
  readOnlyUserIds: string[],
  fileName: string,
  fileHash: string,
  ownerId: string,
) {
  return fs.setDocument(FILE_COLLECTION, fileId, {
    docId: fileId,
    lastUpdated: timestamp,
    fdbLocations: fdbLocations,
    courseIds: courseIds,
    readOnlyUserIDs: readOnlyUserIds,
    name: fileName,
    fileHash: fileHash,
    ownerId: ownerId,
  });
}

// Update file
export function updateFile(
  fileId: string,
  timestamp: number,
  fdbLocations: string[],
  fileName: string,
  fileHash: string,
  ownerId: string,
) {
  LOGGER.debug('Update Doc', fileId, timestamp, fdbLocations, fileName, fileHash, ownerId);
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    lastUpdated: timestamp,
    fdbLocations: fdbLocations,
    name: fileName,
    fileHash: fileHash,
    ownerId: ownerId,
  });
}

// Delete file
export function deleteFile(fileId: string) {
  return fs.deleteDocument(FILE_COLLECTION, fileId);
}

// Change file name
export function changeFileName(fileId: string, fileName: string) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    name: fileName,
  });
}

// Add fdbs to fbdLocations list
export function addFdbLocation(fileId: string, fdb: string) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    fdbLocations: admin.firestore.FieldValue.arrayUnion(fdb),
  });
}

// Remove fdbs from fbdLocations list
export function removeFdbLocation(fileId: string, fdb: string) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    fdbLocations: admin.firestore.FieldValue.arrayRemove(fdb),
  });
}

// Clear fbdLocations list
export function clearFdbLocationsList(fileId: string) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    fdbLocations: [],
  });
}

// Add course ID to file.
export function addCourseIdToFile(fileId: string, courseId: string) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    courseIds: admin.firestore.FieldValue.arrayUnion(courseId),
  });
}

// Delete course ID from file.
export function deleteCourseIdFromFile(fileId: string, courseId: string) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    courseIds: admin.firestore.FieldValue.arrayRemove(courseId),
  });
}

// Add readOnly ID to file.
export function addReadOnlyId(fileId: string, readOnlyId: string) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    readOnlyUserIDs: admin.firestore.FieldValue.arrayUnion(readOnlyId),
  });
}

// Delete readOnly ID from file.
export function deleteReadOnlyId(fileId: string, readOnlyId: string) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    readOnlyUserIDs: admin.firestore.FieldValue.arrayRemove(readOnlyId),
  });
}

// Get all files from the files collection
export async function getAllFiles() {
  const fileCollection = await fs.getCollection(FILE_COLLECTION);
  const clientCollection = await fs.getCollection(CLIENT_COLLECTION);

  const clientMap: any = {};

  for (const client of clientCollection.docs) {
    clientMap[client.id] = client.data();
  }

  return fileCollection.docs.map((doc: any) => {
    const data = doc.data();
    const owner = clientMap[data.ownerId];

    return {
      ...data,
      ownerName: owner ? owner.name : '',
    };
  });
}

// Get all files, used by MC
// returns: [{docId, docData}]
// Refer to: https://firebase.google.com/docs/reference/js/firebase.firestore.QuerySnapshot#docs
export function getAllFilesForMC() {
  return fs.getCollection(FILE_COLLECTION).then((snapshot) => {
    return snapshot.docs;
  });
}

// Get all files by ownerId
// returns [{docId, docData}]
export function getAllFilesForOwner(ownerId: string) {
  return fs.getCollection(FILE_COLLECTION).then((snapshot) => {
    return snapshot.docs.filter((doc) => doc.data().ownerId === ownerId);
  });
}

// ClientId created by firestore.
// filesOwned = [] when creating course because we need to get a file's id before
// we can add it to the filesOwned list.
export function createNewClient(clientName: string, ipAddr: string, port: number) {
  return fs.addToCollection(CLIENT_COLLECTION, {
    clientName: clientName,
    ipAddr: ipAddr,
    port: port,
    filesOwned: [],
  });
}

// Add to filesOwned list.
export function addNewOwnedFile(ownerId: string, fileId: string) {
  return fs.updateDocument(CLIENT_COLLECTION, ownerId, {
    filesOwned: admin.firestore.FieldValue.arrayUnion(fileId),
  });
}

// Remove from filesOwned list.
export function removeOwnedFile(ownerId: string, fileId: string) {
  return fs.updateDocument(CLIENT_COLLECTION, ownerId, {
    filesOwned: admin.firestore.FieldValue.arrayRemove(fileId),
  });
}

// Get all clients
// returns: [{clientId, clientName}]
export function getAllClients() {
  return fs.getCollection(CLIENT_COLLECTION).then((snapshot) => {
    return snapshot.forEach((doc) => {
      return { clientId: doc.id, fileName: doc.data().clientName };
    });
  });
}

// CourseId created by firestore.
export function createNewCourse(courseName: string, ownerId: string) {
  return fs.addToCollection(COURSE_COLLECTION, {
    courseName: courseName,
    ownerId: ownerId,
    filesInCourse: [],
  });
}

// Add to filesOwned list.
export function addFileToCourse(courseId: string, fileId: string) {
  return fs.updateDocument(COURSE_COLLECTION, courseId, {
    filesInCourse: admin.firestore.FieldValue.arrayUnion(fileId),
  });
}

// Remove from filesOwned list.
export function removeFileFromCourse(courseId: string, fileId: string) {
  return fs.updateDocument(COURSE_COLLECTION, courseId, {
    filesInCourse: admin.firestore.FieldValue.arrayRemove(fileId),
  });
}

// Change course name.
export function changeCourseName(courseId: string, newName: string) {
  return fs.updateDocument(COURSE_COLLECTION, courseId, {
    courseName: newName,
  });
}

// Change course course description.
export function changeCourseDescription(courseId: string, newDescription: string) {
  return fs.updateDocument(COURSE_COLLECTION, courseId, {
    courseDescription: newDescription,
  });
}

// Get all courses
// returns: [{courseId, courseName}]
export function getAllCourses() {
  return fs.getCollection(COURSE_COLLECTION).then((snapshot) => {
    return snapshot.forEach((doc) => {
      return { courseId: doc.id, fileName: doc.data().courseName };
    });
  });
}

export async function getFile(docId: string) {
  return fs.getDocument(FILE_COLLECTION, docId);
}

export function setClient(client: any) {
  getDb()
    .collection(CLIENT_COLLECTION)
    .doc(client.uid)
    .set(client, { merge: true })
    .then();
}

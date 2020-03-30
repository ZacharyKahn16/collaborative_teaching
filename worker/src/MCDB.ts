import * as fs from './Firebase';
import admin from 'firebase-admin';
import { getDb } from './Firebase';

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
export function updateFile(fileId: string, document: any) {
  return fs.updateDocument(FILE_COLLECTION, fileId, document);
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
export function removeCourseIdFromFile(fileId: string, courseId: string) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    courseIds: admin.firestore.FieldValue.arrayRemove(courseId),
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

// CourseId created by firestore.
export function createNewCourse(courseName: string, courseDesc: string, ownerId: string) {
  return fs.addToCollection(COURSE_COLLECTION, {
    courseName,
    courseDesc,
    ownerId,
    filesInCourse: [],
  });
}

export function updateCourse(courseId: string, courseName: string, courseDesc: string) {
  return fs.updateDocument(COURSE_COLLECTION, courseId, {
    courseName,
    courseDesc,
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

// Get all courses
export async function getAllCourses() {
  const courseCollection = await fs.getCollection(COURSE_COLLECTION);
  const clientCollection = await fs.getCollection(CLIENT_COLLECTION);

  const clientMap: any = {};

  for (const client of clientCollection.docs) {
    clientMap[client.id] = client.data();
  }

  return courseCollection.docs.map((doc: any) => {
    const data = doc.data();
    const owner = clientMap[data.ownerId];

    return {
      ...data,
      ownerName: owner ? owner.name : '',
    };
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

export async function verifyClientExists(clientId: string): Promise<boolean> {
  return fs.getDocument(CLIENT_COLLECTION, clientId).then((doc) => {
    return doc.exists && doc.data() !== undefined;
  });
}

export async function verifyCourseExists(courseId: string): Promise<boolean> {
  return fs.getDocument(COURSE_COLLECTION, courseId).then((doc) => {
    return doc.exists && doc.data() !== undefined;
  });
}

export async function verifyFileExists(fileId: string): Promise<boolean> {
  return fs.getDocument(FILE_COLLECTION, fileId).then((doc) => {
    return doc.exists && doc.data() !== undefined;
  });
}

export async function verifyOwner(fileId: string, ownerId: string): Promise<boolean> {
  return fs.getDocument(FILE_COLLECTION, fileId).then((doc) => {
    const docData = doc.data();
    return docData != undefined && docData['ownerId'] === ownerId;
  });
}

export function getCourse(courseId: string) {
  return fs.getDocument(COURSE_COLLECTION, courseId).then((doc) => {
    return doc.data();
  });
}

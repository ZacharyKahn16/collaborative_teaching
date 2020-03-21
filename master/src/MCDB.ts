// Schema for MCDB and list of common queries.
import * as fs from './Firebase';
import admin from 'firebase-admin';

const FILE_COLLECTION = 'File';
const CLIENT_COLLECTION = 'Client';
const COURSE_COLLECTION = 'Course';

// docId created by firestore and added as an attribute
export function insertedFile(
  timestamp: number,
  fdbLocations: string[],
  courseIds: string[],
  readOnlyUserIDs: string[],
  fileName: string,
  fileHash: string,
  ownerId: number,
) {
  return fs.addToCollection(FILE_COLLECTION, {
    fileCreationTime: timestamp,
    fdbLocations: fdbLocations,
    courseIds: courseIds,
    readOnlyUserIDs: readOnlyUserIDs,
    fileName: fileName,
    fileHash: fileHash,
    ownerId: ownerId,
  });
}

// Update file
export function updateFile(docId: string, timestamp: number, fileHash: string) {
  return fs.updateDocument(FILE_COLLECTION, docId, {
    fileCreationTime: timestamp,
    fileHash: fileHash,
  });
}

// Delete file
export function deleteFile(docId: string) {
  return fs.deleteDocument(FILE_COLLECTION, docId);
}

// Change file name
export function changeFileName(docId: string, fileName: string) {
  return fs.updateDocument(FILE_COLLECTION, docId, {
    fileName: fileName,
  });
}

// Get all files
// returns: [{docId, fileName}]
export function getAllFiles() {
  return fs.getCollection(FILE_COLLECTION).then((snapshot) => {
    return snapshot.forEach((doc) => {
      return { docId: doc.id, fileName: doc.data().fileName };
    });
  });
}

// Add fdbs to fbdLocations list
export function addFdbLocations(docId: string, fdbs: string[]) {
  return fs.updateDocument(FILE_COLLECTION, docId, {
    fdbLocations: admin.firestore.FieldValue.arrayUnion(fdbs),
  });
}

// Remove fdbs from fbdLocations list
export function removeFdbLocations(docId: string, fdbs: string[]) {
  return fs.updateDocument(FILE_COLLECTION, docId, {
    fdbLocations: admin.firestore.FieldValue.arrayRemove(fdbs),
  });
}

// Clear fbdLocations list
export function clearFdbLocationsList(docId: string) {
  return fs.updateDocument(FILE_COLLECTION, docId, {
    fdbLocations: [],
  });
}

// Add course ID to file.
export function addCourseIdToFile(docId: string, courseId: number) {
  return fs.updateDocument(FILE_COLLECTION, docId, {
    courseIds: admin.firestore.FieldValue.arrayUnion(courseId),
  });
}

// Delete course ID from file.
export function deleteCourseIdFromFile(docId: string, courseId: number) {
  return fs.updateDocument(FILE_COLLECTION, docId, {
    courseIds: admin.firestore.FieldValue.arrayRemove(courseId),
  });
}

// Add readOnly ID to file.
export function addReadOnlyId(docId: string, readOnlyId: number) {
  return fs.updateDocument(FILE_COLLECTION, docId, {
    readOnlyUserIDs: admin.firestore.FieldValue.arrayUnion(readOnlyId),
  });
}

// Delete readOnly ID from file.
export function deleteReadOnlyId(docId: string, readOnlyId: number) {
  return fs.updateDocument(FILE_COLLECTION, docId, {
    readOnlyUserIDs: admin.firestore.FieldValue.arrayRemove(readOnlyId),
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
export function addNewOwnedFile(ownerId: number, docId: string) {
  return fs.updateDocument(CLIENT_COLLECTION, ownerId, {
    filesOwned: admin.firestore.FieldValue.arrayUnion(docId),
  });
}

// Remove from filesOwned list.
export function removeOwnedFile(ownerId: number, docId: string) {
  return fs.updateDocument(CLIENT_COLLECTION, ownerId, {
    filesOwned: admin.firestore.FieldValue.arrayRemove(docId),
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
export function createNewCourse(courseName: string, ownerId: number, courseDescription: string) {
  return fs.addToCollection(COURSE_COLLECTION, {
    courseName: courseName,
    ownerId: ownerId,
    filesInCourse: [],
    courseDescription: courseDescription,
  });
}

// Add to filesOwned list.
export function addFileToCourse(courseId: number, docId: string) {
  return fs.updateDocument(COURSE_COLLECTION, courseId, {
    filesInCourse: admin.firestore.FieldValue.arrayUnion(docId),
  });
}

// Remove from filesOwned list.
export function removeFileFromCourse(courseId: number, docId: string) {
  return fs.updateDocument(COURSE_COLLECTION, courseId, {
    filesInCourse: admin.firestore.FieldValue.arrayRemove(docId),
  });
}

// Change course name.
export function changeCourseName(courseId: number, newName: string) {
  return fs.updateDocument(COURSE_COLLECTION, courseId, {
    courseName: newName,
  });
}

// Change course course description.
export function changeCourseDescription(courseId: number, newDescription: string) {
  return fs.updateDocument(COURSE_COLLECTION, courseId, {
    courseDescription: newDescription,
  });
}

// Get all courses
// returns: [{courseId, courseName}]
export function getAllFiles() {
  return fs.getCollection(COURSE_COLLECTION).then((snapshot) => {
    return snapshot.forEach((doc) => {
      return { courseId: doc.id, fileName: doc.data().courseName };
    });
  });
}

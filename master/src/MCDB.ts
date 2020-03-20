// import { addToCollection } from './Firebase';
// TODO: ask if this imports things correctly.
import fs from './Firebase';
import admin from 'firebase-admin';

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
  ownerId: number,
) {
  return fs.addToCollection(FILE_COLLECTION, {
    // Is there a reason timestamp didn't have a key before?
    fileCreationTime: timestamp,
    FdbLocations: fdbLocations,
    CourseIds: courseIds,
    ReadOnlyUserIDs: readOnlyUserIds,
    Name: fileName,
    fileHash: fileHash,
    ownerId: ownerId,
  });
}

// Update file
export function updateFile(fileId: number, timestamp: number, fileHash: string) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    fileCreationTime: timestamp,
    fileHash: fileHash,
  });
}

// Delete file
export function deleteFile(fileId: number) {
  return fs.deleteDocument(FILE_COLLECTION, fileId);
}

// Change file name
export function changeFileName(fileId: number, fileName: string) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    Name: fileName,
  });
}

// Add fdbs to fbdLocations list
// TODO: test if this properly adds array to current array.
export function addFdbLocations(fileId: number, fdbs: string[]) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    FdbLocations: admin.firestore.FieldValue.arrayUnion(fdbs),
  });
}

// Remove fdbs from fbdLocations list
// TODO: test if this properly deletes array from current array.
export function removeFdbLocations(fileId: number, fdbs: string[]) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    FdbLocations: admin.firestore.FieldValue.arrayRemove(fdbs),
  });
}

// Clear fbdLocations list
export function clearFdbLocationsList(fileId: number) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    FdbLocations: [],
  });
}

// Add course ID to file.
export function addCourseIdToFile(fileId: number, courseId: number) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    CourseIds: admin.firestore.FieldValue.arrayUnion(courseId),
  });
}

// Delete course ID from file.
export function deleteCourseIdFromFile(fileId: number, courseId: number) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    CourseIds: admin.firestore.FieldValue.arrayRemove(courseId),
  });
}

// Add readOnly ID to file.
export function addReadOnlyId(fileId: number, readOnlyId: number) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    ReadOnlyUserIDs: admin.firestore.FieldValue.arrayUnion(readOnlyId),
  });
}

// Delete readOnly ID from file.
export function deleteReadOnlyId(fileId: number, readOnlyId: number) {
  return fs.updateDocument(FILE_COLLECTION, fileId, {
    ReadOnlyUserIDs: admin.firestore.FieldValue.arrayRemove(readOnlyId),
  });
}

// ClientId created by firestore.
// TODO: Any other data we need here?
// TODO: Do we need IP and port?
// TODO: Should we add coursesOwned attribute?
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
export function addNewOwnedFile(ownerId: number, fileId: number) {
  return fs.updateDocument(CLIENT_COLLECTION, ownerId, {
    filesOwned: admin.firestore.FieldValue.arrayUnion(fileId),
  });
}

// Remove from filesOwned list.
export function removeOwnedFile(ownerId: number, fileId: number) {
  return fs.updateDocument(CLIENT_COLLECTION, ownerId, {
    filesOwned: admin.firestore.FieldValue.arrayRemove(fileId),
  });
}

// CourseId created by firestore.
export function createNewCourse(courseName: string, ownerId: number) {
  return fs.addToCollection(COURSE_COLLECTION, {
    courseName: courseName,
    ownerId: ownerId,
    filesInCourse: [],
  });
}

// Add to filesOwned list.
export function addFileToCourse(courseId: number, fileId: number) {
  return fs.updateDocument(COURSE_COLLECTION, courseId, {
    filesInCourse: admin.firestore.FieldValue.arrayUnion(fileId),
  });
}

// Remove from filesOwned list.
export function removeFileFromCourse(courseId: number, fileId: number) {
  return fs.updateDocument(COURSE_COLLECTION, courseId, {
    filesInCourse: admin.firestore.FieldValue.arrayRemove(fileId),
  });
}

// Change course name.
export function changeCourseName(courseId: number, newName: string) {
  return fs.updateDocument(COURSE_COLLECTION, courseId, {
    courseName: newName,
  });
}

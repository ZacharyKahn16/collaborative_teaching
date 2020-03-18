import { addToCollection } from './Firebase';

const FILE_COLLECTION = 'File';

export function insertedFile(
  timestamp: number,
  fdbLocations: string[],
  courseIds: string[],
  readOnlyUserIds: string[],
  fileName: string,
) {
  return addToCollection(FILE_COLLECTION, {
    timestamp,
    FdbLocations: fdbLocations,
    CourseIds: courseIds,
    ReadOnlyUserIDs: readOnlyUserIds,
    Name: fileName,
  });
}

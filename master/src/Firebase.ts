import admin from 'firebase-admin';

/**
 * Initializes Firebase instance
 */
const firebase: admin.app.App = admin.initializeApp({
  credential: admin.credential.cert({
    // @ts-ignore
    type: 'service_account',
    project_id: 'collaborative-teaching',
    private_key_id: 'f77c1398fb3e145d6dda5d02df7d78329f1345ab',
    private_key:
      '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwCW24OdbFx14k\nb8Fzb9vLsU9e/6LJwZmJUHcWB1rWrLYBmtXkMtAutuBtp1cUJii2TiLhe0Q5nL0H\nlcyouCzxqCJbcDCorAUCpocrsAwhokM4FBkomp5OlAo58+g6RiIIR0IksPBi00j5\nu5vNxsGQm6ZIRYk6fZeYNUyFS0at5xylD6WnRWUJz1BhlFghoSYx48AKQYJbJO7L\n20NUPIKz1eFP0IpV01ffzuyluiPx29gBeC+dQQ+CN2rTu/NP+lbR+TNhshqg4f32\n4wlTqp+rpiFdAP3oQ4PeHSbw1/h4c1r+vgSHRr8I9sRcvbWSTUC0wzcbpTT7Fvlp\np9yqQPvZAgMBAAECggEABpBeo3s6O22BYKY8IxcW+oO17z3+YdVStmO/zpxfZXIG\nM8DqwqB0a8sZsW0HQOYu9KR50q+Oesyreo0G4+NBZcQvsWCMp+8JUGQWPGl+Yk8T\nGfqB36Y4SrsxagZivX2Gk+/YRj1eXhXKLemyPkK8tMaUNWcTKveqf4K8dwHrp9zo\nIV+sB3zf1zJUTzkg+GSbqkx7Jebengas5odEE0HUvUCKIYG6fa4nVnJWl27FrqKX\ngcMExl0scWd2IYPq+abVALpStoIlyxiOlR+CvAMCD/a8l9cp5RN1w3X5JI6H6mhn\nNbctbyFw9WbIA+nddatmk7WSrsJja1X+syaobgtYswKBgQDWd/pyVdwLMMrsMl6t\nv335AIAIZoQ/7iZHyFyTGpMownQRoO9n0Pb0V+jFPWODCeoFiX8tGgVwzEsXuwSQ\nxnFNZhjqvIeQpNnfKP40xtlxZ5PO2tJcVKMWeCXZjtMEEUaUwoirUFMyjUesvtWW\neWDNLyU/tTwVUXn3VT8fqzFP2wKBgQDSID01Kn48qjQTu/3Rsnq/xXDZZ8CZaxFk\nGoOUi6KK2KPieNlR7pxQ8lDg6wzbBpGF6l32X3PanUB8BJZFgvyyGS0u5w2oHoCw\nnuOemMQD5M29sKW6aTGGbv4PEalNxN6Z6N0CprtjdHjrZgUPC2yhNNT/S6XQGxug\nddbvuyCbWwKBgQCBI4FUc0qqGlk13CaSbGnIE3sEk+YyMI4wTv8fPLM7qcsGCmfd\nlT/+ZSiuC4buEnwtlVtUpwR7pSfaRCw9mKAEwONkBN2ERR9DdoWK9elclce0mKJu\nIjCJiRMRayS4oEZlsLVmollWaSetZsNpdfDJ3AeL0u84zvSn71axFP3+XQKBgEO7\nOp+Zm+loH7NAxLdEZcbNGOwrQmzxk0CGP2WxgOpqnKESvVJorKB3C1UEzzcGrf/R\npQoWiJyuVavkOqAbceLitKrKtZ88fdTw0oQ7z+tFZIBBoZot8FXaDzDCS6WS0QIh\niqQhJIQRdizCzNylnRV1lzbXppInOseFVIwf8InDAoGAMDilrA2xsqfV1LM8KuRi\nKuKFMp3q8niXMbptCByQVnB0vWK7caXGFmwkgCj5ALAY2X/yWyJ0nEFUTWcExbS/\n60ei7vBfspCC/5BX4gXZw36d3+JxeTUAUmQKWv8nHfHS5vp3MLHf3OC5fKy4h6pI\n7h7EvcxhDqts0+gNIk0Hsho=\n-----END PRIVATE KEY-----\n',
    client_email: 'firebase-adminsdk-lmtzl@collaborative-teaching.iam.gserviceaccount.com',
    client_id: '108134456370142655586',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url:
      'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-lmtzl%40collaborative-teaching.iam.gserviceaccount.com',
  }),
});

/**
 * Returns the Firestore DB instance
 * @returns {FirebaseFirestore.Firestore}
 */
export function getDb() {
  return firebase.firestore();
}

/**** Abstracted Helper Functions ****/

/**
 * Gets all documents in a collection
 * @param collection - Name of the collection for which we are returning all documents
 * @returns Promise - A promise of the collection's snapshot
 */
export function getCollection(collection: string): Promise<FirebaseFirestore.QuerySnapshot> {
  return getDb()
    .collection(collection)
    .get();
}

/**
 * Queries the database for the provided path based on the id
 * @param { string } collection Path to retrieve the data from
 * @param { string } id ID of what you want to retrieve
 * @returns The snapshot of the document if it finds any
 */
export function getDocument(
  collection: string,
  id: string,
): Promise<FirebaseFirestore.DocumentSnapshot> {
  return getDb()
    .collection(collection)
    .doc(id)
    .get();
}

/**
 * Add a document into specified collection
 * @param { string } collection to add the document to
 * @param document to add to the collection
 * @returns Promise returned by the firestore
 */
export function addToCollection(
  collection: string,
  document: any,
): Promise<FirebaseFirestore.DocumentReference> {
  return getDb()
    .collection(collection)
    .add(document);
}

/**
 * Generic function that inserts a documentID into the database with a specified ID
 * @param { string } collection Collection to add the data to
 * @param { string } documentID ID of the document to add to the collection
 * @param document that is being added as a document to he collection
 * @returns Promise returned by the firestore write result
 */
export function setDocument(
  collection: string,
  documentID: string,
  document: any,
): Promise<FirebaseFirestore.WriteResult> {
  return getDb()
    .collection(collection)
    .doc(documentID)
    .set(document);
}

/**
 * This method is used to update a specific document in the Firebase Firestore db
 * @param collection - The name of the collection where the document to-be-updated is stored
 * @param documentID - The ID of the document being accessed
 * @param document - The data to be updated
 * @returns Promise - Returns a promise that the data will be updated in the specified document
 */
export function updateDocument(
  collection: string,
  documentID: string,
  document: any,
): Promise<FirebaseFirestore.WriteResult> {
  return getDb()
    .collection(collection)
    .doc(documentID)
    .update(document);
}

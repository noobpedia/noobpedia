import admin from "firebase-admin";
import {
  DocumentSnapshot,
  FirestoreError,
  Transaction,
} from "@firebase/firestore-types";
const testing = require("@firebase/testing");

let firestore: any;

if (process.env.NODE_ENV !== "development") {
  try {
    admin.initializeApp({
      // credential: admin.credential.cert({
      //   projectId: process.env.FIREBASE_PROJECT_ID,
      //   privateKey: process.env.FIREBASE_PRIVATE_KEY,
      //   clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // }),
      credential: admin.credential.applicationDefault(),
      databaseURL: "https://noobpedia-3939f.firebaseio.com",
    });
  } catch (error) {
    /*
     * We skip the "already exists" message which is
     * not an actual error when we're hot-reloading.
     */
    if (!/already exists/u.test(error.message)) {
      // eslint-disable-next-line no-console
      console.error("Firebase admin initialization error", error.stack);
    }
  }
  firestore = admin.firestore();
} else {
  firestore = testing
    .initializeTestApp({ projectId: "noobpedia-3939f" })
    .firestore();
}

export default firestore;

export async function getOrInitResourceLikes(
  resourceName: string
): Promise<number> {
  let likeCount = 0;
  await firestore
    .collection("resources")
    .doc(resourceName)
    .get()
    .then((doc: DocumentSnapshot) => {
      if (doc.exists) {
        likeCount = doc.data()?.likes;
      } else {
        doc.ref.set({
          name: resourceName,
          likes: 0,
        });
      }
    })
    .catch((error: FirestoreError) => {
      return 0;
    });
  return likeCount;
}

export async function bumpResourceLike(resourceName: string): Promise<boolean> {
  try {
    const resourceRef = firestore.collection("resources").doc(resourceName);
    await firestore.runTransaction(async (t: Transaction) => {
      const resource: DocumentSnapshot = await t.get(resourceRef);
      const newLikes = resource.data()?.likes + 1;
      t.update(resourceRef, { likes: newLikes });
    });
    return true;
  } catch (e) {
    console.log("failed to bump like for resource " + resourceName, e);
    return false;
  }
}

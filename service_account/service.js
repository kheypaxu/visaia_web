const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function getFullDocumentData(docRef) {
  const docSnapshot = await docRef.get();
  const data = docSnapshot.data();
  const result = { id: docSnapshot.id, ...data };

  // Get all subcollections for this specific document
  const subcollections = await docRef.listCollections();
  
  for (const sub of subcollections) {
    const subSnapshot = await sub.get();
    // Recursively fetch data for each document in the subcollection
    result[sub.id] = await Promise.all(
      subSnapshot.docs.map(subDoc => getFullDocumentData(subDoc.ref))
    );
  }

  return result;
}

async function exportFullCollection(collectionName) {
  console.log(`Starting deep export of: ${collectionName}...`);
  const mainCollection = db.collection(collectionName);
  const snapshot = await mainCollection.get();

  const fullData = await Promise.all(
    snapshot.docs.map(doc => getFullDocumentData(doc.ref))
  );

  fs.writeFileSync(`${collectionName}_deep_export.json`, JSON.stringify(fullData, null, 2));
  console.log('Done! Deep export saved.');
}

exportFullCollection('cycles');
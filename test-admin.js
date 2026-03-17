const admin = require('firebase-admin');
require('dotenv').config();

try {
  const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^"(.*)"$/, '$1'),
  };

  console.log('Project ID:', serviceAccount.projectId);
  console.log('Client Email:', serviceAccount.clientEmail);
  console.log('Private Key Start:', serviceAccount.privateKey?.substring(0, 50));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();
  db.collection('test').get()
    .then(() => {
      console.log('Admin SDK Test Success!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Admin SDK Test Failed:', err.message);
      process.exit(1);
    });
} catch (err) {
  console.error('Initialization Error:', err.message);
  process.exit(1);
}

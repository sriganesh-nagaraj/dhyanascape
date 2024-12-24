import * as firebaseAdmin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { logger } from 'firebase-functions/v2'

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.applicationDefault(),
  storageBucket: process.env.DHYANASCAPE_BUCKET_NAME,
})

const firestoreDb = getFirestore()

const storage = getStorage()

const firebaseMessaging = firebaseAdmin.messaging()

export { firebaseAdmin, firebaseMessaging, firestoreDb, logger, storage }

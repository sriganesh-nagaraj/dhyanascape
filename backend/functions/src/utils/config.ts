import * as firebaseAdmin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v2'

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.applicationDefault(),
})

const firestoreDb = getFirestore()

const firebaseMessaging = firebaseAdmin.messaging()

export { firebaseAdmin, firebaseMessaging, firestoreDb, logger }

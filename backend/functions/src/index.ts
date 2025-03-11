import { setGlobalOptions } from 'firebase-functions/v2'
import { onRequest } from 'firebase-functions/v2/https'
import 'source-map-support/register'
import { app } from './app'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { Meditation } from './models'
import { processMeditation } from './controllers/meditationsController'


setGlobalOptions({ region: 'asia-south1' })

export const api = onRequest(
  {
    minInstances: 0,
    maxInstances: 10,
    region: 'asia-south1',
    memory: '512MiB',
  },
  app
)

exports.handleNewMeditationCreation = onDocumentCreated(
  {
    document: 'meditations/{meditationId}',
    memory: '512MiB',
  },
  async (event) => {
    const meditation = event.data?.data() as Meditation
    await processMeditation(meditation)
  }
)

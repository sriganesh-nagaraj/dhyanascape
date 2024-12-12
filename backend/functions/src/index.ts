import { setGlobalOptions } from 'firebase-functions/v2'
import { onRequest } from 'firebase-functions/v2/https'
import 'source-map-support/register'
import { app } from './app'

setGlobalOptions({ region: 'asia-south1' })

export const api = onRequest(
  {
    minInstances: 0,
    maxInstances: 50,
    region: 'asia-south1',
    memory: '512MiB',
  },
  app
)

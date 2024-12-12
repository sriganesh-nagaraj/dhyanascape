import * as cors from 'cors'
import * as express from 'express'
import { meditationsController } from './controllers/meditationsController'
import { errorHandler } from './utils/middleware'

export const app = express()

app.use(cors())
app.use('/meditations', meditationsController)
app.use(errorHandler)

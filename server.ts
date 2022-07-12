// Enable BigInt toJSON
import http from 'http'
import express, { Express } from 'express'
import morgan from 'morgan'
import cors from 'cors'

/** Routes */
import userRoute from './routes/users'
import companyRoute from './routes/company'
import locationRoute from './routes/location'
import malfunctionContactRoute from './routes/malfunctionContact'
import measurementRoute from './routes/measurement'
import encodedMeasurementRoute from './routes/encodedMeasurement'
import roleRoute from './routes/role'
import roomRoute from './routes/room'
import sensorRoute from './routes/sensor'

require('./patch.js')

const router: Express = express()

/** Logging */
router.use(morgan('dev'))
/** Parse the request */
router.use(express.urlencoded({ extended: false }))
/** Takes care of JSON data */
router.use(express.json({ type: 'application/json' }))
/** Takes care of XML data */
router.use(express.text({ type: 'application/xml' }))

router.use(cors())

router.use((req, res, next) => {
  // set the CORS policy
  res.header('Access-Control-Allow-Origin', '*')
  // set the CORS headers
  res.header('Access-Control-Allow-Headers', 'origin, X-Requested-With,Content-Type,Accept, Authorization')
  // set the CORS method headers
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET PATCH DELETE POST')
    return res.status(200).json({})
  }
  next()
})

router.use('/user', userRoute)
router.use('/company', companyRoute)
router.use('/location', locationRoute)
router.use('/malfunctionContact', malfunctionContactRoute)
router.use('/measurement', measurementRoute)
router.use('/addData', encodedMeasurementRoute)
router.use('/role', roleRoute)
router.use('/room', roomRoute)
router.use('/sensor', sensorRoute)

/** Error handling */
router.use((req, res, next) => {
  const error = new Error('not found')
  return res.status(404).json({
    message: error.message
  })
})

if (!process.env.DATABASE_URL) {
  throw Error('DATABASE_URL is not set')
}

/** Server */
const httpServer = http.createServer(router)
const PORT: any = process.env.PORT ?? 8080
httpServer.listen(PORT, () => console.log(`The server is running on port ${PORT}`))

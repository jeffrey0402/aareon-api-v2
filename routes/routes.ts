import express, { Express } from 'express'
/** Routes */
import companyRoute from './company'
import locationRoute from './location'
import malfunctionContactRoute from './malfunctionContact'
import measurementRoute from './measurement'
import encodedMeasurementRoute from './encodedMeasurement'
import roleRoute from './role'
import roomRoute from './room'
import sensorRoute from './sensor'
import sensorTypeThresholdRoute from './sensorTypeThreshold'
import typeRoute from './type'
import userRoleRoute from './userRole'
import userRoute from './users'

const router: Express = express()

// Enable routes
router.use('/company', companyRoute)
router.use('/location', locationRoute)
router.use('/malfunctionContact', malfunctionContactRoute)
router.use('/measurement', measurementRoute)
router.use('/addData', encodedMeasurementRoute)
router.use('/role', roleRoute)
router.use('/room', roomRoute)
router.use('/sensor', sensorRoute)
router.use('/sensorTypeThreshold', sensorTypeThresholdRoute)
router.use('/type', typeRoute)
router.use('/userRole', userRoleRoute)
router.use('/user', userRoute)

export = router

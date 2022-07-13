import express from 'express'
import Ajv from 'ajv'
import xml2js from 'xml2js'
import validator from 'xsd-schema-validator'
import prisma from '../prisma'

import * as schema from '../schemas/draft-07/measurement.json'

import addFormats from 'ajv-formats'
import sendRes from '../functions/sendRes'
import sendArrRes from '../functions/sendArrRes'
const router = express.Router()

// Init JSON Schema Validator and Preload schemas.
const ajv = new Ajv()

addFormats(ajv)
const validate = ajv.compile(schema)

router.post('/', async (req, res) => {
  const contentType = req.headers['content-type']
  if (contentType === 'application/json') {
    // Validate JSON Schema
    const valid = validate(req.body)
    if (!valid) {
      sendRes(res, 400, validate.errors, 'error')
      return
    }
    await createMeasurement(
      req.body.value,
      req.body.timestamp,
      req.body.deviceUuid,
      req.body.typeName
    )
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/measurement.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            createMeasurement(
              result.measurement.value,
              result.measurement.timestamp,
              result.measurement.deviceUuid,
              result.measurement.typeName
            )
          }
        })
      }
    })
  } else {
    res.status(400).json({
      error:
        'Invalid content type. Expected application/json or application/xml'
    })
  }

  async function createMeasurement (
    value: string,
    timestamp: string,
    deviceUuid: string,
    typeName: string
  ) {
    const timestampDate = new Date(parseInt(timestamp) * 1000)
    try {
      const newMeasurement = await prisma.measurements.create({
        data: {
          value: parseFloat(value),
          timestamp: timestampDate,
          sensor_device_uuid: deviceUuid,
          type_name: typeName,
          created_at: new Date(),
          updated_at: new Date()
        }
      })
      sendRes(res, 200, newMeasurement, 'measurement')
    } catch (err) {
      sendRes(res, 400, 'measurement not unique', 'error')
    }
  }
})

router.get('/', async (req, res) => {
  try {
    const measurements = await prisma.measurements.findMany({
      orderBy: {
        timestamp: 'desc'
      }
    })
    sendArrRes(res, 200, measurements, 'success')
  } catch (err) {
    sendRes(res, 400, 'internal server error', 'error')
  }
})

// Find measurements by deviceUuid
router.get('/:deviceUuid', async (req, res) => {
  try {
    const measurement = await prisma.measurements.findMany({
      where: {
        sensor_device_uuid: req.params.deviceUuid
      }
    })
    if (measurement) {
      sendArrRes(res, 200, measurement, 'success')
    } else {
      sendRes(res, 404, 'measurement not found', 'error')
    }
  } catch (err) {
    sendRes(res, 400, 'internal server error', 'error')
  }
})

// find measurements by deviceUuid and typeName
router.get('/:deviceUuid/:typeName', async (req, res) => {
  try {
    const measurement = await prisma.measurements.findMany({
      where: {
        sensor_device_uuid: req.params.deviceUuid,
        type_name: req.params.typeName
      },
      orderBy: {
        timestamp: 'desc'
      }
    })
    if (measurement) {
      sendArrRes(res, 200, measurement, 'measurement')
    } else {
      sendRes(res, 404, 'measurement not found', 'error')
    }
  } catch (err) {
    sendRes(res, 400, 'internal server error', 'error')
  }
})

// No patch route, as it makes no sense to update a measurement.

// This route deletes all measurements of a device.
router.delete('/:uuid/', async (req, res) => {
  try {
    const measurement = await prisma.measurements.deleteMany({
      where: {
        sensor_device_uuid: req.params.uuid
      }
    })
    sendRes(res, 200, measurement.count.toString() + ' rows affected', 'message')
  } catch (err) {
    sendRes(res, 400, 'internal server error', 'error')
  }
})

export = router

import express from 'express'
import Ajv from 'ajv'
import xml2js from 'xml2js'
import validator from 'xsd-schema-validator'
import prisma from '../prisma'

import * as schema from '../schemas/draft-07/sensorTypeThreshold.json'

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
    await createSensorTypeThreshold(req.body.deviceUuid, req.body.typeName, req.body.minValue, req.body.maxValue, req.body.duration)
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/sensorTypeThreshold.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            createSensorTypeThreshold(result.sensorTypeThreshold.deviceUuid, result.sensorTypeThreshold.typeName, parseFloat(result.sensorTypeThreshold.minValue), parseFloat(result.sensorTypeThreshold.maxValue), parseFloat(result.sensorTypeThreshold.duration))
          }
        })
      }
    })
  } else {
    res.status(400).json({
      error: 'Invalid content type. Expected application/json or application/xml'
    })
  }

  async function createSensorTypeThreshold (deviceUuid: string, typeName: string, minValue: number, maxValue: number, duration: number) {
    try {
      const newSensorTypeThreshold = await prisma.sensor_type_tresholds.create({
        data: {
          sensor_device_uuid: deviceUuid,
          type_name: typeName,
          min_value: minValue,
          max_value: maxValue,
          duration,
          created_at: new Date(),
          updated_at: new Date()
        }
      })
      sendRes(res, 200, newSensorTypeThreshold, 'sensorTypeThreshold')
    } catch (e: any) {
      if (e.code === 'P2002') {
        sendRes(res, 400, 'item already exists.', 'message')
      } else {
        sendRes(res, 400, 'internal server error', 'message')
      }
    }
  }
})

router.get('/', async (req, res) => {
  try {
    const sensorTypeThresholds = await prisma.sensor_type_tresholds.findMany()
    sendArrRes(res, 200, sensorTypeThresholds, 'sensorTypeThreshold')
  } catch (e: any) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

router.get('/:id/:typeName', async (req, res) => {
  try {
    const sensorTypeThreshold = await prisma.sensor_type_tresholds.findFirst({
      where: {
        sensor_device_uuid: req.params.id,
        type_name: req.params.typeName
      }
    })
    if (sensorTypeThreshold) {
      sendRes(res, 200, sensorTypeThreshold, 'sensorTypeThreshold')
    } else {
      sendRes(res, 400, 'item not found', 'message')
    }
  } catch (e: any) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

router.patch('/:id/:typeName', async (req, res) => {
  const contentType = req.headers['content-type']
  if (contentType === 'application/json') {
    // Validate JSON Schema
    const valid = validate(req.body)
    if (!valid) {
      sendRes(res, 400, validate.errors, 'error')
      return
    }
    await updateSensorTypeThreshold(req.params.id, req.params.typeName, req.body.minValue, req.body.maxValue, req.body.duration)
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/sensorTypeThreshold.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            updateSensorTypeThreshold(result.sensorTypeThreshold.deviceUuid, result.sensorTypeThreshold.typeName, parseFloat(result.sensorTypeThreshold.minValue), parseFloat(result.sensorTypeThreshold.maxValue), parseFloat(result.sensorTypeThreshold.duration))
          }
        })
      }
    })
  } else {
    res.status(400).json({
      error: 'Invalid content type. Expected application/json or application/xml'
    })
  }

  async function updateSensorTypeThreshold (deviceUuid: string, typeName: string, minValue: number, maxValue: number, duration: number) {
    try {
      const updatedSensorTypeThreshold = await prisma.sensor_type_tresholds.update({
        where: {
          sensor_device_uuid_type_name: {
            sensor_device_uuid: deviceUuid,
            type_name: typeName
          }
        },
        data: {
          min_value: minValue,
          max_value: maxValue,
          duration
        }
      })
      sendRes(res, 200, updatedSensorTypeThreshold, 'sensorTypeThreshold')
    } catch (e: any) {
      if (e.code === 'P2002') {
        sendRes(res, 400, 'item already exists.', 'message')
      } else {
        sendRes(res, 400, 'internal server error', 'message')
      }
    }
  }
})

router.delete('/:id/:typeName', async (req, res) => {
  try {
    const sensorTypeThreshold = await prisma.sensor_type_tresholds.delete({
      where: {
        sensor_device_uuid_type_name: {
          sensor_device_uuid: req.params.id,
          type_name: req.params.typeName
        }
      }
    })
    if (sensorTypeThreshold) {
      sendRes(res, 200, sensorTypeThreshold, 'sensorTypeThreshold')
    } else {
      sendRes(res, 400, 'item not found', 'message')
    }
  } catch (e: any) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

export = router

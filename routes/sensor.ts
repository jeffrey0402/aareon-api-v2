import express from 'express'
import Ajv from 'ajv'
import xml2js from 'xml2js'
import validator from 'xsd-schema-validator'
import prisma from '../prisma'

import * as schema from '../schemas/draft-07/sensor.json'

import addFormats from 'ajv-formats'
import sendRes from '../functions/sendRes'
import sendArrRes from '../functions/sendArrRes'
const router = express.Router()

// Init JSON Schema Validator and Preload schemas.
const ajv = new Ajv()

addFormats(ajv)
const validate = ajv.compile(schema)

// sensor database fields:
// device_uuid: string deviceUuid
// name: string name
// battery: number battery
// room_id: number roomId
// description: string description
// created_at: date createdAt
// updated_at: date updatedAt

// Create a new sensor
router.post('/', async (req, res) => {
  const contentType = req.headers['content-type']
  if (contentType === 'application/json') {
    // Validate JSON Schema
    const valid = validate(req.body)
    if (!valid) {
      sendRes(res, 400, validate.errors, 'error')
      return
    }
    await createSensor(
      req.body.deviceUuid,
      req.body.name,
      req.body.roomId,
      req.body.description
    )
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/sensor.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            createSensor(
              result.sensor.deviceUuid,
              result.sensor.name,
              parseInt(result.sensor.roomId),
              result.sensor.description
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

  async function createSensor (
    deviceUuid: string,
    name: string,
    roomId: number,
    description: string
  ) {
    try {
      const newSensor = await prisma.sensors.create({
        data: {
          device_uuid: deviceUuid,
          name,
          battery: 100,
          room_id: roomId,
          description,
          updated_at: new Date(),
          created_at: new Date()
        }
      })
      sendRes(res, 201, newSensor, 'sensor')
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
    const sensors = await prisma.sensors.findMany()
    sendArrRes(res, 200, sensors, 'sensor')
  } catch (e: any) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

router.get('/:id', async (req, res) => {
  const id = req.params.id
  try {
    const sensor = await prisma.sensors.findFirst({
      where: {
        device_uuid: id
      }
    })
    if (sensor) {
      sendRes(res, 200, sensor, 'sensor')
    } else {
      sendRes(res, 404, 'item not found', 'message')
    }
  } catch (e: any) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

router.patch('/:id', async (req, res) => {
  const id = req.params.id
  const contentType = req.headers['content-type']
  if (contentType === 'application/json') {
    // Validate JSON Schema
    const valid = validate(req.body)
    if (!valid) {
      sendRes(res, 400, validate.errors, 'error')
      return
    }
    await updateSensor(id, req.body)
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/sensor.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            updateSensor(id, result.sensor)
          }
        })
      }
    })
  } else {
    res.status(400).json({
      error: 'Invalid content type. Expected application/json or application/xml'
    })
  }

  async function updateSensor (id: string, sensor: any) {
    try {
      const updatedSensor = await prisma.sensors.update({
        where: {
          device_uuid: id
        },
        data: {
          name: sensor.name,
          battery: sensor.battery,
          room_id: parseInt(sensor.roomId),
          description: sensor.description,
          updated_at: new Date()
        }
      })
      sendRes(res, 200, updatedSensor, 'sensor')
    } catch (e: any) {
      if (e.code === 'P2002') {
        sendRes(res, 400, 'item already exists.', 'message')
      } else {
        sendRes(res, 400, 'internal server error', 'message')
      }
    }
  }
})

router.delete('/:id', async (req, res) => {
  const id = req.params.id
  try {
    const sensor = await prisma.sensors.delete({
      where: {
        device_uuid: id
      }
    })
    if (sensor) {
      sendRes(res, 200, sensor, 'sensor')
    } else {
      sendRes(res, 404, 'item not found', 'message')
    }
  } catch (e: any) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

export = router

import express from 'express'
import Ajv from 'ajv'
import xml2js from 'xml2js'
import validator from 'xsd-schema-validator'
import prisma from '../prisma'

import * as schema from '../schemas/draft-07/malfunctionContact.json'

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
    await createMalfunctionContact(req.body.incidentId, req.body.deviceUuid, req.body.typeName)
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/malfunctionContact.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            createMalfunctionContact(result.malfunctionContact.incidentId, result.malfunctionContact.deviceUuid, result.malfunctionContact.typeName)
          }
        })
      }
    })
  } else {
    res.status(400).json({
      error: 'Invalid content type. Expected application/json or application/xml'
    })
  }

  async function createMalfunctionContact (incidentId: string, deviceUuid: string, typeName: string) {
    try {
      const newMalfunctionContact = await prisma.malfunction_contacts.create({
        data: {
          incident_id: incidentId,
          sensor_device_uuid: deviceUuid,
          type_name: typeName,
          created_at: new Date(),
          updated_at: new Date()
        }
      })
      sendRes(res, 201, newMalfunctionContact, 'success')
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
    const malfunctionContacts = await prisma.malfunction_contacts.findMany()
    sendArrRes(res, 200, malfunctionContacts, 'malfunctionContact')
  } catch (e: any) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    const malfunctionContact = await prisma.malfunction_contacts.findFirst({
      where: {
        id
      }
    })
    if (malfunctionContact) {
      sendRes(res, 200, malfunctionContact, 'malfunctionContact')
    } else {
      sendRes(res, 404, 'malfunctionContact not found', 'message')
    }
  } catch (e: any) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

router.patch('/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  const contentType = req.headers['content-type']
  if (contentType === 'application/json') {
    // Validate JSON Schema
    const valid = validate(req.body)
    if (!valid) {
      sendRes(res, 400, validate.errors, 'error')
      return
    }
    await updateMalfunctionContact(id, req.body.incidentId, req.body.sensorDeviceUuid, req.body.typeName)
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/malfunctionContact.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            updateMalfunctionContact(id, result.malfunctionContact.incidentId, result.malfunctionContact.sensorDeviceUuid, result.malfunctionContact.typeName)
          }
        })
      }
    })
  } else {
    res.status(400).json({
      error: 'Invalid content type. Expected application/json or application/xml'
    })
  }

  async function updateMalfunctionContact (id: number, incidentId: string, sensorDeviceUuid: string, typeName: string) {
    try {
      const malfunctionContact = await prisma.malfunction_contacts.update({
        where: {
          id
        },
        data: {
          incident_id: incidentId,
          sensor_device_uuid: sensorDeviceUuid,
          type_name: typeName,
          updated_at: new Date()
        }
      })
      sendRes(res, 200, malfunctionContact, 'malfunctionContact')
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
  const id = parseInt(req.params.id)
  try {
    const malfunctionContact = await prisma.malfunction_contacts.delete({
      where: {
        id
      }
    })
    if (malfunctionContact) {
      sendRes(res, 200, malfunctionContact, 'malfunctionContact')
    } else {
      sendRes(res, 404, 'malfunctionContact not found', 'message')
    }
  } catch (e: any) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

export = router

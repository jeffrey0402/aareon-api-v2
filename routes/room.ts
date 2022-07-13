import express from 'express'
import Ajv from 'ajv'
import xml2js from 'xml2js'
import validator from 'xsd-schema-validator'
import prisma from '../prisma'

import * as schema from '../schemas/draft-07/room.json'

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
    await createRoom(req.body.locationId, req.body.name, req.body.floor)
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/room.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            createRoom(
              parseInt(result.room.locationId),
              result.room.name,
              parseInt(result.room.floor)
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

  async function createRoom (locationId: number, name: string, floor: number) {
    try {
      const newRoom = await prisma.rooms.create({
        data: {
          location_id: locationId,
          name,
          floor,
          updated_at: new Date(),
          created_at: new Date()
        }
      })
      sendRes(res, 200, newRoom, 'success')
    } catch (err: any) {
      if (err.code === 'P2002') {
        sendRes(res, 400, 'item already exists.', 'message')
      } else {
        console.log(err)
        sendRes(res, 400, 'internal server error', 'message')
      }
    }
  }
})

router.get('/', async (req, res) => {
  try {
    const rooms = await prisma.rooms.findMany()
    sendArrRes(res, 200, rooms, 'room')
  } catch (e: any) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    const room = await prisma.rooms.findFirst({
      where: {
        id
      }
    })
    if (room) {
      sendRes(res, 200, room, 'room')
    } else {
      sendRes(res, 400, 'item not found', 'message')
    }
  } catch (e) {
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
    await updateRoom(id, req.body.name, req.body.floor)
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/room.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            updateRoom(id, result.room.name, parseInt(result.room.floor))
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

  async function updateRoom (id: number, name: string, floor: number) {
    try {
      const room = await prisma.rooms.update({
        where: {
          id
        },
        data: {
          name,
          floor,
          updated_at: new Date()
        }
      })
      if (room) {
        sendRes(res, 200, room, 'success')
      } else {
        sendRes(res, 400, 'item not found', 'message')
      }
    } catch (err: any) {
      if (err.code === 'P2002') {
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
    const room = await prisma.rooms.delete({
      where: {
        id
      }
    })
    if (room) {
      sendRes(res, 200, room, 'success')
    } else {
      sendRes(res, 400, 'item not found', 'message')
    }
  } catch (e) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

export = router;

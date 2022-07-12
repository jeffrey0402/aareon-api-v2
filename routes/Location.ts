import express from 'express'
import Ajv from 'ajv'
import xml2js from 'xml2js'
import validator from 'xsd-schema-validator'
import prisma from '../prisma'

import * as schema from '../schemas/draft-07/location.json'

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
    await createLocation(req.body.name, req.body.type, req.body.street, req.body.number, req.body.city, req.body.company)
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/location.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            createLocation(result.location.name, result.location.type, result.location.street, result.location.number, result.location.city, result.location.company)
          }
        })
      }
    })
  } else {
    res.status(400).json({
      error: 'Invalid content type. Expected application/json or application/xml'
    })
  }

  async function createLocation (name: string, type: string, street: string, number: string, city: string, company: string) {
    try {
      const newLocation = await prisma.locations.create({
        data: {
          name,
          type,
          street,
          number,
          company,
          city,
          updated_at: new Date(),
          created_at: new Date()
        }
      })
      sendRes(res, 200, newLocation, 'success')
    } catch (e: any) {
      if (e.code === 'P2002') {
        sendRes(res, 400, 'Location already exists', 'error')
      } else {
        sendRes(res, 400, 'Internal server error', 'error')
      }
    }
  }
})

router.get('/', async (req, res) => {
  try {
    const locations = await prisma.locations.findMany()
    sendArrRes(res, 200, locations, 'location')
  } catch (e: any) {
    sendRes(res, 400, 'Internal server error', 'error')
  }
})

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    const location = await prisma.locations.findFirst({
      where: {
        id
      }
    })
    if (location) {
      sendRes(res, 200, location, 'location')
    } else {
      sendRes(res, 400, 'Location not found', 'error')
    }
  } catch (e: any) {
    sendRes(res, 400, 'Internal server error', 'error')
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
    await updateLocation(id, req.body.name, req.body.type, req.body.street, req.body.number, req.body.city, req.body.company)
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/location.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            updateLocation(id, result.location.name, result.location.type, result.location.street, result.location.number, result.location.city, result.location.company)
          }
        })
      }
    })
  } else {
    res.status(400).json({
      error: 'Invalid content type. Expected application/json or application/xml'
    })
  }
  async function updateLocation (id: number, name: string, type: string, street: string, number: string, city: string, company: string) {
    try {
      const location = await prisma.locations.update({
        where: {
          id
        },
        data: {
          name,
          type,
          street,
          number,
          company,
          city,
          updated_at: new Date()
        }
      })
      if (location) {
        sendRes(res, 200, location, 'success')
      } else {
        sendRes(res, 400, 'Location not found', 'error')
      }
    } catch (e: any) {
      sendRes(res, 400, 'Internal server error', 'error')
    }
  }
})

router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    const location = await prisma.locations.delete({
      where: {
        id
      }
    })
    if (location) {
      sendRes(res, 200, location, 'success')
    } else {
      sendRes(res, 400, 'Location not found', 'error')
    }
  } catch (e: any) {
    sendRes(res, 400, 'Internal server error', 'error')
  }
})

export = router

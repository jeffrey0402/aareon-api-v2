import express from 'express'
import Ajv from 'ajv'
import xml2js from 'xml2js'
import validator from 'xsd-schema-validator'
import prisma from '../prisma'

import * as schema from '../schemas/draft-07/type.json'

import addFormats from 'ajv-formats'
import sendRes from '../functions/sendRes'
import sendArrRes from '../functions/sendArrRes'
const router = express.Router()

// Init JSON Schema Validator and Preload schemas.
const ajv = new Ajv()

addFormats(ajv)
const validate = ajv.compile(schema)

// Type database fields:
// name: name: string
// description: description: string
// measurement_unit: measurementUnit: string
// created_at: created_at: Date
// updated_at: updated_at: Date

router.post('/', async (req, res) => {
  const contentType = req.headers['content-type']
  if (contentType === 'application/json') {
    // Validate JSON Schema
    const valid = validate(req.body)
    if (!valid) {
      sendRes(res, 400, validate.errors, 'error')
      return
    }
    await createType(req.body.name, req.body.description, req.body.measurementUnit)
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/type.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            createType(result.type.name, result.type.description, result.type.measurementUnit)
          }
        })
      }
    })
  } else {
    res.status(400).json({
      error: 'Invalid content type. Expected application/json or application/xml'
    })
  }

  async function createType (name: string, description: string, measurementUnit: string) {
    try {
      const newType = await prisma.types.create({
        data: {
          name,
          description,
          measurement_unit: measurementUnit,
          updated_at: new Date(),
          created_at: new Date()
        }
      })
      sendRes(res, 201, newType, 'success')
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
    const types = await prisma.types.findMany()
    sendArrRes(res, 200, types, 'type')
  } catch (e: any) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

router.get('/:name', async (req, res) => {
  try {
    const type = await prisma.types.findFirst({
      where: {
        name: req.params.name
      }
    })
    sendRes(res, 200, type, 'type')
  } catch (e: any) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

router.patch('/:name', async (req, res) => {
  const contentType = req.headers['content-type']
  if (contentType === 'application/json') {
    // Validate JSON Schema
    const valid = validate(req.body)
    if (!valid) {
      sendRes(res, 400, validate.errors, 'error')
      return
    }
    await updateType(req.params.name, req.body.name, req.body.description, req.body.measurementUnit)
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/type.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            updateType(req.params.name, result.type.name, result.type.description, result.type.measurementUnit)
          }
        })
      }
    })
  } else {
    res.status(400).json({
      error: 'Invalid content type. Expected application/json or application/xml'
    })
  }

  async function updateType (name: string, newName: string, description: string, measurementUnit: string) {
    try {
      const type = await prisma.types.update({
        where: {
          name
        },
        data: {
          name: newName,
          description,
          measurement_unit: measurementUnit,
          updated_at: new Date()
        }
      })
      sendRes(res, 200, type, 'success')
    } catch (e: any) {
      if (e.code === 'P2002') {
        sendRes(res, 400, 'item already exists.', 'message')
      } else {
        sendRes(res, 400, 'internal server error', 'message')
      }
    }
  }
})

router.delete('/:name', async (req, res) => {
  try {
    const type = await prisma.types.delete({
      where: {
        name: req.params.name
      }
    })
    sendRes(res, 200, type, 'success')
  } catch (e: any) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

export = router

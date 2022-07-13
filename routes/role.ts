import express from 'express'
import Ajv from 'ajv'
import xml2js from 'xml2js'
import validator from 'xsd-schema-validator'
import prisma from '../prisma'

import * as schema from '../schemas/draft-07/role.json'

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
    await createRole(req.body.name)
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/role.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            createRole(result.role.name)
          }
        })
      }
    })
  } else {
    res.status(400).json({
      error: 'Invalid content type. Expected application/json or application/xml'
    })
  }

  async function createRole (name: string) {
    try {
      const newRole = await prisma.roles.create({
        data: {
          name,
          updated_at: new Date(),
          created_at: new Date()
        }
      })
      sendRes(res, 200, newRole, 'role')
    } catch (e: any) {
      if (e.code === 'P2002') {
        sendRes(res, 400, 'item already exists.', 'message')
      } else {
        sendRes(res, 400, 'internal server error', 'message')
      }
    }
  }
})

// get all roles
router.get('/', async (req, res) => {
  try {
    const roles = await prisma.roles.findMany()
    sendArrRes(res, 200, roles, 'roles')
  } catch (e) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

router.get('/:id', async (req, res) => {
  try {
    const role = await prisma.roles.findFirst({
      where: {
        id: parseInt(req.params.id)
      }
    })
    if (role) {
      sendRes(res, 200, role, 'role')
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
    await updateRole(id, req.body.name)
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/role.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            updateRole(id, result.role.name)
          }
        })
      }
    })
  } else {
    res.status(400).json({
      error: 'Invalid content type. Expected application/json or application/xml'
    })
  }

  async function updateRole (id: number, name: string) {
    try {
      const updatedRole = await prisma.roles.update({
        where: { id },
        data: {
          name,
          updated_at: new Date()
        }
      })
      sendRes(res, 200, updatedRole, 'role')
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
    const deletedRole = await prisma.roles.delete({
      where: { id }
    })
    sendRes(res, 200, deletedRole, 'role')
  } catch (e: any) {
    if (e.code === 'P2025') {
      sendRes(res, 400, 'item not found', 'message')
    } else {
      sendRes(res, 400, 'invalid request', 'message')
    }
  }
})

export = router

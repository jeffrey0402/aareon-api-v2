import express from 'express'
import Ajv from 'ajv'
import xml2js from 'xml2js'
import bcrypt from 'bcrypt'
import validator from 'xsd-schema-validator'
import prisma from '../prisma'

import * as schema from '../schemas/draft-07/user.json'

import addFormats from 'ajv-formats'
import sendRes from '../functions/sendRes'
import sendArrRes from '../functions/sendArrRes'
const router = express.Router()

// Init JSON Schema Validator and Preload schemas.
const ajv = new Ajv()

addFormats(ajv)
const validate = ajv.compile(schema)

// Add a new user, and return the user object.
router.post('/', async (req, res) => {
  const contentType = req.headers['content-type']
  if (contentType === 'application/json') {
    // Validate JSON Schema
    const valid = validate(req.body)
    if (!valid) {
      sendRes(res, 400, validate.errors, 'error')
      return
    }
    // Create password hash in $2b$10$ format.
    const hash = bcrypt.hashSync(req.body.password, 10)
    // Add user to the database
    await createUser(req.body.name, req.body.email, req.body.phoneNumber, hash)
  } else if (contentType === 'application/xml') {
    // Init XML Parser
    const parser = new xml2js.Parser({ explicitArray: false })
    // Validate XML Schema
    validator.validateXML(req.body, 'xsd/user.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        // Parse XML
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            // Create password hash in $2b$10$ format.
            const hash = bcrypt.hashSync(result.user.password, 10)
            // Add user to the database
            createUser(result.user.name, result.user.email, result.user.phoneNumber, hash)
          }
        })
      }
    })
  } else {
    // No content type was provided
    res.status(400).json({
      error: 'Invalid content type. Expected application/json or application/xml'
    })
  }

  /**
   * Creates user in the database.
   * @param name Name of the user
   * @param email email of the user
   * @param phoneNumber phone number of the user
   * @param password password hash of the user
   */
  async function createUser (name: string, email: string, phoneNumber: string, password: string) {
    try {
      const newUser = await prisma.users.create({
        data: {
          name,
          phone_number: phoneNumber.toString(),
          email,
          password,
          created_at: new Date(),
          updated_at: new Date()
        }
      })
      sendRes(res, 200, newUser, 'success')
    } catch (e: any) {
      if (e.code === 'P2002') {
        sendRes(res, 400, 'user already exists.', 'message')
      } else {
        sendRes(res, 400, 'internal server error', 'message')
      }
    }
  }
})

router.get('/', async (req, res) => {
  try {
    const allUsers = await prisma.users.findMany()
    sendArrRes(res, 200, allUsers, 'user')
  } catch (e: any) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    const user = await prisma.users.findFirst({
      where: {
        id
      }
    })
    if (user) {
      sendRes(res, 200, user, 'user')
    } else {
      sendRes(res, 404, 'user not found', 'message')
    }
  } catch (e: any) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

// Update user by id.
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
    const hash = bcrypt.hashSync(req.body.password, 10)
    await updateUser(req.body.name, req.body.email, req.body.phoneNumber.toString(), hash)
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/user.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            const hash = bcrypt.hashSync(result.user.password, 10)
            updateUser(result.user.name, result.user.email, result.user.phoneNumber, hash)
          }
        })
      }
    })
  } else {
    res.status(400).json({
      error: 'Invalid content type. Expected application/json or application/xml'
    })
  }

  /**
   * updates user in the database.
   * @param name Name of the user
   * @param email email of the user
   * @param phoneNumber phone number of the user
   * @param password password hash of the user
   */
  async function updateUser (name: string, email: string, phoneNumber: string, password: string) {
    try {
      const newUser = await prisma.users.update({
        where: {
          id
        },
        data: {
          name,
          phone_number: phoneNumber,
          email,
          password,
          updated_at: new Date()
        }
      })
      sendRes(res, 200, newUser, 'success')
    } catch (e: any) {
      if (e.code === 'P2002') {
        sendRes(res, 400, 'user already exists.', 'message')
      } else {
        sendRes(res, 400, 'internal server error', 'message')
      }
    }
  }
})

// Delete user by id
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    const deletedUser = await prisma.users.delete({
      where: {
        id
      }
    })
    sendRes(res, 200, deletedUser, 'user')
  } catch (e: any) {
    if (e.code === 'P2025') {
      sendRes(res, 400, 'user not found', 'message')
    } else {
      sendRes(res, 400, 'invalid request', 'message')
    }
  }
})
export = router;

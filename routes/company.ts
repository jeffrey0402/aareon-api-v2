import express from 'express'
import Ajv from 'ajv'
import xml2js from 'xml2js'
import validator from 'xsd-schema-validator'
import prisma from '../prisma'

import * as schema from '../schemas/draft-07/company.json'

import addFormats from 'ajv-formats'
import sendRes from '../functions/sendRes'
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
    await createCompany(req.body.name, req.body.representativeName, req.body.representativeEmail)
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/company.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            createCompany(result.company.name, result.company.representativeName, result.company.representativeEmail)
          }
        })
      }
    })
  } else {
    res.status(400).json({
      error: 'Invalid content type. Expected application/json or application/xml'
    })
  }

  async function createCompany (name: string, representativeName: string, representativeEmail: string) {
    try {
      const newCompany = await prisma.companies.create({
        data: {
          name,
          representative_name: representativeName,
          representative_email: representativeEmail,
          updated_at: new Date(),
          created_at: new Date()
        }
      })
      sendRes(res, 200, newCompany, 'company')
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
    const companies = await prisma.companies.findMany()
    sendRes(res, 200, companies, 'company')
  } catch (e: any) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

router.get('/:name', async (req, res) => {
  try {
    const company = await prisma.companies.findFirst({
      where: {
        name: req.params.name
      }
    })
    if (company) {
      sendRes(res, 200, company, 'company')
    } else {
      sendRes(res, 400, 'item not found', 'message')
    }
  } catch (e) {
    sendRes(res, 400, 'internal server error', 'message')
  }
})

router.patch('/:name', async (req, res) => {
  const name = req.params.name
  const contentType = req.headers['content-type']
  if (contentType === 'application/json') {
    // Validate JSON Schema
    const valid = validate(req.body)
    if (!valid) {
      sendRes(res, 400, validate.errors, 'error')
      return
    }
    await updateCompany(req.body.name, req.body.representativeName, req.body.representativeEmail, name)
  } else if (contentType === 'application/xml') {
    // Validate XML Schema
    const parser = new xml2js.Parser({ explicitArray: false })
    validator.validateXML(req.body, 'xsd/company.xsd', (err) => {
      if (err) {
        sendRes(res, 400, err.message, 'error')
      } else {
        parser.parseString(req.body, (err, result) => {
          if (err) {
            sendRes(res, 400, 'parsing error', 'error')
          } else {
            updateCompany(result.company.name, result.company.representativeName, result.company.representativeEmail, name)
          }
        })
      }
    })
  } else {
    res.status(400).json({
      error: 'Invalid content type. Expected application/json or application/xml'
    })
  }

  async function updateCompany (name: string, representativeName: string, representativeEmail: string, id: string) {
    try {
      const company = await prisma.companies.update({
        where: {
          name: id
        },
        data: {
          name,
          representative_name: representativeName,
          representative_email: representativeEmail,
          updated_at: new Date()
        }
      })
      sendRes(res, 200, company, 'company')
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
  const name = req.params.name
  try {
    const company = await prisma.companies.delete({
      where: {
        name
      }
    })
    sendRes(res, 200, company, 'company')
  } catch (e: any) {
    if (e.code === 'P2025') {
      sendRes(res, 400, 'item not found', 'message')
    } else {
      sendRes(res, 400, 'invalid request', 'message')
    }
  }
})

export = router;

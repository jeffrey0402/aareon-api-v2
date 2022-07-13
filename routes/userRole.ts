import express from 'express'
import prisma from '../prisma'

import sendRes from '../functions/sendRes'
import sendArrRes from '../functions/sendArrRes'
const router = express.Router()

// Deze endpoint is zonder validatie, omdat het slechts 2 id fields bevat, die beide door de query params mee gegeven worden.
router.post('/:userId/:roleId', async (req, res) => {
  const userId = parseInt(req.params.userId)
  const roleId = parseInt(req.params.roleId)
  if (!isNaN(userId) || !isNaN(roleId) || userId < 0 || roleId < 0) {
    try {
      const userRole = await prisma.user_roles.create({
        data: {
          user_id: userId,
          role_id: roleId,
          created_at: new Date(),
          updated_at: new Date()
        }
      })
      sendRes(res, 200, userRole, 'success')
    } catch (err) {
      sendRes(res, 400, 'user or role does not exist', 'error')
    }
  } else {
    sendRes(res, 400, 'Invalid request', 'error')
  }
})

// Get all roles from user
router.get('/user/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId)
  if (!isNaN(userId) && userId > 0) {
    try {
      const userRoles = await prisma.user_roles.findMany({
        where: {
          user_id: userId
        }
      })
      sendArrRes(res, 200, userRoles, 'userRole')
    } catch (err) {
      sendRes(res, 400, err, 'error')
    }
  } else {
    sendRes(res, 400, 'Invalid request', 'error')
  }
})

// get all users from role
router.get('/role/:roleId', async (req, res) => {
  const roleId = parseInt(req.params.roleId)
  if (!isNaN(roleId) && roleId > 0) {
    try {
      const userRoles = await prisma.user_roles.findMany({
        where: {
          role_id: roleId
        }
      })
      sendArrRes(res, 200, userRoles, 'userRole')
    } catch (err) {
      sendRes(res, 400, err, 'error')
    }
  } else {
    sendRes(res, 400, 'Invalid request', 'error')
  }
})

// get all userRoles
router.get('/', async (req, res) => {
  try {
    const userRoles = await prisma.user_roles.findMany()
    sendArrRes(res, 200, userRoles, 'userRole')
  } catch (err) {
    sendRes(res, 400, err, 'error')
  }
})

// delete specific user_role
router.delete('/:userId/:roleId', async (req, res) => {
  const userId = parseInt(req.params.userId)
  const roleId = parseInt(req.params.roleId)
  if (!isNaN(userId) || !isNaN(roleId) || userId < 0 || roleId < 0) {
    try {
      const userRole = await prisma.user_roles.delete({
        where: {
          user_id_role_id: {
            user_id: userId,
            role_id: roleId
          }
        }
      })
      sendRes(res, 200, userRole, 'success')
    } catch (err) {
      sendRes(res, 400, err, 'error')
    }
  } else {
    sendRes(res, 400, 'Invalid request', 'error')
  }
})

export = router

import { Router } from 'express'
import {
  createCustomer,
  createEmployee,
  deleteUser,
  getOneUser,
  getUsers,
  updateUser,
} from '#modules/users/users.controller.js'
const router = Router()

router.post('/', createCustomer)

router.post('/employee', createEmployee)

router.get('/', getUsers)

router.get('/:id', getOneUser)

router.delete('/:id', deleteUser)

router.patch('/:id', updateUser)

export default router

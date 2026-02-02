import { Router } from 'express'
import {
  createCustomer,
  createEmployee,
  deleteUser,
  getAllCustomers,
  getAllEmployees,
  getMe,
  getOneUser,
  getUsers,
  updateUser,
} from '#modules/users/users.controller.js'
const router = Router()

router.post('/customer', createCustomer)

router.post('/employee', createEmployee)

router.get('/', getUsers)

router.get('/me', getMe)

router.get('/employees', getAllEmployees)

router.get('/customers', getAllCustomers)

router.get('/:id', getOneUser)

router.delete('/:id', deleteUser)

router.patch('/:id', updateUser)

export default router

import { Router } from 'express'
import { createCustomer, createEmployee } from '#modules/users/users.controller.js'
const router = Router()

router.post('/', createCustomer)

router.post('/employee', createEmployee)
export default router

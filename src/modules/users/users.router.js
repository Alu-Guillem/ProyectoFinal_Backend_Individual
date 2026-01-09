import { Router } from 'express'
import { createUser } from '#modules/users/users.controller.js'
const router = Router()

router.post('/', createUser)
export default router

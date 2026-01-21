import { Router } from 'express'
import { login, logut, register } from './auth.controller.js'

const router = Router()

router.post('/login', login)

router.post('/register', register)

router.post('/logut', logut)

export default router

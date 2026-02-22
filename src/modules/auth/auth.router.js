import { Router } from 'express'
import { login, logout, register } from './auth.controller.js'
import { upload } from '../commons/index.js'

const router = Router()

router.post('/login', login)

router.post('/register', upload.single('photo'), register)

router.post('/logout', logout)

export default router

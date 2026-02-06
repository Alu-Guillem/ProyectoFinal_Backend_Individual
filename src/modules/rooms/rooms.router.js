import { Router } from 'express'
import { 
    getRoom,
    createRoom,
    getCheck
} from './rooms.controller.js'
const router = Router()

router.get('/', getCheck)   
router.post('/', createRoom);

export default router

import { Router } from 'express'
import { 
    getRoom,
    createRoom
} from './rooms.controller'
const router = Router()

router.get('/', getRoom)
router.post('/', createRoom);


export default router

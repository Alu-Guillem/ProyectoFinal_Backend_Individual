import { Router } from 'express'
import { 
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom
} from './rooms.controller.js'
const router = Router()

router.get('/', getRoom)   
router.post('/', createRoom);
router.put('/:id', updateRoom)
router.delete('/:id', deleteRoom)

export default router

import { Router } from 'express'
import { 
    getRoom,
    getOneRoom,
    createRoom,
    updateRoom,
    deleteRoom
} from './rooms.controller.js'
const router = Router()

router.get('/', getRoom)
router.get('/:id', getOneRoom)
router.post('/', createRoom);
router.put('/:id', updateRoom)
router.delete('/:id', deleteRoom)

export default router

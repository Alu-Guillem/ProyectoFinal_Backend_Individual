import { Router } from 'express'
import { 
    getRoom,
    getOneRoom,
    createRoom,
    updateRoom,
    deleteRoom,
    closeRoom,
    getRoomStats,
    getRoomOccupancy
} from './rooms.controller.js'
const router = Router()

router.get('/', getRoom)   
router.get('/stats', getRoomStats)
router.get('/stats/:year', getRoomStats)
router.get('/:id/occupancy', getRoomOccupancy)
router.get('/:id', getOneRoom)
router.post('/', createRoom);
router.put('/:id', updateRoom)
router.put('/:id/close', closeRoom)
router.delete('/:id', deleteRoom)


export default router

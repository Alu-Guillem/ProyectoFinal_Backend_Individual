import { Router } from 'express'
import { 
    getRoom,
    getOneRoom,
    createRoom,
    updateRoom,
    deleteRoom,
    closeRoom,
    getRoomStats,
    getRoomOccupancy,
    editCleaningTime,
    setRoomMaintenance,
    cancelRoomMaintenance,
    uploadRoomImage
} from './rooms.controller.js'
import { upload } from '#r/libs/multer/index.js'
const router = Router()

router.get('/', getRoom)   
router.get('/stats', getRoomStats)
router.get('/stats/:year', getRoomStats)
router.get('/:id/occupancy/:year', getRoomOccupancy)
router.get('/:id', getOneRoom)
router.post('/', createRoom);
router.put('/:id', updateRoom)
router.put('/:id/close', closeRoom)
router.put('/:id/setMaintenance', setRoomMaintenance)
router.put('/:id/cancelMaintenance', cancelRoomMaintenance)
router.patch('/:id/cleaningTime', editCleaningTime)
router.delete('/:id', deleteRoom)

router.post(
  '/:id/image',
  upload.single('image'),
  uploadRoomImage
)

export default router

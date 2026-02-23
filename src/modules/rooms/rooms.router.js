import { Router } from 'express'
import { upload } from './rooms.middleware';
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

router.post('/', upload.single("image"), createRoom)
router.put('/:id', upload.single("image"), updateRoom)

router.delete('/:id', deleteRoom)


export default router

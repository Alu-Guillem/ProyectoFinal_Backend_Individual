import { Router } from 'express'
import usersRouter from '#modules/users/users.router.js'
import roomsRouter from '#modules/rooms/rooms.router.js'
import bookingsRouter from '#modules/bookings/bookings.router.js'
import authRouter from '#modules/bookings/auth.router.js'
import { authMiddleware } from '#modules/auth/auth.middleware.js'

const router = Router()

router.use('/auth', authRouter)
router.use(authMiddleware)
router.use('/users', usersRouter)
router.use('/rooms', roomsRouter)
router.use('/bookings', bookingsRouter)

export default router

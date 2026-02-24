import { Room } from './rooms.model.js'
import { Booking } from '../bookings/bookings.model.js'
import { Review } from '../reviews/reviews.model.js'
import { isAvailable } from '../bookings/utils/index.js'

// GET api/rooms
export const getRoom = async (req, res) => {
  try {
    // Filtros desde query params
    const {
      name,
      startDate,
      endDate,
      occupants,
      needsExtraBed,
      needsCrib,
      onlyOffers,
      priceMin,
      priceMax,
      minimumRating,
    } = req.query

    const mongoFilter = {}
    if (name) {
      mongoFilter.name = { $regex: name, $options: "i" }; 
    }
    if (occupants) mongoFilter.occupancyLimit = { $gte: Number(occupants) }
    if (needsExtraBed === 'true') mongoFilter.hasExtraBed = true
    if (needsCrib === 'true') mongoFilter.hasCradle = true
    if (onlyOffers === 'true') mongoFilter.offer = { $gt: 0 }
    if (priceMin || priceMax) {
      mongoFilter.pricePerNight = {}
      if (priceMin) mongoFilter.pricePerNight.$gte = Number(priceMin)
      if (priceMax) mongoFilter.pricePerNight.$lte = Number(priceMax)
    }

    let rooms = await Room.find(mongoFilter).lean()

    if (minimumRating) {
      const roomIds = rooms.map(r => r._id)

      const ratings = await Review.aggregate([
        { $match: { roomId: { $in: roomIds } } },
        { $group: { _id: '$roomId', avgRating: { $avg: '$rate' } } },
      ])
      const ratingsMap = Object.fromEntries(ratings.map(r => [r._id.toString(), r.avgRating]))
      rooms = rooms.filter(room => (ratingsMap[room._id?.toString()] || 0) >= Number(minimumRating))
    }

    if (startDate && endDate) {
      if (isNaN(Number(startDate)) || isNaN(Number(endDate))) {
        return res.status(400).json({ error: 'Parámetros de fecha inválidos' })
      }
      const start = new Date(Number(startDate))
      const end = new Date(Number(endDate))

      const roomIds = rooms.map(r => r._id)
      const bookings = await Booking.find({
        roomId: { $in: roomIds },
        status: 'active',
        isPaid: true,
        $or: [{ startDate: { $lt: end }, endDate: { $gt: start } }],
      }).lean()

      const bookingsByRoom = {}

      for (const b of bookings) {
        if (!bookingsByRoom[b.roomId]) bookingsByRoom[b.roomId] = []
        bookingsByRoom[b.roomId].push(b)
      }

      rooms = rooms.filter(room => {
        const roomBookings = bookingsByRoom[room._id?.toString()] || bookingsByRoom[room._id] || []

        return isAvailable(roomBookings, { startDate: start, endDate: end })
      })
    }

    res.json(rooms)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener habitaciones' })
    console.error('Error en getRoom:', error)
  }
}

//GET api/rooms/:id

export const getOneRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    res.json(room)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la habitacion' })
    console.error('Error en getOneRoom:', error)
  }
}

// POST api/rooms
export const createRoom = async (req, res) => {
  try {
    const { name, type, number, pricePerNight, occupancyLimit, description, offer } = req.body

    console.log('Datos recibidos:', req.body)

    if (isNaN(number) || isNaN(pricePerNight) || isNaN(occupancyLimit) || isNaN(offer)) {
      return res.status(400).json({
        error: 'numero, precio y la ocupacion deben ser números',
      })
    }

    const existingRoom = await Room.findOne({ name, type })

    if (existingRoom) {
      return res.status(409).json({
        error: 'Ya existe una habitación con ese nombre y tipo',
      })
    }

    const room = new Room({ name, type, number, pricePerNight, occupancyLimit, description, offer })
    await room.save()
    res.status(201).json(room)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// PUT api/rooms/:id
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params
    const { name, type, number, pricePerNight, occupancyLimit, description, offer } = req.body

    if (
      (number !== undefined && isNaN(number)) ||
      (pricePerNight !== undefined && isNaN(pricePerNight)) ||
      (occupancyLimit !== undefined && isNaN(occupancyLimit)) ||
      (offer !== undefined && isNaN(offer))
    ) {
      return res.status(400).json({
        error: 'numero, precio, ocupacion y oferta deben ser números',
      })
    }

    if (name && type) {
      const existingRoom = await Room.findOne({
        name,
        type,
        _id: { $ne: id },
      })

      if (existingRoom) {
        return res.status(409).json({
          error: 'Ya existe otra habitación con ese nombre y tipo',
        })
      }
    }

    const updatedRoom = await Room.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!updatedRoom) {
      return res.status(404).json({ error: 'Habitación no encontrada' })
    }

    res.json(updatedRoom)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

//DELETE api/rooms/:id
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params

    const deletedRoom = await Room.findByIdAndDelete(id)

    if (!deletedRoom) {
      return res.status(404).json({
        error: 'Habitación no encontrada',
      })
    }

    res.json({
      message: 'Habitación eliminada correctamente',
      room: deletedRoom,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

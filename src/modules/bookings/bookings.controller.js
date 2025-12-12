import { validateBooking } from './bookings.model.js'

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getBookings(req, res) {
  try {
    res.sendStatus(200)
    // TODO: Implementar la lógica para obtener las reservas
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function createNewBooking(req, res) {
  try {
    const bookingData = req.body
    if (!bookingData) {
      return res.status(400).json({ message: 'Datos de la reserva no proporcionados' })
    }

    try {
      validateBooking(bookingData)
    } catch (err) {
      return res.status(400).json(err)
    }

    // TODO: Implementar la lógica para crear una nueva reserva

    res.sendStatus(201)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getOneBooking(req, res) {
  try {
    res.sendStatus(200)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function updateBooking(req, res) {
  try {
    const bookingData = req.body
    if (!bookingData) {
      return res.status(400).json({ message: 'Datos de la reserva no proporcionados' })
    }

    try {
      validateBooking(bookingData)
    } catch (err) {
      return res.status(400).json(err)
    }

    // TODO: Implementar la lógica para actualizar una reserva

    res.sendStatus(204)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function cancelBooking(req, res) {
  try {
    // TODO: Implementar la lógica para cancelar una reserva
    res.status(200).json({ message: 'Booking cancelled' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function extendBooking(req, res) {
  try {
    // TODO: Implementar la lógica para extender una reserva
    res.status(200).json({ message: 'Booking extended' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function deleteBooking(req, res) {
  try {
    // TODO: Implementar la lógica para eliminar una reserva
    res.status(200).json({ message: 'Booking deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

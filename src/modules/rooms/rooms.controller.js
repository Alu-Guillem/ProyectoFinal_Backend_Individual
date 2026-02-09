import { Room } from './rooms.model.js';

// GET api/rooms
export const getRoom = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener habitaciones' });
  }
};

// POST api/rooms
export const createRoom = async (req, res) => {
  try {
    const { nombre, tipo, numero, precio, ocupacion } = req.body

    if (
      isNaN(numero) ||
      isNaN(precio) ||
      isNaN(ocupacion)
    ) {
      return res.status(400).json({
        error: 'numero, precio y ocupacion deben ser números'
      })
    }

    const existingRoom = await Room.findOne({ nombre, tipo })

    if (existingRoom) {
      return res.status(409).json({
        error: 'Ya existe una habitación con ese nombre y tipo'
      })
    }

    const room = await Room.create(req.body)

    res.status(201).json(room)

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}


// PUT api/rooms/:id
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, tipo, numero, precio, ocupacion } = req.body

    if (
      (numero !== undefined && isNaN(numero)) ||
      (precio !== undefined && isNaN(precio)) ||
      (ocupacion !== undefined && isNaN(ocupacion))
    ) {
      return res.status(400).json({
        error: 'numero, precio y ocupacion deben ser números'
      })
    }

    if (nombre && tipo) {
      const existingRoom = await Room.findOne({
        nombre,
        tipo,
        _id: { $ne: id }
      })

      if (existingRoom) {
        return res.status(409).json({
          error: 'Ya existe otra habitación con ese nombre y tipo'
        })
      }
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    )

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
        error: 'Habitación no encontrada'
      })
    }

    res.json({
      message: 'Habitación eliminada correctamente',
      room: deletedRoom
    })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
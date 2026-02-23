import { escape } from 'querystring';
import { Room } from './rooms.model.js';

// GET api/rooms
export const getRoom = async (req, res) => {
  try {
    const { name, occuped, offer, minPrice, maxPrice } = req.query; // ?name=...&occuped=...&offer=...&minPrice=...&maxPrice=... 

    const filter = {};

    // Filtrar por nombre
    if (name) {
      filter.name = { $regex: name, $options: "i" }; 
    }

    // Filtrar por ocupación
    if (occuped !== undefined) {
      filter.occuped = occuped === "true";
    }

    // Filtrar por oferta
    if (offer !== undefined) {
      filter.offer = { $gt: 0 };
    }

    //Precio minimo y maximo
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }

    const rooms = await Room.find(filter);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener habitaciones' });
  }
};



//GET api/rooms/:id

export const getOneRoom = async (req, res) => {
  try{
    const room = await Room.findById(req.params.id)
    res.json(room)
  }catch(error){ res.status(500).json({ error: 'Error al obtener la habitacion'}) }

};




// POST api/rooms
export const createRoom = async (req, res) => {
  try {
    const { name, type, number, pricePerNight, occupancyLimit, description, offer } = req.body

    console.log("Datos recibidos:", req.body)

    if (
      isNaN(number) ||
      isNaN(pricePerNight) ||
      isNaN(occupancyLimit) ||
      (offer !== undefined && isNaN(offer))
    ) {
      return res.status(400).json({
        error: "numero, precio, ocupacion y oferta deben ser números"
      })
    }

    const existingRoom = await Room.findOne({ name, type })
    if (existingRoom) {
      return res.status(409).json({
        error: "Ya existe una habitación con ese nombre y tipo"
      })
    }

    //Imagen
    const roomData = {
      name,
      type,
      number,
      pricePerNight,
      occupancyLimit,
      description,
      offer
    }

    if (req.file) {
      roomData.image = `./uploads/${req.file.filename}`
    }

    const room = new Room(roomData)
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
        error: "numero, precio, ocupacion y oferta deben ser números"
      })
    }

    if (name && type) {
      const existingRoom = await Room.findOne({
        name,
        type,
        _id: { $ne: id }
      })

      if (existingRoom) {
        return res.status(409).json({
          error: "Ya existe otra habitación con ese nombre y tipo"
        })
      }
    }

    const roomData = req.body

    if (req.file) {
      roomData.image = `./uploads/${req.file.filename}`
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      roomData,
      { new: true, runValidators: true }
    )

    if (!updatedRoom) {
      return res.status(404).json({ error: "Habitación no encontrada" })
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

    const room = await Room.findById(id)

    if (!room) {
      return res.status(404).json({ error: 'Habitación no encontrada' })
    }

    if (room.occuped) {
      return res.status(400).json({
        error: 'No se puede eliminar una habitación reservada'
      })
    }

    await Room.findByIdAndDelete(id)

    res.json({
      message: 'Habitación eliminada correctamente',
      room
    })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
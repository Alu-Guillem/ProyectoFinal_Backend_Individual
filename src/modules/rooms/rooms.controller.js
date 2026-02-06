import { Room } from './rooms.model.js';

// GET /habitaciones
export const getRoom = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener habitaciones' });
  }
};

// POST /habitaciones
export const createRoom = async (req, res) => {
  try {
    const nuevaHabitacion = new Room(req.body);
    await nuevaHabitacion.save();
    res.status(201).json(nuevaHabitacion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};




export const getCheck = (req, res) => {
  res.json({ ok: true, message: 'Rooms endpoint works' })
}
import { User } from '../users/users.model.js'
import { validateLogin } from './auth.model.js'
import bcrypt from 'bcrypt'

export async function login(req, res) {
  try {
    const userData = req.body

    if (!userData) {
      return res.status(400).json({ message: 'Datos de usuarios no proporcionados' })
    }

    let validatedLogin
    try {
      validatedLogin = validateLogin(userData)
    } catch (err) {
      return res.status(400).json(err)
    }

    const { email, password } = validatedLogin

    const user = await User.findOne({ email }).select('+password')
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) return res.status(404).json({ message: 'La contraseña es invalida' })

    res.status(201).json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

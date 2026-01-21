import { JWT_SECRET } from '#r/constants.js'
import { getAge, parseDate } from '../commons/index.js'
import { Customer, User, validateCustomer } from '../users/users.model.js'
import { hashPassword } from '../users/utils/index.js'
import { validateLogin } from './auth.model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export async function register(req, res) {
  try {
    const userData = req.body

    if (!userData) {
      return res.status(400).json({ message: 'Datos de usuarios no proporcionados' })
    }

    let validatedCustomer
    try {
      validatedCustomer = validateCustomer(userData)
    } catch (err) {
      return res.status(400).json(err)
    }
    const birthDate = parseDate(validatedCustomer.birthDate)
    const password = await hashPassword(validatedCustomer.password)

    const age = getAge(birthDate)
    if (age < 18) {
      return res.status(400).json({ message: 'Has de ser mayor de edad para poder registrarte' })
    }

    const newCustomer = new Customer({
      ...validatedCustomer,
      birthDate,
      password,
    })

    const customerSaved = await newCustomer.save()

    res.status(201).send(customerSaved)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' })
    }
    res.status(500).json({ message: 'Error del servidor' })
  }
}

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

    const accesToken = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET)

    res.status(200).send({ token: accesToken })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

export async function logut(req, res) {
  res.status(200).json({
    message: 'Logout realizado correctamente',
  })
}

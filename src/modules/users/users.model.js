import { model, Schema } from 'mongoose'
import { formatDate } from '#commons/index.js'
import {
  isRequired,
  validateSchema,
  isValidDate,
  minLength,
  isValidEmail,
  isValidDNI,
  isValidEmployeeRole,
} from '#libs/validation/index.js'

/**
 * Esquema de Usuario (UserSchema) para MongoDB utilizando Mongoose.
 * Este esquema representa un usuario genérico con campos comunes.
 *
 * @typedef {Object} UserSchema
 * @property {string} email - El correo electrónico del usuario. Debe ser único y es obligatorio.
 * @property {string} role - El rol del usuario. Puede ser 'admin', 'employee' o 'customer'. Por defecto es 'customer'.
 * @property {string} name - El nombre del usuario. Es obligatorio.
 * @property {string} lastName - El apellido del usuario. Es obligatorio.
 * @property {string} password - La contraseña del usuario. Es obligatoria, no sera mostrada con un /GET.
 * @property {string} [photo] - La URL de la foto del cliente. Es opcional.
 */
export const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['customer', 'admin', 'employee'],
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    photo: {
      type: String,
    },
  },
  {
    discriminatorKey: 'role',
    collection: 'users',
  },
)

/**
 * Esquema de Empleado (EmployeeSchema) para MongoDB utilizando Mongoose.
 * Este esquema extiende el UserSchema y añade campos específicos para empleados.
 *
 * @typedef {Object} EmployeeSchema
 * @property {string} role - El rol del empleado. Puede ser 'admin' o 'employee'. Es obligatorio.
 */
const EmployeeSchema = new Schema(
  {},
  {
    toJSON: {
      transform(_doc, ret) {
        ret.userId = ret._id.toString()
        delete ret._id
        delete ret.password
        delete ret.__v
        return ret
      },
    },
  },
)

/**
 * Esquema de Cliente (CustomerSchema) para MongoDB utilizando Mongoose.
 * Este esquema extiende el UserSchema y añade campos específicos para clientes.
 *
 * @typedef {Object} CustomerSchema
 * @property {Date} birth_date - La fecha de nacimiento del cliente. Es obligatoria.
 * @property {string} gender - El género del cliente. Es obligatorio.
 * @property {string} [city] - La ciudad del cliente. Es opcional.
 * @property {string} [vip] - Estado vip del cliente
 */
const CustomerSchema = new Schema(
  {
    birthDate: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['masculino', 'femenino', 'prefiero no decirlo'],
      required: true,
    },
    dni: {
      type: String,
      required: true,
    },
    city: {
      type: String,
    },
    vip: {
      type: Boolean,
    },
  },
  {
    toJSON: {
      transform(_doc, ret) {
        ret.userId = ret._id.toString()
        delete ret._id
        delete ret.__v
        delete ret.password
        ret.birthDate = formatDate(ret.birthDate)
        return ret
      },
    },
  },
)

export const User = model('User', UserSchema)

export const Customer = User.discriminator('customer', CustomerSchema)

export const Admin = User.discriminator('admin', EmployeeSchema)

export const Employee = User.discriminator('employee', EmployeeSchema)

export const EmployeeInputSchema = {
  email: [isRequired('email del usuario'), isValidEmail('email')],
  firstName: [isRequired('nombre del usuario')],
  lastName: [isRequired('apellidos del usuario')],
  password: [isRequired('contraseña del usuario'), minLength('contraseña', 8)],
  role: [isRequired('rol del usuario'), isValidEmployeeRole('rol')],
}

export const CustomerInputSchema = {
  email: [isRequired('email del usuario'), isValidEmail('email')],
  firstName: [isRequired('nombre del usuario')],
  lastName: [isRequired('apellidos del usuario')],
  password: [isRequired('contraseña del usuario'), minLength('contraseña', 8)],
  birthDate: [isRequired('fecha de nacimiento del usuario'), isValidDate('fecha de nacimiento')],
  gender: [isRequired('genero del usuario')],
  dni: [isRequired('dni del usuario'), isValidDNI('dni')],
  city: [],
  vip: [],
}

/**
 * Valida los datos de un cliente
 * @param {Object} customerData - Datos de la reserva a validar
 * @returns {Object} - true si todas las validaciones pasan
 * @throws {Error} - Lanza un error si alguna validación falla
 */
export const validateCustomer = customerData => {
  return validateSchema(CustomerInputSchema, customerData)
}

/**
 * Valida los datos de un empleado
 * @param {Object} employeeData - Datos de la reserva a validar
 * @returns {Object} - true si todas las validaciones pasan
 * @throws {Error} - Lanza un error si alguna validación falla
 */
export const validateEmployee = employeeData => {
  return validateSchema(EmployeeInputSchema, employeeData)
}

/**
 * @type {import('types').ValidationSchema}
 */
export const UserUpdateSchema = {
  vip: [],
  firstName: [],
  lastName: [],
  password: [minLength('contraseña', 8)],
  birthDate: [isValidDate('fecha de nacimiento')],
}

/**
 * Valida los datos de actualización de una reserva
 * @param {Object} userData - Datos a validar
 * @returns {Object} - Datos validados
 * @throws {Error} - ValidationError
 */
export const validateUserUpdate = userData => {
  return validateSchema(UserUpdateSchema, userData)
}

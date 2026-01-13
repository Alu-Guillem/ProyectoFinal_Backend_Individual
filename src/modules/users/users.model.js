import { model, Schema } from 'mongoose'

/**
 * Esquema de Usuario (UserSchema) para MongoDB utilizando Mongoose.
 * Este esquema representa un usuario genérico con campos comunes.
 *
 * @typedef {Object} UserSchema
 * @property {string} email - El correo electrónico del usuario. Debe ser único y es obligatorio.
 * @property {string} role - El rol del usuario. Puede ser 'admin', 'employee' o 'customer'. Por defecto es 'customer'.
 * @property {string} firstName - El nombre del usuario. Es obligatorio.
 * @property {string} lastName - El apellido del usuario. Es obligatorio.
 * @property {string} password - La contraseña del usuario. Es obligatoria.
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
      enum: ['admin', 'employee', 'customer'],
      default: 'customer',
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
 * @property {boolean} isAdmin - Indica si el empleado tiene privilegios de administrador. Es obligatorio.
 */
const EmployeeSchema = new Schema({
  isAdmin: {
    type: Boolean,
    required: true,
  },
})

/**
 * Esquema de Cliente (CustomerSchema) para MongoDB utilizando Mongoose.
 * Este esquema extiende el UserSchema y añade campos específicos para clientes.
 *
 * @typedef {Object} CustomerSchema
 * @property {Date} birth_date - La fecha de nacimiento del cliente. Es obligatoria.
 * @property {string} gender - El género del cliente. Es obligatorio.
 * @property {string} [city] - La ciudad del cliente. Es opcional.
 * @property {string} [photo] - La URL de la foto del cliente. Es opcional.
 */
const CustomerSchema = new Schema({
  birth_date: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  city: {
    type: String,
  },
  photo: {
    type: String,
  },
})

export const User = model('User', UserSchema)

export const Customer = User.discriminator('customer', CustomerSchema)
export const Employee = User.discriminator('employee', EmployeeSchema)

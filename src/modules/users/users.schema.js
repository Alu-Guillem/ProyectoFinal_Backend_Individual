/**
 * @fileoverview Esquema de validación para la colección 'users' en MongoDB.
 * @module modules/users/users.schema
 *
 * Define el esquema de validación JSON Schema para la colección de usuarios.
 * Utiliza el comando `collMod` de MongoDB para aplicar la validación estricta.
 *
 * @requires mongoo
 * */
import mongoose from 'mongoose'

/**
 * Esquema de validación para la colección 'users' usuario Customer.
 * @constant {object}
 * @private
 */
const UsersCollectionSchema = {
  collMod: 'users',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'firstName', 'lastName', 'password', 'role'],
      properties: {
        email: {
          bsonType: 'string',
          description: 'El email del usuario',
          pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$',
        },
        firstName: {
          bsonType: 'string',
          description: 'El nombre',
        },
        lastName: {
          bsonType: 'string',
          description: 'El apellido',
        },
        password: {
          bsonType: 'string',
          minLength: 8,
          description: 'La contraseña',
        },
        role: {
          bsonType: 'string',
          enum: ['customer', 'admin', 'employee'],
          description: 'El rol del usuario',
        },
        photo: { bsonType: 'string' },
      },
      oneOf: [
        {
          properties: { role: { enum: ['admin', 'employee'] } },
          not: {
            anyOf: [
              {
                required: ['dni'],
              },
              {
                required: ['gender'],
              },
              {
                required: ['birthDate'],
              },
              {
                required: ['city'],
              },
              {
                required: ['vip'],
              },
            ],
          },
        },
        {
          required: ['dni', 'gender', 'birthDate'],
          properties: {
            role: { enum: ['customer'] },
            dni: {
              bsonType: 'string',
              pattern: '^[0-9]{8}[A-Za-z]$',
            },
            gender: {
              bsonType: 'string',
              enum: ['masculino', 'femenino', 'prefiero no decirlo'],
            },
            birthDate: {
              bsonType: 'date',
              description: 'La fecha de nacimiento del usuario',
            },
            city: {
              bsonType: 'string',
              description: 'La ciudad del ususario',
            },
            vip: {
              bsonType: 'bool',
              description: 'Estado vip del usuario',
            },
          },
        },
      ],
    },
  },
  validationLevel: 'strict',
  validationAction: 'error',
}
/**
 * Aplica el esquema de validación a la colección 'users' en la base de datos.
 *
 * @function
 * @returns {Promise<object>} Resultado del comando MongoDB
 * @example
 * import applyCustomerSchema from './users.schema.js'
 * await applyCustomerSchema()
 */
export default async () => mongoose.connection.db.command(UsersCollectionSchema)

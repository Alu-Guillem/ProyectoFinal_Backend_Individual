import { SALT_ROUNDS } from '#r/constants.js'
import bcrypt from 'bcrypt'

/**
 * Genera un hash seguro para una contraseña utilizando el algoritmo bcrypt.
 * * @async
 * @function hashPassword
 * @param {string} password - La contraseña en texto plano que se desea cifrar.
 * @returns {Promise<string>} Una promesa que resuelve con la contraseña cifrada (hash).
 * @throws {Error} Si ocurre un error durante el proceso de cifrado o si las rondas de sal son inválidas.
 * * @example
 * const hash = await hashPassword('miPassword123');
 */
export async function hashPassword(password) {
  const saltRounds = Number(SALT_ROUNDS)
  return await bcrypt.hash(password, saltRounds)
}

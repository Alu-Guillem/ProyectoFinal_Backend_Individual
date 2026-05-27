import { isRequired, validateSchema, minLength, isValidEmail } from '#libs/validation/index.js'

export const LoginInputSchema = {
  email: [isRequired('email del usuario'), isValidEmail('email')],
  password: [isRequired('contraseña del usuario'), minLength('contraseña', 8)],
}

export const validateLogin = loginData => {
  return validateSchema(LoginInputSchema, loginData)
}

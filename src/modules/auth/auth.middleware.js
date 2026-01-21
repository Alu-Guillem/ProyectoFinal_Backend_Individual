import { JWT_SECRET } from '#r/constants.js'
import jwt from 'jsonwebtoken'

export function sessionMiddleware(req, res, next) {
  const { authorization } = req.headers
  if (!authorization || !authorization.startsWith('Bearer ')) {
    req.session = null
    return next()
  }

  // 🔹 Extraer SOLO el token
  const token = authorization.split(' ')[1]

  try {
    /** @type {import('types').Session} */ // @ts-ignore
    const payload = jwt.verify(token, JWT_SECRET)

    req.session = {
      userId: payload.userId,
      role: payload.role,
    }

    return next()
  } catch (err) {
    req.session = null
    return next()
  }
}

/**
 * @param {import('types').AuthenticatedRequest} req
 * @param {import('express').Response} res
   @param {import('express').NextFunction} next
 */
export function authMiddleware(req, res, next) {
  if (!req.session) return res.status(401).json({ message: 'Inicia sesión para continuar' })
  next()
}

/*
 * for testing u can use this token:
 * eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJyb2xlIjoiY3VzdG9tZXIifQ.UBpM2lu2z7MgBCL0gK7KcxcIGWcDHgoOfGtjau9Kowg
 */

/**
 * @param {('admin' | 'customer' | 'employee')[]} roles
 */
export const requireRole = roles => {
  /**
 * @param {import('types').AuthenticatedRequest} req
 * @param {import('express').Response} res
   @param {import('express').NextFunction} next
 */
  return (req, res, next) => {
    if (!roles.includes(req.session.role))
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' })

    next()
  }
}

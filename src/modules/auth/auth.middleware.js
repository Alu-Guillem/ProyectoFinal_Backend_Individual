export function authMiddleware(req, res, next) {
  req.session = {}
  req.session.userId = '507f1f77bcf86cd799439011'
  req.session.role = 'customer'
  next()
}
export function requireRole(role) {
  return (req, res, next) => {
    next()
  }
}

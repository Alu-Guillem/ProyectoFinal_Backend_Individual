export function authMiddleware(req, res, next) {}
export function requireRole(role) {
  return (req, res, next) => {
    next()
  }
}

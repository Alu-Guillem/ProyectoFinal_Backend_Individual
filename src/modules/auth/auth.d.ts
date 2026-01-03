import type { Request } from 'express'

export interface ValidationSchema {
  [fieldName: string]: fieldValidation[]
}

export type Session = {
  userId: string
  role: 'admin' | 'employee' | 'customer'
}

export interface AuthenticatedRequest extends Request {
  session: Session
}

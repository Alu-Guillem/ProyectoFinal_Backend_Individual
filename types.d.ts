import type { Request } from 'express'

export type commonValidation = (fieldName: string) => fieldValidation

export type fieldValidation = (value: any) => boolean

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

export * from '#modules/bookings/bookings.d.ts'

export type commonValidation = (fieldName: string) => fieldValidation

export type fieldValidation = (value: any) => boolean

export * from '#modules/bookings/bookings.d.ts'
export * from '#modules/reviews/reviews.d.ts'
export * from '#modules/auth/auth.d.ts'

export type commonValidation = (fieldName: string) => fieldValidation

export type fieldValidation = (value: any) => boolean

export interface ValidationSchema {
  [fieldName: string]: fieldValidation[]
}

export function required(value: unknown): boolean | string {
  if (value === null || value === undefined || value === '') return 'This field is required'
  if (typeof value === 'string' && !value.trim()) return 'This field is required'
  return true
}

export function positiveNumber(value: unknown): boolean | string {
  const num = Number(value)
  if (isNaN(num) || num <= 0) return 'Must be a positive number'
  return true
}

export function minLength(min: number): (value: string) => boolean | string {
  return (value: string) => value.length >= min || `Must be at least ${min} characters`
}

export interface Course {
  id: number
  name: string
  description: string
  cover: string
  status: number
}

export interface MyCourse extends Course {
  progress: number
  selectedAt?: string
}

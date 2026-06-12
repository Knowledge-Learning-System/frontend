export interface Course {
  id: number
  name: string
  description: string
  cover: string
  status: number
  instructor: string
}

export interface MyCourse extends Course {
  progress: number
  selectedAt?: string
}

import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { z } from 'zod'

export class ApiResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
  error?: ApiError

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: any, error?: ApiError) {
    this.data = data
    this.error = error
  }
}

export class ApiError extends Error {
  message: string | ApiErrorCode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any
  statusCode: number

  constructor(
    message: ApiErrorCode | string = ApiErrorCode.INTERNAL_ERROR,
    statusCode = 500,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any = {}
  ) {
    super(message)
    this.message = message
    this.metadata = metadata
    this.statusCode = statusCode
    Object.setPrototypeOf(this, new.target.prototype)
  }

  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      metadata: this.metadata,
    }
  }
}

export enum ApiErrorCode {
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INPUT_VALIDATION_ERROR = 'INPUT_VALIDATION_ERROR',
}

export enum MeditationExpertise {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum MeditationType {
  THOUGHT = 'THOUGHT',
  SOUND = 'SOUND',
  FORM = 'FORM',
  VISUALIZATION = 'VISUALIZATION',
  NOTHINGNESS = 'NOTHINGNESS',
}

// joy / love / peaceful / feeling gratitude / acceptance
export enum OUTPUT_EMOTION {
  JOY = 'JOY',
  LOVE = 'LOVE',
  PEACEFUL = 'PEACEFUL',
  FEELING_GRATITUDE = 'FEELING_GRATITUDE',
  ACCEPTANCE = 'ACCEPTANCE',
}

// peaceful / sad / upset / anxious / fearful / lonely / guilty / depressed
export enum INPUT_EMOTION {
  PEACEFUL = 'PEACEFUL',
  SAD = 'SAD',
  UPSET = 'UPSET',
  ANXIOUS = 'ANXIOUS',
  FEARFUL = 'FEARFUL',
  LONELY = 'LONELY',
  GUILTY = 'GUILTY',
  DEPRESSED = 'DEPRESSED',
}

export const MeditationFormSchema = z.object({
  username: z.string().min(3).max(20),
  meditationExpertise: z.nativeEnum(MeditationExpertise),
  meditationType: z.nativeEnum(MeditationType),
  fromEmotion: z.nativeEnum(INPUT_EMOTION),
  toEmotion: z.nativeEnum(OUTPUT_EMOTION),
})

export type MeditationForm = z.infer<typeof MeditationFormSchema>

export enum MeditationStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export type Meditation = {
  id: string
  username: string
  meditationExpertise: MeditationExpertise
  meditationType: MeditationType
  fromEmotion: INPUT_EMOTION
  toEmotion: OUTPUT_EMOTION
  createdAt: FieldValue | Timestamp
  updatedAt: FieldValue | Timestamp
  status: MeditationStatus
  script: string | null
  link: string | null
}

export enum FirestoreCollection {
  MEDITATIONS = 'meditations',
}

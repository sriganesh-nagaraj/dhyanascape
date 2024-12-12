import { z } from 'zod'

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
  status: MeditationStatus
  script: string | null
  link: string | null
}

export enum FirestoreCollection {
  MEDITATIONS = 'meditations',
}

import { z } from 'zod'

export enum MeditationExpertise {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum MeditationType {
  BREATH = 'BREATH',
  SOUND = 'SOUND',
  FORM = 'FORM',
  VISUALIZATION = 'VISUALIZATION',
}

export enum OUTPUT_EMOTION {
  JOY = 'JOY',
  LOVE = 'LOVE',
  PEACE = 'PEACE',
  GRATITUDE = 'GRATITUDE',
  ACCEPTANCE = 'ACCEPTANCE',
}

export enum INPUT_EMOTION {
  ANXIETY = 'ANXIETY',
  FEAR = 'FEAR',
  GUILT = 'GUILT',
  ANGER = 'ANGER',
  SADNESS = 'SADNESS',
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

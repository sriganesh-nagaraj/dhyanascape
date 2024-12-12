import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextFunction, Request, Response, Router } from 'express'
import { FieldValue } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as util from 'util'
import { v4 as uuidv4 } from 'uuid'

import * as textToSpeech from '@google-cloud/text-to-speech'
import * as ffmpegPath from 'ffmpeg-static'
import * as ffmpeg from 'fluent-ffmpeg'
import {
  ApiError,
  ApiErrorCode,
  ApiResponse,
  FirestoreCollection,
  Meditation,
  MeditationForm,
  MeditationFormSchema,
  MeditationStatus,
  MeditationType,
} from '../models'
import { firestoreDb, storage } from '../utils/config'
import { requestValidator } from '../utils/middleware'
import { getDownloadURL } from 'firebase-admin/storage'

export const meditationsController = Router()

meditationsController.get('/:id', async (request: Request, response, next) => {
  try {
    const meditationId = request.params.id
    const meditation = await firestoreDb.collection(FirestoreCollection.MEDITATIONS).doc(meditationId).get()
    if (!meditation.exists) {
      response.status(404).json(new ApiResponse({}))
    } else {
      response.status(200).json(new ApiResponse(meditation.data()))
    }

  } catch (error) {
    next(error)
  }
})

meditationsController.post(
  '/',
  requestValidator(MeditationFormSchema),
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const meditationForm = request.body as MeditationForm
      const meditationId = uuidv4()
      const meditation: Meditation = {
        id: meditationId,
        username: meditationForm.username,
        meditationExpertise: meditationForm.meditationExpertise,
        meditationType: meditationForm.meditationType,
        fromEmotion: meditationForm.fromEmotion,
        toEmotion: meditationForm.toEmotion,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        status: MeditationStatus.PENDING,
        script: null,
        link: null,
      }

      await firestoreDb
        .collection(FirestoreCollection.MEDITATIONS)
        .doc(meditationId)
        .set(meditation)

      response.status(201).json(new ApiResponse(meditation))
    } catch (error) {
      next(error)
    }
  }
)

export async function processMeditation(meditation: Meditation) {
 try {
  const script = await generateMeditationScript(meditation)
  meditation.script = script
  await generateGuidedMeditationTrack(meditation)
  await mergeGuidedMeditationTrackWithBackgroundMusic(meditation)
  const link = await uploadMergedTrackToFirebaseStorage(meditation)
  await updateMeditationStatusWithMetadata(
    meditation.id,
    MeditationStatus.COMPLETED,
    script,
    link
    )
  console.log('Meditation processed successfully')
  } catch (error) {
    console.error('Error processing meditation', error)
    await updateMeditationStatusWithMetadata(
      meditation.id,
      MeditationStatus.FAILED,
      null,
      null
    )
  }
}

async function updateMeditationStatusWithMetadata(
  meditationId: string,
  status: MeditationStatus,
  script: string | null,
  link: string | null
) {
  await firestoreDb
    .collection(FirestoreCollection.MEDITATIONS)
    .doc(meditationId)
    .update({ status, script, link })
}

async function generateMeditationScript(meditation: Meditation) {
  const prompt = getBasePromptForscript(meditation)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })
  const result = await model.generateContent(prompt)
  let script = result.response.text()
  script = script
    .replaceAll('```', '')
    .replaceAll('xml', '')
    .replaceAll('ssml', '')
  console.log(script)
  return script
}

function getBasePromptForscript(meditation: Meditation) {
  switch (meditation.meditationType) {
    case MeditationType.BREATH:
    case MeditationType.SOUND:
    case MeditationType.FORM:
    case MeditationType.VISUALIZATION:
      return `
  Generate a personalized guided meditation for a beginner named ${meditation.username}, helping them transform the feeling of ${meditation.fromEmotion} into a sense of [goal emotion]. 
  Return ONLY the SSML content without any markdown formatting, starting with <speak> and ending with </speak> that can be fed into a TTS model.
  The meditation should include:
	1.	Introduction:
  -	Start with a pause of 5 seconds using <break time="5s"/>).
	-	Instruct ${meditation.username} to sit comfortably with a straight back, relaxed shoulders, eyes closed, hands in their lap, and a gentle smile.
	-	Begin with a deep exhalation to release tension, followed by a slow, deep inhalation.
	-	Repeat this breath cycle twice to help ${meditation.username} settle in.
	2.	Main Body:
	-	Gently guide ${meditation.username} to recognize and acknowledge the input emotion (e.g., loneliness, anxiety) without judgment.
	-	Provide steps for ${meditation.username} to release the input emotion through breathwork and visualization.
	-	Incorporate a peaceful, natural setting (e.g., a forest, beach, or meadow) with vivid sensory details to create a calming atmosphere. Use the natural setting to give instructions for the user to feel the goal emotion.
	-	Introduce a breathwork exercise (e.g., inhale for 4 seconds, hold for 2, exhale for 6) to help anchor the goal emotion.
	3.	Conclusion:
	-	Invite ${meditation.username} to gently return to their body and surroundings.
	-	Suggest that they wiggle their fingers and toes, take a final deep breath, and open their eyes when ready.
	-	Remind ${meditation.username} to carry the sense of [goal emotion] with them as they continue their day.
Requirements:
	-	Follow a clear structure: introduction, main body, and conclusion.
	-	Use ${meditation.username} sparingly for a personalized touch without overuse.
	-	Include vivid sensory details to enhance visualization.
	-	Provide explicit breathwork instructions.
	-	Use gentle, reassuring language to facilitate the emotional transition.
  - The response should be a SSML script that can be fed into a TTS model.
Use SSML tags for:
- Pauses: <break time="Xs"/>
- Emphasis: <emphasis>important words</emphasis>
- Prosody: <prosody rate="slow">slower speech</prosody>
- Breathing space: <break time="3s"/>`
  }
}

async function generateGuidedMeditationTrack(meditation: Meditation) {
  const ttsClient = new textToSpeech.TextToSpeechClient()
  const [response] = await ttsClient.synthesizeSpeech({
    input: {
      ssml: meditation.script,
    },
    voice: {
      languageCode: 'en-US',
      name: 'en-AU-Wavenet-A',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.85,
    },
  })

  // Save the audio to a file
  const writeFile = util.promisify(fs.writeFile)
  const audioFilePath = `${meditation.id}-guided-track.mp3`
  await writeFile(audioFilePath, response.audioContent as any, 'binary')
}

async function mergeGuidedMeditationTrackWithBackgroundMusic(meditation: Meditation) {
  ffmpeg.setFfmpegPath(ffmpegPath as unknown as string)
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('music-1.mp3')
      .input(`${meditation.id}-guided-track.mp3`)
      .complexFilter([
        {
          filter: 'volume',
          options: '0.5',
          inputs: '0',
          outputs: 'quietMusic',
        },
        {
          filter: 'amix',
          options: {
            inputs: 2,
            duration: 'shortest',
          },
          inputs: ['quietMusic', '1'],
          outputs: 'mixed',
        },
        {
          filter: 'volume',
          options: '2',
          inputs: 'mixed',
        },
      ])
      .toFormat('mp3')
      .on('error', (err) => {
        console.error('An error occurred:', err)
        reject(err)
      })
      .on('end', () => {
        console.log('Audio merging completed successfully')
        resolve('merged-track.mp3')
      })
      .save(`${meditation.id}-merged-track.mp3`)
  })
}

async function uploadMergedTrackToFirebaseStorage(meditation: Meditation) {
  const sourceFilePath = `${meditation.id}-merged-track.mp3`
  const bucket = storage.bucket('gs://dhyanascape-f1433.firebasestorage.app')
  const file = bucket.file(sourceFilePath)

  // Read the local file and upload its contents
  await bucket.upload(sourceFilePath, {
    destination: `${meditation.id}-merged-track.mp3`,
    metadata: {
      contentType: 'audio/mpeg',
    },
    public: true,
  })

  const url = await getDownloadURL(file)
  console.log(url)
  return url
}

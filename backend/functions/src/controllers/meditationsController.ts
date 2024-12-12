import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextFunction, Request, Response, Router } from 'express'
import { FieldValue } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as util from 'util'
import { v4 as uuidv4 } from 'uuid'

import * as textToSpeech from '@google-cloud/text-to-speech'
import * as ffmpegPath from 'ffmpeg-static'
import { getDownloadURL } from 'firebase-admin/storage'
import * as ffmpeg from 'fluent-ffmpeg'
import {
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

export const meditationsController = Router()

meditationsController.get('/:id', async (request: Request, response, next) => {
  try {
    const meditationId = request.params.id
    const meditation = await firestoreDb
      .collection(FirestoreCollection.MEDITATIONS)
      .doc(meditationId)
      .get()
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
  } finally {
    await deleteFiles(meditation)
  }
}

async function deleteFiles(meditation: Meditation) {
  fs.unlinkSync(`${meditation.id}-guided-track.mp3`)
  fs.unlinkSync(`${meditation.id}-merged-track.mp3`)
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
  const prompt = getFinalPromptForscript(meditation)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
  const result = await model.generateContent(prompt)
  let script = result.response.text()
  script = script
    .replaceAll('```', '')
    .replaceAll('xml', '')
    .replaceAll('ssml', '')
  console.log('Initial script', script)

  // const refiningPrompt = `
  // Given SSML script to be fed into a TTS model, include a <break time="500ms"/> wherever there is comma or full stop with a space after it. Return ONLY the improved SSML script WITHOUT ANY MARKDOWN FORMATTING, starting with <speak> and ending with </speak> that can be fed into a TTS model.:

  // ${script}
  // `
  // const refiningResult = await model.generateContent(refiningPrompt)
  // let refinedScript = refiningResult.response.text()
  // refinedScript = refinedScript
  //   .replaceAll('```', '')
  //   .replaceAll('xml', '')
  //   .replaceAll('ssml', '')
  // console.log('Refined script', refinedScript)
  const refinedScript = script.replaceAll(',', ', <break time="1s"/>')
  console.log('Refined script', refinedScript)
  return refinedScript
}

function getFinalPromptForscript(meditation: Meditation) {
  const fromEmotion = meditation.fromEmotion.toLowerCase().replace('_', ' ')
  const toEmotion = meditation.toEmotion.toLowerCase().replace('_', ' ')
  const meditationTypePrompt = getPromptForMeditationType(
    meditation.meditationType,
    fromEmotion,
    toEmotion
  )

  const prompt = `
  Generate a personalized guided meditation for a beginner named ${meditation.username}. 
  Return ONLY the SSML content WITHOUT ANY MARKDOWN FORMATTING, starting with <speak> and ending with </speak> that can be fed into a TTS model.
  Use SSML tags for:
  - Pauses: <break time="Xs"/>
  - Emphasis: <emphasis>important words</emphasis>
  - Prosody: <prosody rate="slow">slower speech</prosody>
  - Breathing space: <break time="3s"/>
  
  Guidelines for Script Creation
  1. Begin with Instructions for Settling In:
    - Start with a pause of 10 seconds
    - Instruct the user to sit comfortably with a straight back, relaxed shoulders, hands in their lap, and eyes closed.
    - Invite them to wear a gentle smile.
    - Guide them through FIVE INHALATIONS and FIVE EXHALATIONS to settle in.
  2. Structure the Meditation:
    - Introduction: Set the tone and context of the meditation.
    - Main Body: Guide the user from ${fromEmotion} to ${toEmotion} using appropriate techniques. Incorporate ample pauses and reminders to maintain focus.
      ${meditationTypePrompt}
    - Conclusion: Gently bring the user back to the present moment, reconnecting with their body and surroundings.
  3. Final Call to Action:
    - Encourage the user to carry the feeling of ${toEmotion} throughout their day.
  `
  return prompt
}

function getPromptForMeditationType(
  meditationType: MeditationType,
  fromEmotion: string,
  toEmotion: string
) {
  switch (meditationType) {
    case MeditationType.SOUND:
      return `
      a. Guide the user to focus on the sound or music playing in the background.
      b. Encourage them to notice details such as tone, rhythm, and subtle changes.
      c. Every 10 seconds, gently remind them: "If your mind wanders, gently return your attention to the sound."
      d. Explore different aspects of the sound each time, like: The depth, pitch, or how the sound resonates within them.
      e. Allow the sound to lead them from ${fromEmotion} to ${toEmotion}.
  `
    case MeditationType.FORM:
      return `
      a. Ask the user to observe a picture of a deity or form they resonate with.
      b. Guide them to notice details like the face, expression, ornaments, and body structure.
      c. Instruct them to close their eyes and visualize the form vividly.
      d. Every 10 seconds, prompt: "Hold the form in your mind's eye, noticing each detail."
      e. After 30 seconds, instruct them to: "Open your eyes, observe the image again, and close your eyes to visualize it."
      f. Repeat this process three times.
      g. Conclude by guiding them to visualize prostrating before the deity and feeling love radiating from the form.
      h. Suggest they recall this form for 5 seconds, four times throughout their day.
  `
    case MeditationType.THOUGHT:
      return `
      a. Guide the user to observe thoughts as passing clouds, without judgment.
      b. Use prompts like: "Notice the thought… let it drift away."
      c. Offer new metaphors for thought observation if the same inputs are repeated (e.g., leaves floating down a stream, ripples in a pond).
      d. Transition from ${fromEmotion} to ${toEmotion} by shifting focus to positive affirmations or reflections.
  `
    case MeditationType.NOTHINGNESS:
      return `
      a. Instruct the user to focus on the space between thoughts.
      b. Use ample silence and encourage moments of emptiness.
      c. Vary the instructions by offering prompts like: "Rest in the stillness… let it expand." or "Allow yourself to dissolve into the silence."
  `
    case MeditationType.VISUALIZATION:
      return `
      a. Create a rich mental scene to transition from ${fromEmotion} to ${toEmotion}.
      b. Include sensory details such as:
          b1. Sights: Landscapes, colors, or light patterns.
          b2.	Sounds: Birds, flowing water, or rustling leaves.
          b3.	Textures: Soft grass, warm sunlight, or a gentle breeze.
      c. Vary the visualization each time by changing the setting (e.g., a forest, a beach, or a mountain path).
  `
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
      name: 'en-IN-Wavenet-F',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.75,
    },
  })

  // Save the audio to a file
  const writeFile = util.promisify(fs.writeFile)
  const audioFilePath = `${meditation.id}-guided-track.mp3`
  await writeFile(audioFilePath, response.audioContent as any, 'binary')
}

async function mergeGuidedMeditationTrackWithBackgroundMusic(
  meditation: Meditation
) {
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

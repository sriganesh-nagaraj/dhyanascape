'use client'

import { db } from '@/lib/utils'
import { Meditation, MeditationStatus } from '@/models'
import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'

export default function MeditationTrackPlayer({ id }: { id: string }) {
  const [meditation, setMeditation] = useState<Meditation | null>(null)
  useEffect(() => {
    // Use firebase snapshot listener to get the meditation track
    const meditationTrackRef = doc(db, 'meditations', id)
    const unsubscribe = onSnapshot(meditationTrackRef, (doc) => {
      console.log('Inside onSnapshot', doc.data())
      setMeditation(doc.data() as Meditation)
    })
    return () => unsubscribe()
  }, [id])

  if (meditation) {
    switch (meditation.status) {
      case MeditationStatus.PENDING:
        return <p className="text-2xl font-bold">Generating meditation...</p>
      case MeditationStatus.COMPLETED:
        return <audio src={meditation.link ?? ''} controls />
      case MeditationStatus.FAILED:
        return <div>Failed</div>
    }
  } else {
    return <div>Loading...</div>
  }
}

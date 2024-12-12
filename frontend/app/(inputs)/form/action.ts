'use server'

import { MeditationForm } from '@/models'
import { redirect } from 'next/navigation'

export async function submitForm(formData: MeditationForm) {
  console.log(
    'Submitting inside server action',
    process.env.NEXT_PUBLIC_BACKEND_URL,
    formData
  )
  // TODO: call api to create meditation
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/meditations`,
    {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
  if (response.status === 201) {
    const data = await response.json()
    console.log('Response from server', data)
    redirect(`/meditations/${data.data.id}`)
  } else {
    console.error('Failed to create meditation', response)
    throw new Error('Failed to create meditation')
  }
}

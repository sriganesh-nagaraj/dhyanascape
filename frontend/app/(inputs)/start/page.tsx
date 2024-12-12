'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
export default function StartPage() {
  const [username, setUsername] = useState('')
  const router = useRouter()
  const link = `/form?username=${username}`
  return (
    <div className="h-full flex gap-4 items-center">
      <Input
        className="w-full text-lg font-medium"
        placeholder="Enter your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            router.push(link)
          }
        }}
      />
      <Button
        onClick={() => router.push(link)}
        disabled={username.length === 0}
        className="text-lg font-medium"
      >
        Next
      </Button>
    </div>
  )
}

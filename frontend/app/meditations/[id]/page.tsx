import MeditationTrackPlayer from './meditationTrackPlayer'

export default async function MeditationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const id = (await params).id
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <MeditationTrackPlayer id={id} />
    </div>
  )
}

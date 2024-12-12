export default async function MeditationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const id = (await params).id
  return <div>Meditation {id}</div>
}

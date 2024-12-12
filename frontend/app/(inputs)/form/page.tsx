import InputsForm from './form'

export default async function FormPage({
  searchParams,
}: {
  searchParams: Promise<{ username: string }>
}) {
  const username = (await searchParams).username
  return <InputsForm username={username} />
}

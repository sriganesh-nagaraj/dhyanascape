export default function InputsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full h-[calc(100svh-100px)] max-w-96 mx-auto">
      {children}
    </div>
  )
}

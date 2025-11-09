import CommandInput from '../CommandInput'

export default function CommandInputExample() {
  return (
    <div className="relative w-full h-64 bg-background">
      <CommandInput
        onSubmit={(cmd) => console.log('Command submitted:', cmd)}
        disabled={false}
        shake={false}
      />
    </div>
  )
}

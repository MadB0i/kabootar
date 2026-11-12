import Fireworks from '../effects/Fireworks'

export default function NewYearScene({ animated }) {
  // Renders fireworks only — the viewer's cards carry all the text.
  if (!animated) return null
  return (
    <div className="relative w-full h-full overflow-hidden">
      <Fireworks />
    </div>
  )
}

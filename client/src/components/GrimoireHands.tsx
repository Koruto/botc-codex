import clockBig from '../../assets/grimoire/clock-big.png'
import clockSmall from '../../assets/grimoire/clock-small.png'

interface GrimoireHandsProps {
  /** If true, show the hands. */
  show: boolean
  /** Rotation angle for the big hand (voting clock). */
  rotationAngleDeg: number
  /** Rotation angle for the small hand (nominator). Null if no nominator. */
  nominatorAngleDeg: number | null
}

export function GrimoireHands({ show, rotationAngleDeg, nominatorAngleDeg }: GrimoireHandsProps) {
  if (!show) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-full"
      aria-hidden
    >
      {/* Big hand: rotates full circle from center when day/nomination is active */}
      <div
        className="grimoire-hand-appear absolute left-1/2 top-1/2 overflow-visible"
        style={{
          width: '55%',
          height: '55%',
          transformOrigin: '50% 100%',
          transform: `translate(-50%, -100%) rotate(${rotationAngleDeg}deg)`,
        }}
      >
        <img
          src={clockBig}
          alt=""
          className="h-full w-full object-contain object-bottom block"
          style={{ transform: 'translateY(50%)' }} // Nudge down to overlap center
        />
      </div>

      {nominatorAngleDeg != null && (
        <div
          className="grimoire-hand-appear absolute left-1/2 top-1/2"
          style={{
            width: '55%',
            height: '45%',
            transformOrigin: '50% 100%',
            transform: `translate(-50%, -100%) rotate(${nominatorAngleDeg}deg)`,
            animationDelay: '0.1s',
          }}
        >
          <img
            src={clockSmall}
            alt=""
            className="h-full w-full object-contain object-bottom block"
            style={{ transform: 'translateY(50%)' }}
          />
        </div>
      )}
    </div>
  )
}

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHand, faXmark, faThumbsUp, faSkull } from '@fortawesome/free-solid-svg-icons'
import shroudImg from '../../assets/shroud.png'

export interface GrimoireTokenOverlaysProps {
  index: number
  showNominationHands: boolean
  votesForIndices: number[]
  revealedHandIndices: Set<number>
  isTokenPassed: (i: number) => boolean
  rotationDoneDisplay: boolean
  executedPlayerIndex: number | null
  isDay: boolean
  isPreGame?: boolean
  nightIconUrl: string | null
  name: string | null
  isDead: boolean
}

export function GrimoireTokenOverlays({
  index,
  showNominationHands,
  votesForIndices,
  revealedHandIndices,
  isTokenPassed,
  rotationDoneDisplay,
  executedPlayerIndex,
  isDay,
  isPreGame,
  nightIconUrl,
  name,
  isDead,
}: GrimoireTokenOverlaysProps) {
  return (
    <>
      {showNominationHands && votesForIndices.includes(index) && revealedHandIndices.has(index) && !isTokenPassed(index) && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none z-10" aria-hidden>
          <FontAwesomeIcon icon={faHand} className="text-[1.6em] text-white drop-shadow-lg" />
        </span>
      )}
      {showNominationHands && !rotationDoneDisplay && isTokenPassed(index) && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 text-blue-900" aria-hidden>
          {votesForIndices.includes(index) ? (
            <FontAwesomeIcon icon={faThumbsUp} className="text-[1.6em]" />
          ) : (
            <FontAwesomeIcon icon={faXmark} className="text-[2.2em]" />
          )}
        </span>
      )}
      {showNominationHands && rotationDoneDisplay && index === executedPlayerIndex && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-black/40 rounded-full" aria-hidden>
          <FontAwesomeIcon icon={faSkull} className="text-[1.8em] text-white drop-shadow-lg" />
        </span>
      )}
      {isDay && (
        <span className={`absolute inset-0 rounded-full pointer-events-none ${isPreGame ? 'bg-amber-400/25' : 'bg-blue-300/30'}`} aria-hidden />
      )}
      {!isDay && nightIconUrl && (
        <span
          className="absolute inset-0 rounded-full bg-no-repeat bg-size-[90%] bg-position-[center_20%] pointer-events-none transition-opacity duration-2000"
          style={{
            backgroundImage: `url(${nightIconUrl})`,
            opacity: isDay ? 0 : 1
          }}
          aria-hidden
        />
      )}
      {!isDay && name && (
        <svg
          viewBox="0 0 150 150"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          <defs>
            <path
              id={`grimoire-curve-${index}`}
              d="M 13 75 C 13 160, 138 160, 138 75"
              fill="transparent"
            />
          </defs>
          <text
            className="fill-black stroke-white [paint-order:stroke] font-bold text-[1.4em] tracking-wide group-hover:fill-white group-hover:stroke-black transition-[fill,stroke,opacity] duration-2000"
            style={{ strokeWidth: 3.5, fontFamily: '"Lora", Georgia, serif' }}
          >
            <textPath href={`#grimoire-curve-${index}`} startOffset="50%" textAnchor="middle">
              {name}
            </textPath>
          </text>
        </svg>
      )}
      {isDead && !isDay && (
        <span
          className="absolute left-1/2 -translate-x-1/2 -top-1 bg-no-repeat bg-contain pointer-events-none z-100001"
          style={{
            backgroundImage: `url(${shroudImg})`,
            width: '40%',
            height: '70%',
          }}
          aria-hidden
        />
      )}
      {isDead && isDay && (
        <span
          className="absolute inset-0 rounded-full pointer-events-none z-5"
          style={{
            boxShadow: 'inset 0 0 0 11px rgba(0, 0, 0, 0.85), inset 0 0 0 8px transparent'
          }}
          aria-hidden
        />
      )}
    </>
  )
}

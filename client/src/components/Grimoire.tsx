import { useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faUser, faUserFriends, faHeartbeat, faVoteYea } from '@fortawesome/free-solid-svg-icons'
import customIcon from '../../assets/icons/custom.png'
import textureImg from '../../assets/9.jpg'
import { GrimoireTokenOverlays } from './GrimoireTokenOverlays'
import { GrimoireHands } from './GrimoireHands'
import grimoireData from '../data/grimoire-players.json'
import gameJson from '../data/game.json'
import rolesData from '../data/roles.json'
import type { RoleInfo, GrimoirePlayer } from '../types/grimoire'
import type { GrimoireNomination } from './GrimoireSidebar'
import { useNominationAnimation } from '../hooks/useNominationAnimation'
import { useGrimoireNominationData } from '../hooks/useGrimoireNominationData'

type GameScript = { townsfolk: number; outsider: number; minion: number; demon: number }

/** Row 2: script breakdown keys and colors (from game.json) */
const SCRIPT_TEAMS = [
  { key: 'townsfolk' as const, color: '#1f65ff' },
  { key: 'outsider' as const, color: '#46d5ff' },
  { key: 'minion' as const, color: '#ff6900' },
  { key: 'demon' as const, color: '#ce0100' },
] as const

const iconModules = import.meta.glob<{ default: string }>(
  '../../assets/icons/*.png',
  { eager: true }
)

const rolesById = new Map<string, RoleInfo>(
  (rolesData as RoleInfo[]).map((r) => [r.id, r])
)

const players: GrimoirePlayer[] = (grimoireData as { players: GrimoirePlayer[] }).players

function getIconUrl(roleId: string): string {
  if (!roleId) return customIcon
  const id = roleId.toLowerCase().replace(/\s+/g, '')
  const key = Object.keys(iconModules).find((k) =>
    k.replace(/\\/g, '/').endsWith(`/${id}.png`)
  )
  if (key) return (iconModules[key] as { default: string }).default
  return customIcon
}

function getRoleById(roleId: string): RoleInfo | null {
  const id = roleId.toLowerCase().replace(/\s+/g, '')
  return rolesById.get(id) ?? null
}



interface GrimoireProps {
  isDay?: boolean
  isPreGame?: boolean
  /** Total players (from narrative); else uses grimoire length. */
  totalPlayers?: number
  /** Alive count (from narrative townSquare); else defaults to total. */
  aliveCount?: number
  /** How many can vote (from narrative townSquare); else defaults to total. */
  voteCount?: number
  /** When set, show big hand toward nominee and small hand toward nominator from center. */
  nomination?: GrimoireNomination
  /** Name of the Storyteller (for ST token). Defaults to "Storyteller". */
  storytellerName?: string
}

export function Grimoire({ isDay: isDayControlled, isPreGame, totalPlayers, aliveCount, voteCount, nomination, storytellerName }: GrimoireProps) {
  const total = totalPlayers ?? players.length
  const alive = aliveCount ?? total
  const votes = voteCount ?? total
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const isDay = isDayControlled ?? true;

  const MIN_PLAYERS = 5
  /** Script breakdown from game.json; index = playerCount - MIN_PLAYERS (5→0, 6→1, …). */
  const scriptCounts = useMemo((): GameScript => {
    const scripts = gameJson as GameScript[]
    if (players.length < MIN_PLAYERS) return { townsfolk: 0, outsider: 0, minion: 1, demon: 1 }
    const idx = players.length - MIN_PLAYERS
    return scripts[idx] ?? scripts[0]
  }, [])

  /* Pre-Game = warm (amber). Day = blue/twilight. Night = dark. */
  const statsBoxStyle = isPreGame
    ? {
      border: '2px solid rgba(180, 83, 9, 0.6)',
      backgroundImage: `linear-gradient(rgba(220, 190, 120, 0.82), rgba(205, 175, 100, 0.86)), url(${textureImg})`,
      textClass: 'text-amber-950',
      mutedClass: 'text-amber-900',
    }
    : isDay
      ? {
        border: '2px solid rgba(56, 149, 211, 0.7)',
        backgroundImage: `linear-gradient(rgba(186, 220, 248, 0.88), rgba(165, 205, 238, 0.92)), url(${textureImg})`,
        textClass: 'text-sky-900',
        mutedClass: 'text-sky-800',
      }
      : {
        border: '2px solid rgba(120, 53, 15, 0.8)',
        backgroundImage: `linear-gradient(rgba(45, 38, 32, 0.88), rgba(38, 32, 28, 0.92)), url(${textureImg})`,
        textClass: 'text-amber-50',
        mutedClass: 'text-amber-200/90',
      }

  const {
    extendedPlayers,
    nominationIndices,
    showNominationHands,
    votesForIndices,
    executedPlayerIndex
  } = useGrimoireNominationData({
    players,
    nomination,
    storytellerName
  })

  // Recalculate iconUrls when extendedPlayers changes
  const slotCount = extendedPlayers.length
  const iconUrls = useMemo(() => extendedPlayers.map((p) => getIconUrl(p.role)), [extendedPlayers])

  const { rotationProgress, rotationDoneDisplay, revealedHandIndices } = useNominationAnimation({
    showNominationHands,
    votesForIndices
  })

  // ... (rest of logic using extendedPlayers/slotCount)
  // Need to update AngleForSlot to use new slotCount
  
  const angleForSlot = (i: number) => (360 / slotCount) * i
  
  // FIXED LOGIC: Big hand (voting clock) should start at NOMINEE
  // Small hand (nominator) should point to NOMINATOR
  const nominationStartAngle =
    nominationIndices?.nominee != null 
      ? angleForSlot(nominationIndices.nominee) 
      : 0

  const rotationAngleDeg = nominationStartAngle + rotationProgress * 360
  
  const tokenAngleDeg = (i: number) => angleForSlot(i)
  const isTokenPassed = (i: number) => {
    const totalRotation = rotationProgress * 360
    const dist = (tokenAngleDeg(i) - nominationStartAngle + 360) % 360
    return totalRotation > dist
  }
  
  // Helper for render loop
  const playersToRender = extendedPlayers
  const hoveredRole =
    hoveredIndex != null && extendedPlayers[hoveredIndex]
      ? getRoleById(extendedPlayers[hoveredIndex].role)
      : null

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full flex-1">

      <div className="relative aspect-square w-full max-w-[min(90vw,600px)] shrink-0">
        {(!showNominationHands || rotationDoneDisplay) && (
          <div
            className={`absolute left-1/2 top-1/2 z-0 w-[45%] min-w-[112px] max-w-[200px] -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-lg bg-cover bg-center p-3 shadow-lg transition-[background-image,border-color] duration-300 ${statsBoxStyle.textClass}`}
            style={{
              border: statsBoxStyle.border,
              backgroundImage: statsBoxStyle.backgroundImage,
            }}
            aria-label="Game stats"
          >
            {slotCount < 5 ? (
              <p className={`text-center text-xs font-medium ${statsBoxStyle.mutedClass}`}>Add more players!</p>
            ) : (
              <div className={`flex flex-col items-center justify-center gap-2 text-center ${statsBoxStyle.textClass}`}>
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-bold">
                  <span className="flex items-center gap-1.5">
                    {total}
                    <FontAwesomeIcon icon={faUsers} className="text-[14px]" style={{ color: '#00a000' }} />
                  </span>
                  <span className="flex items-center gap-1.5">
                    {alive}
                    <FontAwesomeIcon icon={faHeartbeat} className="text-[14px]" style={{ color: '#c41e1e' }} />
                  </span>
                  <span className="flex items-center gap-1.5">
                    {votes}
                    <FontAwesomeIcon icon={faVoteYea} className="text-[14px]" style={{ color: '#374151' }} />
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-bold">
                  {SCRIPT_TEAMS.map((t) => (
                    <span key={t.key} className="flex items-center gap-1.5">
                      {scriptCounts[t.key]}
                      <FontAwesomeIcon
                        icon={scriptCounts[t.key] > 1 ? faUserFriends : faUser}
                        style={{ color: t.color }}
                        className="text-[12px]"
                      />
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nomination hands: only while rotation is running; hide when done and show stats + skull */}
        <GrimoireHands
          show={Boolean(showNominationHands && !rotationDoneDisplay && nominationIndices)}
          rotationAngleDeg={rotationAngleDeg}
          nominatorAngleDeg={
            nominationIndices?.nominator != null
              ? angleForSlot(nominationIndices.nominator)
              : null
          }
        />

        {/* Tokens ring using trigonometry */}
        <ul
          className="relative list-none p-0 m-0 z-10 w-full h-full"
          aria-label="Grimoire circle"
        >
          {Array.from({ length: slotCount }, (_, i) => {
            const angleDeg = angleForSlot(i)
            const angleRad = (angleDeg * Math.PI) / 180
            // Wait, previous step I set it to 38. Let's stick to 38.
            const r = 38
            const x = 50 + r * Math.sin(angleRad)
            const y = 50 - r * Math.cos(angleRad)

            const player = playersToRender[i]
            const isStoryteller = player.role === 'storyteller'
            const nightIconUrl = player && !isStoryteller ? iconUrls[i] : null
            const role = player ? getRoleById(player.role) : null
            const name = role?.name ?? (isStoryteller ? 'Storyteller' : null)
            
            return (
              <li
                key={i}
                className="absolute flex flex-col items-center justify-center w-[15%] max-w-[80px] aspect-square pointer-events-none [&:has(.grimoire-token:hover)]:z-40"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                  <div
                    className={`grimoire-token relative group w-full h-full rounded-full border-[3px] bg-cover bg-center shadow-md pointer-events-auto overflow-hidden transition-transform hover:scale-110 
                    ${isStoryteller ? 'bg-purple-900 border-purple-400 shadow-purple-500/40 text-white font-bold flex items-center justify-center text-xl tracking-wider' : (isPreGame ? 'border-amber-500/95 shadow-amber-200/30' : isDay ? 'border-sky-400/90 shadow-sky-200/40' : 'border-amber-900/90')}`}
                    style={!isStoryteller ? { backgroundImage: `url(${textureImg})` } : {}}
                    onMouseEnter={() => !isDay && setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    aria-label={player && name ? `${player.name}, ${name}` : undefined}
                  >
                    {isStoryteller && <span className="drop-shadow-md">ST</span>}
                    <GrimoireTokenOverlays
                      index={i}
                      showNominationHands={showNominationHands}
                      votesForIndices={votesForIndices}
                      revealedHandIndices={revealedHandIndices}
                      isTokenPassed={isTokenPassed}
                      rotationDoneDisplay={rotationDoneDisplay}
                      executedPlayerIndex={executedPlayerIndex}
                      isDay={isDay}
                      isPreGame={isPreGame}
                      nightIconUrl={nightIconUrl}
                      name={name}
                    />
                  </div>
                  
                  {player && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex justify-center items-start w-0 overflow-visible z-20 pointer-events-none">
                      <span
                        className="text-[min(3vw,12px)] font-bold text-game-text leading-none whitespace-nowrap px-1 py-0.5 rounded"
                        title={player.name}
                      >
                        {player.name}
                      </span>
                    </div>
                  )}
              </li>
            )
          })}
        </ul>
      </div>
      

      {!isDay && hoveredRole && (
        <div
          className="w-full max-w-[280px] rounded-lg border-2 border-black bg-black/90  mt-8 p-3 text-left text-white shadow-lg z-50 pointer-events-none"
          role="tooltip"
        >
          <p className="font-semibold text-sm text-amber-500">{hoveredRole.name}</p>
          {hoveredRole.ability && (
            <p className="mt-1 text-xs leading-snug text-gray-300">
              {hoveredRole.ability}
            </p>
          )}
        </div>
      )}
    </div>
  )
}


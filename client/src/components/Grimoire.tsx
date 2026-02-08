import { useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faUser, faUserFriends, faHeartbeat, faVoteYea } from '@fortawesome/free-solid-svg-icons'
import customIcon from '../../assets/icons/custom.png'
import textureImg from '../../assets/9.jpg'
import grimoireData from '../data/grimoire-players.json'
import gameJson from '../data/game.json'
import rolesData from '../data/roles.json'
import type { RoleInfo, GrimoirePlayer } from '../types/grimoire'

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
}

export function Grimoire({ isDay: isDayControlled, isPreGame, totalPlayers, aliveCount, voteCount }: GrimoireProps) {
  const total = totalPlayers ?? players.length
  const alive = aliveCount ?? total
  const votes = voteCount ?? total
  const [isDayInternal, setIsDayInternal] = useState(true)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const isDay = isDayControlled ?? isDayInternal
  const showToggle = isDayControlled === undefined

  const slotCount = players.length
  const iconUrls = useMemo(() => players.map((p) => getIconUrl(p.role)), [])

  const MIN_PLAYERS = 5
  /** Script breakdown from game.json; index = playerCount - MIN_PLAYERS (5→0, 6→1, …). */
  const scriptCounts = useMemo((): GameScript => {
    const scripts = gameJson as GameScript[]
    if (players.length < MIN_PLAYERS) return { townsfolk: 0, outsider: 0, minion: 1, demon: 1 }
    const idx = players.length - MIN_PLAYERS
    return scripts[idx] ?? scripts[0]
  }, [])

  const hoveredRole =
    hoveredIndex != null && players[hoveredIndex]
      ? getRoleById(players[hoveredIndex].role)
      : null

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

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {showToggle && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsDayInternal(true)}
            aria-pressed={isDay}
            className={`rounded-lg border-2 px-4 py-2 font-semibold transition-all duration-200 ${isDay
              ? 'border-game-accent bg-game-accent text-white'
              : 'border-game-border bg-game-bg-card text-game-text hover:border-game-accent hover:bg-game-bg-elevated'
              }`}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => setIsDayInternal(false)}
            aria-pressed={!isDay}
            className={`rounded-lg border-2 px-4 py-2 font-semibold transition-all duration-200 ${!isDay
              ? 'border-game-accent bg-game-accent text-white'
              : 'border-game-border bg-game-bg-card text-game-text hover:border-game-accent hover:bg-game-bg-elevated'
              }`}
          >
            Night
          </button>
        </div>
      )}

      <div className="relative min-h-[350px] min-w-[300px] max-w-full shrink-0 overflow-hidden">
        <div
          className={`absolute left-1/2 top-1/2 z-0 w-[48%] min-w-[112px] max-w-[168px] -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-lg bg-cover bg-center p-2 shadow-lg transition-[background-image,border-color] duration-300 ${statsBoxStyle.textClass}`}
          style={{
            border: statsBoxStyle.border,
            backgroundImage: statsBoxStyle.backgroundImage,
          }}
          aria-label="Game stats"
        >
          {slotCount < 5 ? (
            <p className={`text-center text-[11px] font-medium ${statsBoxStyle.mutedClass}`}>Add more players!</p>
          ) : (
            <div className={`flex flex-col items-center justify-center gap-2 text-center ${statsBoxStyle.textClass}`}>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-xs font-bold">
                <span className="flex items-center gap-1">
                  {total}
                  <FontAwesomeIcon icon={faUsers} className="text-[12px]" style={{ color: '#00a000' }} />
                </span>
                <span className="flex items-center gap-1">
                  {alive}
                  <FontAwesomeIcon icon={faHeartbeat} className="text-[12px]" style={{ color: '#c41e1e' }} />
                </span>
                <span className="flex items-center gap-1">
                  {votes}
                  <FontAwesomeIcon icon={faVoteYea} className="text-[12px]" style={{ color: '#374151' }} />
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-[11px] font-bold">
                {SCRIPT_TEAMS.map((t) => (
                  <span key={t.key} className="flex items-center gap-1">
                    {scriptCounts[t.key]}
                    <FontAwesomeIcon
                      icon={scriptCounts[t.key] > 1 ? faUserFriends : faUser}
                      style={{ color: t.color }}
                      className="text-[11px]"
                    />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <ul
          className="absolute inset-8 list-none p-0 m-0 h-[calc(100%-4rem)] w-[calc(100%-4rem)] z-10"
          aria-label="Grimoire circle"
        >
          {Array.from({ length: slotCount }, (_, i) => {
            const angleDeg = (360 / slotCount) * i
            const player = players[i]
            const nightIconUrl = player ? iconUrls[i] : null
            const role = player ? getRoleById(player.role) : null
            const name = role?.name ?? null
            return (
              <li
                key={i}
                className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 pointer-events-none [&:has(.grimoire-token:hover)]:z-10"
              >
                <div
                  className="absolute left-1/2 top-1/2 h-full w-full pointer-events-none"
                  style={{
                    transform: `rotate(${angleDeg}deg) translateY(-45%) rotate(${-angleDeg}deg)`,
                  }}
                >
                  <div
                    className={`grimoire-token group absolute left-0 top-0 aspect-square w-[10vmin] shrink-0 rounded-full border-4 bg-cover bg-center shadow-[0_0_10px_rgba(0,0,0,0.4)] pointer-events-auto overflow-hidden ${isPreGame ? 'border-amber-500/95 shadow-amber-200/30' : isDay ? 'border-sky-400/90 shadow-sky-200/40' : 'border-amber-900/90'}`}
                    style={{ backgroundImage: `url(${textureImg})` }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    aria-label={player && name ? `${player.name}, ${name}` : undefined}
                  >
                    {isDay && (
                      <span className={`absolute inset-0 rounded-full pointer-events-none ${isPreGame ? 'bg-amber-400/25' : 'bg-blue-300/30'}`} aria-hidden />
                    )}
                    {!isDay && nightIconUrl && (
                      <span
                        className="absolute inset-0 rounded-full bg-no-repeat bg-size-[90%] bg-position-[center_20%] pointer-events-none"
                        style={{ backgroundImage: `url(${nightIconUrl})` }}
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
                            id={`grimoire-curve-${i}`}
                            d="M 13 75 C 13 160, 138 160, 138 75"
                            fill="transparent"
                          />
                        </defs>
                        <text
                          className="fill-black stroke-white [paint-order:stroke] font-bold text-[1.8em] tracking-wide group-hover:fill-white group-hover:stroke-black transition-colors duration-150"
                          style={{ strokeWidth: 3.5, fontFamily: '"Lora", Georgia, serif' }}
                        >
                          <textPath href={`#grimoire-curve-${i}`} startOffset="50%" textAnchor="middle">
                            {name}
                          </textPath>
                        </text>
                      </svg>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {hoveredRole && (
        <div
          className="w-full max-w-[280px] rounded-lg border-2 border-black bg-black/90 p-3 text-left text-white shadow-lg"
          role="tooltip"
        >
          <p className="font-semibold text-sm">{hoveredRole.name}</p>
          {hoveredRole.ability && (
            <p className="mt-1.5 text-xs leading-snug text-gray-200">
              {hoveredRole.ability}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

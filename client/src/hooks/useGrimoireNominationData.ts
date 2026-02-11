import { useMemo } from 'react'
import type { GrimoirePlayer } from '../types/grimoire'
import type { GrimoireNomination } from '../components/GrimoireSidebar'

interface UseGrimoireNominationDataProps {
  players: GrimoirePlayer[]
  nomination?: GrimoireNomination
  storytellerName?: string
}

export function useGrimoireNominationData({
  players,
  nomination,
  storytellerName,
}: UseGrimoireNominationDataProps) {
  
  const extendedPlayers = useMemo(() => {
    // Inject Storyteller only if they are involved in the current nomination
    const stName = storytellerName || 'Storyteller'
    
    const isStNominated = nomination?.nominee === stName || nomination?.nominee === 'Storyteller'
    const isStNominator = nomination?.nominator === stName || nomination?.nominator === 'Storyteller'

    if (isStNominated || isStNominator) {
       return [...players, { name: stName, role: 'storyteller' }]
    }
    return players
  }, [nomination, players, storytellerName])

  /** Resolve nomination to grimoire indices; only show hands for players in the circle. */
  const nominationIndices = useMemo(() => {
    if (!nomination) return null
    
    // Need to use extendedPlayers for index lookup since we added ST
    const getIdx = (n: string) => {
        const name = n.trim().toLowerCase()
        const i = extendedPlayers.findIndex((p) => p.name.trim().toLowerCase() === name)
        return i >= 0 ? i : null
    }
    const nominatorIdx = getIdx(nomination.nominator)
    const nomineeIdx = getIdx(nomination.nominee)
    
    const normalize = (s: string) => s.trim().toLowerCase()
    
    // Fallback: if nomination says "Storyteller" look for ST role
    const findStIdx = () => extendedPlayers.findIndex(p => p.role === 'storyteller')
    
    let finalNominatorIdx = nominatorIdx
    let finalNomineeIdx = nomineeIdx

    if (finalNominatorIdx == null && normalize(nomination.nominator) === 'storyteller') {
        finalNominatorIdx = findStIdx()
    }
    if (finalNomineeIdx == null && normalize(nomination.nominee) === 'storyteller') {
        finalNomineeIdx = findStIdx()
    }

    if (finalNominatorIdx == null && finalNomineeIdx == null) return null
    return { nominator: finalNominatorIdx ?? null, nominee: finalNomineeIdx ?? null }
  }, [nomination, extendedPlayers])

  const showNominationHands = Boolean(
    nominationIndices && (nominationIndices.nominee != null || nominationIndices.nominator != null)
  )

  /** Indices of players who voted for execution (get hand icon, then thumbs up when passed). */
   const votesForIndices = useMemo(() => {
    if (!nomination?.votesFor?.length) return []
    return nomination.votesFor
      .map((name) => {
         const n = name.trim().toLowerCase()
         const i = extendedPlayers.findIndex((p) => p.name.trim().toLowerCase() === n)
         return i >= 0 ? i : null
      })
      .filter((idx): idx is number => idx != null)
  }, [nomination?.votesFor, extendedPlayers])

  /** Index of executed player (nominee when executed is true); show skull when rotation done. */
  const executedPlayerIndex = useMemo(() => {
    if (!nomination?.executed) return null
    const n = nomination.nominee.trim().toLowerCase()
    let i = extendedPlayers.findIndex((p) => p.name.trim().toLowerCase() === n)
    
    // Fallback for "Storyteller"
    if (i === -1 && n === 'storyteller') {
         i = extendedPlayers.findIndex((p) => p.role === 'storyteller')
    }
    
    return i >= 0 ? i : null
  }, [nomination?.executed, nomination?.nominee, extendedPlayers])

  return {
    extendedPlayers,
    nominationIndices,
    showNominationHands,
    votesForIndices,
    executedPlayerIndex
  }
}

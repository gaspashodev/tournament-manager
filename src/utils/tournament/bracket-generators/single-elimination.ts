import { v4 as uuidv4 } from 'uuid';
import type { Match, Participant } from '@/types';
import { generateBracketPositions } from './common';

/**
 * Génère les matchs pour un tournoi à élimination simple
 */
export function generateSingleEliminationMatches(
  participants: Participant[], 
  seedingType: 'random' | 'manual' | 'ranked' = 'random'
): Match[] {
  const matches: Match[] = [];
  const participantCount = participants.length;
  
  // Calculer le nombre de rounds nécessaires
  const rounds = Math.ceil(Math.log2(participantCount));
  const totalSlots = Math.pow(2, rounds);
  
  // Préparer les participants selon le type de seeding
  let seededParticipants: Participant[];
  
  switch (seedingType) {
    case 'manual':
    case 'ranked':
      // Trier par seed (les participants avec seed d'abord, puis les autres)
      seededParticipants = [...participants].sort((a, b) => {
        if (a.seed !== undefined && b.seed !== undefined) return a.seed - b.seed;
        if (a.seed !== undefined) return -1;
        if (b.seed !== undefined) return 1;
        return 0;
      });
      break;
    case 'random':
    default:
      // Mélange aléatoire
      seededParticipants = [...participants].sort(() => Math.random() - 0.5);
      break;
  }
  
  // Générer le bracket avec placement optimal des seeds
  // Pour un bracket de 8 : positions [1,8,4,5,2,7,3,6] pour que 1v8, 4v5, etc.
  const bracketPositions = generateBracketPositions(totalSlots);
  
  // Placer les participants dans les slots du bracket
  const slots: (Participant | undefined)[] = new Array(totalSlots).fill(undefined);
  for (let i = 0; i < seededParticipants.length; i++) {
    slots[bracketPositions[i]] = seededParticipants[i];
  }
  
  // Générer les matchs du premier tour
  let matchPosition = 0;
  const firstRoundMatchCount = totalSlots / 2;
  
  for (let i = 0; i < firstRoundMatchCount; i++) {
    const participant1 = slots[i * 2];
    const participant2 = slots[i * 2 + 1];
    
    // Déterminer si c'est un bye
    const isBye = !participant1 || !participant2;
    const byeWinner = participant1 || participant2;
    
    matches.push({
      id: uuidv4(),
      tournamentId: '',
      round: 1,
      position: matchPosition++,
      participant1Id: participant1?.id,
      participant2Id: participant2?.id,
      status: isBye && byeWinner ? 'completed' : 'pending',
      winnerId: isBye && byeWinner ? byeWinner.id : undefined
    });
  }
  
  // Générer les matchs des rounds suivants
  for (let round = 2; round <= rounds; round++) {
    const matchCount = Math.pow(2, rounds - round);
    for (let i = 0; i < matchCount; i++) {
      matches.push({
        id: uuidv4(),
        tournamentId: '',
        round,
        position: i,
        status: 'pending'
      });
    }
  }
  
  // Propager les gagnants des byes au tour suivant
  const firstRoundMatches = matches.filter(m => m.round === 1);
  for (const match of firstRoundMatches) {
    if (match.status === 'completed' && match.winnerId) {
      // Trouver le match du tour suivant
      const nextRoundMatch = matches.find(m => 
        m.round === 2 && 
        Math.floor(match.position / 2) === m.position
      );
      if (nextRoundMatch) {
        const isFirstSlot = match.position % 2 === 0;
        if (isFirstSlot) {
          nextRoundMatch.participant1Id = match.winnerId;
        } else {
          nextRoundMatch.participant2Id = match.winnerId;
        }
      }
    }
  }
  
  return matches;
}

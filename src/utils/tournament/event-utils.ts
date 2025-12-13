import { v4 as uuidv4 } from 'uuid';
import type { TournamentEvent, TournamentEventType } from '@/types';

/**
 * Crée un événement de tournoi
 */
export function createEvent(
  type: TournamentEventType, 
  description: string, 
  data?: TournamentEvent['data']
): TournamentEvent {
  return {
    id: uuidv4(),
    type,
    timestamp: new Date(),
    description,
    data
  };
}

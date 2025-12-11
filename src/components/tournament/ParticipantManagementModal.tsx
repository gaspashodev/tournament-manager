import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Participant, Penalty, ParticipantStatus, TournamentFormat } from '@/types';
import { X, AlertTriangle, Minus, Plus, Ban, RotateCcw, Trash2, UserPlus, XCircle } from 'lucide-react';

interface ParticipantManagementModalProps {
  participant: Participant;
  penalties: Penalty[];
  status?: ParticipantStatus;
  tournamentFormat: TournamentFormat;
  canRepechage?: boolean; // Si le joueur a battu quelqu'un qu'on peut repêcher
  lastDefeatedName?: string; // Nom du dernier adversaire battu
  onAddPenalty: (points: number, reason: string) => void;
  onRemovePenalty: (penaltyId: string) => void;
  onEliminate: (reason: string, useRepechage: boolean) => void;
  onReinstate: () => void;
  onClose: () => void;
}

export function ParticipantManagementModal({
  participant,
  penalties,
  status,
  tournamentFormat,
  canRepechage = false,
  lastDefeatedName,
  onAddPenalty,
  onRemovePenalty,
  onEliminate,
  onReinstate,
  onClose
}: ParticipantManagementModalProps) {
  const [penaltyPoints, setPenaltyPoints] = useState(1);
  const [penaltyReason, setPenaltyReason] = useState('');
  const [eliminationReason, setEliminationReason] = useState('');
  const [showEliminationConfirm, setShowEliminationConfirm] = useState(false);
  const [eliminationMode, setEliminationMode] = useState<'choice' | 'repechage' | 'forfait'>('choice');

  const participantPenalties = penalties.filter(p => p.participantId === participant.id);
  const totalPenaltyPoints = participantPenalties.reduce((sum, p) => sum + p.points, 0);
  const isEliminated = status?.isEliminated;

  // Déterminer quelles options afficher selon le format
  const showPenalties = tournamentFormat === 'championship' || tournamentFormat === 'groups';
  const showElimination = tournamentFormat === 'single_elimination' || tournamentFormat === 'double_elimination' || tournamentFormat === 'groups';
  const isEliminationFormat = tournamentFormat === 'single_elimination' || tournamentFormat === 'double_elimination';

  const handleAddPenalty = () => {
    if (penaltyPoints > 0 && penaltyReason.trim()) {
      onAddPenalty(penaltyPoints, penaltyReason.trim());
      setPenaltyPoints(1);
      setPenaltyReason('');
    }
  };

  const handleEliminate = (useRepechage: boolean) => {
    if (eliminationReason.trim()) {
      onEliminate(eliminationReason.trim(), useRepechage);
      setShowEliminationConfirm(false);
      setEliminationMode('choice');
    }
  };

  const resetEliminationState = () => {
    setShowEliminationConfirm(false);
    setEliminationMode('choice');
    setEliminationReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center text-lg font-medium",
              isEliminated ? "bg-destructive/20 text-destructive" : "bg-primary/10 text-primary"
            )}>
              {participant.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">{participant.name}</h2>
              {isEliminated && (
                <Badge variant="destructive" className="text-xs">Éliminé</Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Section Pénalités */}
          {showPenalties && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Minus className="h-4 w-4 text-warning" />
                  Pénalités
                </h3>
                {totalPenaltyPoints > 0 && (
                  <Badge variant="warning">-{totalPenaltyPoints} pts</Badge>
                )}
              </div>

              {/* Liste des pénalités existantes */}
              {participantPenalties.length > 0 && (
                <div className="space-y-2">
                  {participantPenalties.map(penalty => (
                    <div 
                      key={penalty.id} 
                      className="flex items-center justify-between p-2 rounded-lg bg-warning/10 border border-warning/20"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-warning">-{penalty.points} pt{penalty.points > 1 ? 's' : ''}</span>
                          <span className="text-sm text-muted-foreground">{penalty.reason}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(penalty.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemovePenalty(penalty.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Ajouter une pénalité */}
              <div className="p-3 rounded-lg bg-muted/50 space-y-3">
                <Label className="text-sm">Nouvelle pénalité</Label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPenaltyPoints(Math.max(1, penaltyPoints - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={penaltyPoints}
                      onChange={e => setPenaltyPoints(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPenaltyPoints(penaltyPoints + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm text-muted-foreground ml-1">pts</span>
                  </div>
                </div>
                <Input
                  type="text"
                  placeholder="Raison de la pénalité..."
                  value={penaltyReason}
                  onChange={e => setPenaltyReason(e.target.value)}
                />
                <Button
                  onClick={handleAddPenalty}
                  disabled={!penaltyReason.trim() || penaltyPoints < 1}
                  className="w-full"
                  variant="warning"
                >
                  Ajouter la pénalité
                </Button>
              </div>
            </div>
          )}

          {/* Section Élimination */}
          {showElimination && (
            <div className={cn("space-y-4", showPenalties && "pt-4 border-t")}>
              <h3 className="font-semibold flex items-center gap-2">
                <Ban className="h-4 w-4 text-destructive" />
                Élimination
              </h3>

              {isEliminated ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm font-medium text-destructive">Joueur éliminé</p>
                    {status?.eliminationReason && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Raison : {status.eliminationReason}
                      </p>
                    )}
                    {status?.eliminatedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Le {new Date(status.eliminatedAt).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {status?.promotedOpponentId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Un joueur a été repêché pour le remplacer
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={onReinstate}
                    variant="outline"
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Réintégrer le joueur
                  </Button>
                </div>
              ) : showEliminationConfirm ? (
                <div className="space-y-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  {/* Choix du mode d'élimination pour les tournois à élimination */}
                  {isEliminationFormat && canRepechage && eliminationMode === 'choice' ? (
                    <>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-destructive">Comment gérer l'élimination ?</p>
                          <p className="text-sm text-muted-foreground">
                            Ce joueur a battu <strong>{lastDefeatedName}</strong>. Choisissez comment procéder :
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start h-auto py-3 px-4"
                          onClick={() => setEliminationMode('repechage')}
                        >
                          <UserPlus className="h-5 w-5 mr-3 text-primary" />
                          <div className="text-left">
                            <p className="font-medium">Repêcher {lastDefeatedName}</p>
                            <p className="text-xs text-muted-foreground">
                              Le dernier adversaire battu prend sa place
                            </p>
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start h-auto py-3 px-4"
                          onClick={() => setEliminationMode('forfait')}
                        >
                          <XCircle className="h-5 w-5 mr-3 text-destructive" />
                          <div className="text-left">
                            <p className="font-medium">Déclarer forfait</p>
                            <p className="text-xs text-muted-foreground">
                              L'adversaire actuel gagne automatiquement (3-0)
                            </p>
                          </div>
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={resetEliminationState}
                      >
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-destructive">Confirmer l'élimination</p>
                          <p className="text-sm text-muted-foreground">
                            {eliminationMode === 'repechage' && lastDefeatedName
                              ? `${lastDefeatedName} sera repêché pour remplacer ce joueur.`
                              : eliminationMode === 'forfait' || (isEliminationFormat && !canRepechage)
                                ? "L'adversaire actuel gagnera par forfait (3-0)."
                                : "Le joueur sera marqué comme éliminé du tournoi."
                            }
                          </p>
                        </div>
                      </div>
                      <Input
                        type="text"
                        placeholder="Raison de l'élimination..."
                        value={eliminationReason}
                        onChange={e => setEliminationReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={resetEliminationState}
                        >
                          Annuler
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleEliminate(eliminationMode === 'repechage')}
                          disabled={!eliminationReason.trim()}
                        >
                          Confirmer
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setShowEliminationConfirm(true)}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Éliminer ce joueur
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

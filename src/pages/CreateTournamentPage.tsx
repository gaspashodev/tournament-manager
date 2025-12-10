import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Swords, 
  GitBranch, 
  Grid3X3, 
  Medal,
  Settings2,
  Users,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectOption } from '@/components/ui/select';
import { useTournament } from '@/context/TournamentContext';
import { cn } from '@/lib/utils';
import type { TournamentFormat, TournamentConfig } from '@/types';

const formatOptions: { format: TournamentFormat; icon: typeof Swords; label: string; description: string }[] = [
  {
    format: 'single_elimination',
    icon: Swords,
    label: 'Élimination directe',
    description: 'Le format classique. Une défaite et vous êtes éliminé. Rapide et décisif.'
  },
  {
    format: 'double_elimination',
    icon: GitBranch,
    label: 'Double élimination',
    description: 'Deux chances de rester en vie. Bracket des vainqueurs et des perdants.'
  },
  {
    format: 'groups',
    icon: Grid3X3,
    label: 'Phases de groupes',
    description: 'Répartition en groupes avec classement, puis phase éliminatoire.'
  },
  {
    format: 'championship',
    icon: Medal,
    label: 'Championnat',
    description: 'Tous les participants s\'affrontent. Le meilleur bilan l\'emporte.'
  }
];

export function CreateTournamentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createTournament } = useTournament();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<TournamentFormat>(
    (searchParams.get('format') as TournamentFormat) || 'single_elimination'
  );
  const [game, setGame] = useState('');
  const [category, setCategory] = useState('');
  const [config, setConfig] = useState<Partial<TournamentConfig>>({
    seeding: 'random',
    thirdPlaceMatch: false,
    groupCount: 4,
    qualifiersPerGroup: 2,
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
    homeAndAway: false,
    bestOf: 1
  });

  useEffect(() => {
    const urlFormat = searchParams.get('format') as TournamentFormat;
    if (urlFormat && formatOptions.some(o => o.format === urlFormat)) {
      setFormat(urlFormat);
    }
  }, [searchParams]);

  const handleCreate = () => {
    const tournament = createTournament({
      name,
      description,
      format,
      config,
      game: game || undefined,
      category: category || undefined
    });
    navigate(`/tournaments/${tournament.id}`);
  };

  const canProceed = () => {
    if (step === 1) return !!name.trim();
    if (step === 2) return true;
    if (step === 3) return true;
    return false;
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display text-3xl font-bold">Nouveau tournoi</h1>
          <p className="text-muted-foreground">Configurez votre compétition</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center">
            <div 
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full font-medium transition-all",
                s < step && "bg-success text-success-foreground",
                s === step && "bg-primary text-primary-foreground",
                s > step && "bg-muted text-muted-foreground"
              )}
            >
              {s < step ? <Check className="h-5 w-5" /> : s}
            </div>
            {s < 3 && (
              <div className={cn(
                "w-16 h-1 mx-2 rounded-full transition-colors",
                s < step ? "bg-success" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic info */}
      {step === 1 && (
        <Card className="animate-slide-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Informations générales
            </CardTitle>
            <CardDescription>
              Donnez un nom à votre tournoi et décrivez-le
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du tournoi *</Label>
              <Input
                id="name"
                placeholder="Ex: Tournoi Magic The Gathering - Été 2024"
                value={name}
                onChange={e => setName(e.target.value)}
                className="text-lg h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Décrivez votre tournoi, les règles spéciales, etc."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="flex min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="game">Jeu (optionnel)</Label>
                <Input
                  id="game"
                  placeholder="Ex: Magic The Gathering"
                  value={game}
                  onChange={e => setGame(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie (optionnel)</Label>
                <Input
                  id="category"
                  placeholder="Ex: Standard, Modern..."
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Format selection */}
      {step === 2 && (
        <Card className="animate-slide-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Format du tournoi
            </CardTitle>
            <CardDescription>
              Choisissez le type de compétition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formatOptions.map(({ format: f, icon: Icon, label, description: desc }) => (
                <div
                  key={f}
                  onClick={() => setFormat(f)}
                  className={cn(
                    "relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all",
                    format === f 
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/50 hover:border-muted-foreground/30"
                  )}
                >
                  {format === f && (
                    <div className="absolute top-3 right-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl mb-3 transition-colors",
                    format === f ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold mb-1">{label}</h4>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Format-specific settings */}
      {step === 3 && (
        <Card className="animate-slide-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Configuration avancée
            </CardTitle>
            <CardDescription>
              Paramètres spécifiques au format choisi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Common settings */}
            <div className="space-y-2">
              <Label htmlFor="seeding">Méthode de seeding</Label>
              <Select
                id="seeding"
                value={config.seeding}
                onChange={e => setConfig({ ...config, seeding: e.target.value as 'random' | 'manual' | 'ranked' })}
              >
                <SelectOption value="random">Aléatoire</SelectOption>
                <SelectOption value="manual">Manuel</SelectOption>
                <SelectOption value="ranked">Par classement</SelectOption>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bestOf">Nombre de manches (Best of)</Label>
              <Select
                id="bestOf"
                value={String(config.bestOf)}
                onChange={e => setConfig({ ...config, bestOf: parseInt(e.target.value) })}
              >
                <SelectOption value="1">1 manche (BO1)</SelectOption>
                <SelectOption value="3">3 manches (BO3)</SelectOption>
                <SelectOption value="5">5 manches (BO5)</SelectOption>
                <SelectOption value="7">7 manches (BO7)</SelectOption>
              </Select>
            </div>

            {/* Single/Double elimination settings */}
            {(format === 'single_elimination' || format === 'double_elimination') && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="thirdPlace"
                  checked={config.thirdPlaceMatch}
                  onChange={e => setConfig({ ...config, thirdPlaceMatch: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="thirdPlace" className="cursor-pointer">
                  Match pour la 3ème place
                </Label>
              </div>
            )}

            {/* Groups settings */}
            {format === 'groups' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="groupCount">Nombre de groupes</Label>
                  <Select
                    id="groupCount"
                    value={String(config.groupCount)}
                    onChange={e => setConfig({ ...config, groupCount: parseInt(e.target.value) })}
                  >
                    {[2, 3, 4, 6, 8].map(n => (
                      <SelectOption key={n} value={String(n)}>{n} groupes</SelectOption>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualifiers">Qualifiés par groupe</Label>
                  <Select
                    id="qualifiers"
                    value={String(config.qualifiersPerGroup)}
                    onChange={e => setConfig({ ...config, qualifiersPerGroup: parseInt(e.target.value) })}
                  >
                    {[1, 2, 3, 4].map(n => (
                      <SelectOption key={n} value={String(n)}>{n} qualifié{n > 1 ? 's' : ''}</SelectOption>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pointsWin">Points victoire</Label>
                    <Input
                      id="pointsWin"
                      type="number"
                      min="0"
                      value={config.pointsWin}
                      onChange={e => setConfig({ ...config, pointsWin: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pointsDraw">Points nul</Label>
                    <Input
                      id="pointsDraw"
                      type="number"
                      min="0"
                      value={config.pointsDraw}
                      onChange={e => setConfig({ ...config, pointsDraw: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pointsLoss">Points défaite</Label>
                    <Input
                      id="pointsLoss"
                      type="number"
                      min="0"
                      value={config.pointsLoss}
                      onChange={e => setConfig({ ...config, pointsLoss: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Championship settings */}
            {format === 'championship' && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="homeAway"
                  checked={config.homeAndAway}
                  onChange={e => setConfig({ ...config, homeAndAway: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="homeAway" className="cursor-pointer">
                  Matchs aller-retour
                </Label>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
        >
          {step > 1 ? 'Précédent' : 'Annuler'}
        </Button>

        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Suivant
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={!canProceed()}>
            Créer le tournoi
          </Button>
        )}
      </div>
    </div>
  );
}

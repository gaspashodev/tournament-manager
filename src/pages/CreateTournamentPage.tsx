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
  Check,
  Trophy,
  Plus,
  Gift,
  X
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
    bestOf: 1,
    showScoreDetails: false,
    highScoreWins: true,
    useHeadToHead: true,
    cashprize: undefined
  });
  
  // État pour le cashprize
  const [enableCashprize, setEnableCashprize] = useState(false);
  const [cashprizeTotal, setCashprizeTotal] = useState(1000);
  const [cashprizeCurrency, setCashprizeCurrency] = useState<'€' | '£' | '$' | 'points'>('€');
  const [cashprizeDistribution, setCashprizeDistribution] = useState<{ place: number; percent: number }[]>([
    { place: 1, percent: 50 },
    { place: 2, percent: 30 },
    { place: 3, percent: 20 }
  ]);
  const [cashprizeRanges, setCashprizeRanges] = useState<{ startPlace: number; endPlace: number; percent: number }[]>([]);
  const [materialPrizes, setMaterialPrizes] = useState<{ place: number; description: string }[]>([]);
  const [materialPrizeRanges, setMaterialPrizeRanges] = useState<{ startPlace: number; endPlace: number; description: string }[]>([]);

  useEffect(() => {
    const urlFormat = searchParams.get('format') as TournamentFormat;
    if (urlFormat && formatOptions.some(o => o.format === urlFormat)) {
      setFormat(urlFormat);
    }
  }, [searchParams]);

  const handleCreate = () => {
    // Construire la config finale avec cashprize si activé
    const finalConfig = {
      ...config,
      cashprize: enableCashprize ? {
        total: cashprizeTotal,
        currency: cashprizeCurrency,
        distribution: cashprizeDistribution,
        ranges: cashprizeRanges,
        materialPrizes: materialPrizes,
        materialPrizeRanges: materialPrizeRanges
      } : undefined
    };
    
    const tournament = createTournament({
      name,
      description,
      format,
      config: finalConfig,
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

            {/* Score mode settings */}
            <div className="space-y-2">
              <Label htmlFor="highScoreWins">Mode de victoire</Label>
              <Select
                id="highScoreWins"
                value={config.highScoreWins ? 'high' : 'low'}
                onChange={e => setConfig({ ...config, highScoreWins: e.target.value === 'high' })}
              >
                <SelectOption value="high">Le score le plus haut gagne</SelectOption>
                <SelectOption value="low">Le score le plus bas gagne (ex: golf)</SelectOption>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showScoreDetails"
                checked={config.showScoreDetails}
                onChange={e => setConfig({ ...config, showScoreDetails: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="showScoreDetails" className="cursor-pointer">
                Afficher les scores détaillés (BP/BC) - pour les sports
              </Label>
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
              <>
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

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pointsWinChamp">Points victoire</Label>
                    <Input
                      id="pointsWinChamp"
                      type="number"
                      min="0"
                      value={config.pointsWin}
                      onChange={e => setConfig({ ...config, pointsWin: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pointsDrawChamp">Points nul</Label>
                    <Input
                      id="pointsDrawChamp"
                      type="number"
                      min="0"
                      value={config.pointsDraw}
                      onChange={e => setConfig({ ...config, pointsDraw: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pointsLossChamp">Points défaite</Label>
                    <Input
                      id="pointsLossChamp"
                      type="number"
                      min="0"
                      value={config.pointsLoss}
                      onChange={e => setConfig({ ...config, pointsLoss: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Head-to-head option for groups and championship */}
            {(format === 'groups' || format === 'championship') && (
              <div className="flex items-center gap-3 pt-2 border-t">
                <input
                  type="checkbox"
                  id="useHeadToHead"
                  checked={config.useHeadToHead}
                  onChange={e => setConfig({ ...config, useHeadToHead: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="useHeadToHead" className="cursor-pointer">
                  Confrontation directe en cas d'égalité
                </Label>
              </div>
            )}

            {/* Cashprize section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableCashprize"
                  checked={enableCashprize}
                  onChange={e => setEnableCashprize(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="enableCashprize" className="cursor-pointer flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-warning" />
                  Activer le cashprize / récompenses
                </Label>
              </div>

              {enableCashprize && (
                <div className="space-y-6 p-4 rounded-lg bg-muted/50">
                  {/* Montant total et devise */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cashprizeTotal">Montant total</Label>
                      <Input
                        id="cashprizeTotal"
                        type="number"
                        min="0"
                        value={cashprizeTotal}
                        onChange={e => setCashprizeTotal(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cashprizeCurrency">Unité</Label>
                      <Select
                        id="cashprizeCurrency"
                        value={cashprizeCurrency}
                        onChange={e => setCashprizeCurrency(e.target.value as '€' | '£' | '$' | 'points')}
                      >
                        <SelectOption value="€">Euro (€)</SelectOption>
                        <SelectOption value="$">Dollar ($)</SelectOption>
                        <SelectOption value="£">Livre (£)</SelectOption>
                        <SelectOption value="points">Points</SelectOption>
                      </Select>
                    </div>
                  </div>

                  {/* Distribution individuelle par place */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Répartition par place
                      </Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const nextPlace = cashprizeDistribution.length > 0 
                            ? Math.max(...cashprizeDistribution.map(d => d.place)) + 1 
                            : 1;
                          setCashprizeDistribution([...cashprizeDistribution, { place: nextPlace, percent: 0 }]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Place
                      </Button>
                    </div>
                    
                    {cashprizeDistribution.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.place}
                          onChange={e => {
                            const newDist = [...cashprizeDistribution];
                            newDist[index] = { ...item, place: parseInt(e.target.value) || 1 };
                            setCashprizeDistribution(newDist);
                          }}
                          className="w-16"
                        />
                        <span className="text-sm text-muted-foreground">
                          {item.place === 1 ? 'er' : 'ème'}
                        </span>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.percent}
                          onChange={e => {
                            const newDist = [...cashprizeDistribution];
                            newDist[index] = { ...item, percent: parseInt(e.target.value) || 0 };
                            setCashprizeDistribution(newDist);
                          }}
                          className="w-20"
                        />
                        <span className="text-muted-foreground">%</span>
                        <span className="text-sm font-medium flex-1">
                          = {Math.round(cashprizeTotal * item.percent / 100)} {cashprizeCurrency}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCashprizeDistribution(cashprizeDistribution.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Répartition par plage */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Répartition par plage
                      </Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setCashprizeRanges([...cashprizeRanges, { startPlace: 4, endPlace: 10, percent: 0 }]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Plage
                      </Button>
                    </div>
                    
                    {cashprizeRanges.map((range, index) => (
                      <div key={index} className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">Du</span>
                        <Input
                          type="number"
                          min="1"
                          value={range.startPlace}
                          onChange={e => {
                            const newRanges = [...cashprizeRanges];
                            newRanges[index] = { ...range, startPlace: parseInt(e.target.value) || 1 };
                            setCashprizeRanges(newRanges);
                          }}
                          className="w-16"
                        />
                        <span className="text-sm text-muted-foreground">au</span>
                        <Input
                          type="number"
                          min="1"
                          value={range.endPlace}
                          onChange={e => {
                            const newRanges = [...cashprizeRanges];
                            newRanges[index] = { ...range, endPlace: parseInt(e.target.value) || 1 };
                            setCashprizeRanges(newRanges);
                          }}
                          className="w-16"
                        />
                        <span className="text-sm text-muted-foreground">:</span>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={range.percent}
                          onChange={e => {
                            const newRanges = [...cashprizeRanges];
                            newRanges[index] = { ...range, percent: parseInt(e.target.value) || 0 };
                            setCashprizeRanges(newRanges);
                          }}
                          className="w-20"
                        />
                        <span className="text-muted-foreground">%</span>
                        <span className="text-xs text-muted-foreground">
                          ({Math.round(cashprizeTotal * range.percent / 100)} {cashprizeCurrency} 
                          = {Math.round(cashprizeTotal * range.percent / 100 / (range.endPlace - range.startPlace + 1))}/joueur)
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCashprizeRanges(cashprizeRanges.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    
                    {cashprizeRanges.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Ex: 10% à répartir entre le 6ème et le 30ème
                      </p>
                    )}
                  </div>

                  {/* Lots matériels */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Lots matériels
                      </Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const nextPlace = materialPrizes.length > 0 
                            ? Math.max(...materialPrizes.map(p => p.place)) + 1 
                            : 1;
                          setMaterialPrizes([...materialPrizes, { place: nextPlace, description: '' }]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Lot
                      </Button>
                    </div>
                    
                    {materialPrizes.map((prize, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={prize.place}
                          onChange={e => {
                            const newPrizes = [...materialPrizes];
                            newPrizes[index] = { ...prize, place: parseInt(e.target.value) || 1 };
                            setMaterialPrizes(newPrizes);
                          }}
                          className="w-16"
                        />
                        <span className="text-sm text-muted-foreground">
                          {prize.place === 1 ? 'er' : 'ème'}
                        </span>
                        <Input
                          type="text"
                          placeholder="Description du lot..."
                          value={prize.description}
                          onChange={e => {
                            const newPrizes = [...materialPrizes];
                            newPrizes[index] = { ...prize, description: e.target.value };
                            setMaterialPrizes(newPrizes);
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setMaterialPrizes(materialPrizes.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    
                    {materialPrizes.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Ex: Trophée, médaille, bon d'achat...
                      </p>
                    )}
                  </div>

                  {/* Lots matériels par plage */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Lots par plage
                      </Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setMaterialPrizeRanges([...materialPrizeRanges, { startPlace: 4, endPlace: 10, description: '' }]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Plage
                      </Button>
                    </div>
                    
                    {materialPrizeRanges.map((range, index) => (
                      <div key={index} className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">Du</span>
                        <Input
                          type="number"
                          min="1"
                          value={range.startPlace}
                          onChange={e => {
                            const newRanges = [...materialPrizeRanges];
                            newRanges[index] = { ...range, startPlace: parseInt(e.target.value) || 1 };
                            setMaterialPrizeRanges(newRanges);
                          }}
                          className="w-16"
                        />
                        <span className="text-sm text-muted-foreground">au</span>
                        <Input
                          type="number"
                          min="1"
                          value={range.endPlace}
                          onChange={e => {
                            const newRanges = [...materialPrizeRanges];
                            newRanges[index] = { ...range, endPlace: parseInt(e.target.value) || 1 };
                            setMaterialPrizeRanges(newRanges);
                          }}
                          className="w-16"
                        />
                        <Input
                          type="text"
                          placeholder="Description du lot..."
                          value={range.description}
                          onChange={e => {
                            const newRanges = [...materialPrizeRanges];
                            newRanges[index] = { ...range, description: e.target.value };
                            setMaterialPrizeRanges(newRanges);
                          }}
                          className="flex-1 min-w-32"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setMaterialPrizeRanges(materialPrizeRanges.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    
                    {materialPrizeRanges.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Ex: Du 4ème au 10ème : Goodies
                      </p>
                    )}
                  </div>

                  {/* Total des pourcentages */}
                  {(() => {
                    const totalPercent = cashprizeDistribution.reduce((a, b) => a + b.percent, 0) +
                                        cashprizeRanges.reduce((a, b) => a + b.percent, 0);
                    return totalPercent !== 100 && totalPercent > 0 && (
                      <p className="text-xs text-warning">
                        ⚠️ Total : {totalPercent}% (devrait être 100%)
                      </p>
                    );
                  })()}
                </div>
              )}
            </div>
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

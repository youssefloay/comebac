import Image from "next/image";

interface FifaCardProps {
  playerName: string;
  overall: number;
  position: string;
  nationality: string;
  club: string;
  playerImage: string;
  stats: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
  cardColor?: string;
}

export function FifaCardSimple({
  playerName,
  overall,
  position,
  nationality,
  club,
  playerImage,
  stats,
  cardColor = "from-yellow-200 to-yellow-400"
}: FifaCardProps) {
  
  // Fonction pour obtenir le drapeau selon la nationalité
  const getFlagColors = (nationality: string) => {
    switch (nationality.toLowerCase()) {
      case 'france':
        return { color1: 'bg-blue-600', color2: 'bg-white', color3: 'bg-red-600' };
      case 'spain':
        return { color1: 'bg-red-600', color2: 'bg-yellow-400', color3: 'bg-red-600' };
      case 'brazil':
        return { color1: 'bg-green-500', color2: 'bg-yellow-400', color3: 'bg-blue-500' };
      case 'argentina':
        return { color1: 'bg-blue-400', color2: 'bg-white', color3: 'bg-blue-400' };
      case 'portugal':
        return { color1: 'bg-green-600', color2: 'bg-red-600', color3: 'bg-green-600' };
      case 'maroc':
      case 'morocco':
        return { color1: 'bg-red-600', color2: 'bg-red-600', color3: 'bg-red-600' };
      default:
        return { color1: 'bg-gray-400', color2: 'bg-white', color3: 'bg-gray-600' };
    }
  };

  // Fonction pour obtenir les couleurs du club
  const getClubColors = (club: string) => {
    switch (club.toLowerCase()) {
      case 'fc barcelone':
      case 'barcelona':
        return { primary: 'bg-blue-900', secondary: 'bg-red-600', accent: 'bg-yellow-400' };
      case 'real madrid':
        return { primary: 'bg-white', secondary: 'bg-purple-600', accent: 'bg-yellow-400' };
      case 'psg':
      case 'paris saint-germain':
        return { primary: 'bg-blue-900', secondary: 'bg-red-600', accent: 'bg-white' };
      case 'manchester city':
        return { primary: 'bg-sky-400', secondary: 'bg-white', accent: 'bg-yellow-400' };
      default:
        return { primary: 'bg-blue-900', secondary: 'bg-red-600', accent: 'bg-yellow-400' };
    }
  };

  const flagColors = getFlagColors(nationality);
  const clubColors = getClubColors(club);

  return (
    <div className={`relative w-[300px] h-[450px] bg-gradient-to-b ${cardColor} rounded-xl shadow-lg overflow-hidden font-sans text-black`}>
      {/* Top section: Overall, Position */}
      <div className="absolute top-4 left-4 flex justify-between w-[90%]">
        <div className="text-white font-bold text-xl drop-shadow-lg">{overall}</div>
        <div className="text-white font-semibold text-lg drop-shadow-lg">{position}</div>
      </div>

      {/* Player image */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
        <Image
          src={playerImage}
          alt={playerName}
          width={160}
          height={160}
          className="object-cover"
        />
      </div>

      {/* Player Name */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-center">
        <h1 className="text-white font-bold text-xl drop-shadow-lg">{playerName.toUpperCase()}</h1>
      </div>

      {/* Nationality & Club */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
        {/* Drapeau */}
        <div className="w-8 h-6 flex rounded-sm overflow-hidden border border-white shadow-sm">
          <div className={`flex-1 ${flagColors.color1}`}></div>
          <div className={`flex-1 ${flagColors.color2}`}></div>
          <div className={`flex-1 ${flagColors.color3}`}></div>
        </div>
        
        {/* Logo Club */}
        <div className={`w-8 h-8 ${clubColors.primary} rounded-full flex items-center justify-center border-2 border-white shadow-sm`}>
          <div className={`w-6 h-6 ${clubColors.secondary} rounded-full flex items-center justify-center`}>
            <div className={`w-4 h-4 ${clubColors.accent} rounded-full`}></div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-y-1 text-white text-sm font-semibold">
        <div className="flex justify-between bg-black/20 rounded px-2 py-1">
          <span>PAC</span>
          <span>{stats.pace}</span>
        </div>
        <div className="flex justify-between bg-black/20 rounded px-2 py-1">
          <span>SHO</span>
          <span>{stats.shooting}</span>
        </div>
        <div className="flex justify-between bg-black/20 rounded px-2 py-1">
          <span>PAS</span>
          <span>{stats.passing}</span>
        </div>
        <div className="flex justify-between bg-black/20 rounded px-2 py-1">
          <span>DRI</span>
          <span>{stats.dribbling}</span>
        </div>
        <div className="flex justify-between bg-black/20 rounded px-2 py-1">
          <span>DEF</span>
          <span>{stats.defending}</span>
        </div>
        <div className="flex justify-between bg-black/20 rounded px-2 py-1">
          <span>PHY</span>
          <span>{stats.physical}</span>
        </div>
      </div>
    </div>
  );
}
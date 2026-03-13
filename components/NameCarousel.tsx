import React from 'react';

const NAMES = [
  "Okafor", "Tanaka", "García", "Ivanov", "Chatterjee", 
  "Nguyen", "Müller", "Kuznetsov", "Al-Farsi", "Sato", 
  "Muhanji", "Silva", "Zhang", "Kim", "O'Sullivan",
  "Dubois", "Rossi", "Hansen", "Yilmaz", "Abebe",
  "Kaur", "Singh", "Rodriguez", "Popov", "Nowak",
  "Lefebvre", "Smit", "Jensen", "Bakker", "Santos",
  "Ferreira", "Pereira", "Costa", "Oliveira", "Martins",
  "Ali", "Ahmed", "Khan", "Ibrahim", "Hassan",
  "Wong", "Chen", "Li", "Liu", "Yang",
  "Suzuki", "Takahashi", "Watanabe", "Ito", "Yamamoto",
  "Park", "Lee", "Choi", "Jung", "Kang",
  "Diallo", "Traoré", "Koné", "Kamara", "Mensah",
  "Banda", "Phiri", "Moyo", "Dlamini", "Nkosi",
  "Gonzalez", "Hernandez", "Lopez", "Perez", "Gomez",
  "Smirnov", "Sokolov", "Mikhailov", "Fedorov", "Morozov",
  "Wang", "Zhao", "Huang", "Zhou", "Wu",
  "Cohen", "Levy", "Katz", "Friedman", "Goldberg",
  "Tremblay", "Gagnon", "Roy", "Cote", "Bouchard",
  "Korhonen", "Virtanen", "Makinen", "Nieminen", "Makela",
  "Johansson", "Andersson", "Karlsson", "Nilsson", "Eriksson",
  "Papadopoulos", "Vlachos", "Georgiou", "Petrou", "Dimitriou",
  "Kovács", "Tóth", "Szabó", "Horváth", "Varga",
  "Novák", "Svoboda", "Novotný", "Dvořák", "Černý",
  "Iliescu", "Popescu", "Radu", "Dumitrescu", "Stoica",
  "Nakamura", "Kobayashi", "Kato", "Yoshida", "Yamada",
  "Gomes", "Ribeiro", "Carvalho", "Almeida", "Lopes",
  "Garg", "Jain", "Agarwal", "Gupta", "Sharma",
  "Osei", "Appiah", "Owusu", "Boateng", "Agyemang",
  "Adebayo", "Ogunleye", "Balogun", "Adeyemi", "Ojo",
  "Mwangi", "Kariuki", "Kamau", "Ochieng", "Odhiambo",
  "Al-Sayed", "Al-Hassan", "Mahmoud", "Tariq", "Saleh",
  "Russo", "Ferrari", "Esposito", "Bianchi", "Romano",
  "García", "Fernández", "González", "Rodríguez", "López",
  "Martínez", "Sánchez", "Pérez", "Gómez", "Martín",
  "Kowalski", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński",
  "Lewandowski", "Zieliński", "Szymański", "Woźniak", "Dąbrowski",
  "Silva", "Santos", "Ferreira", "Pereira", "Oliveira",
  "Costa", "Rodrigues", "Martins", "Jesus", "Sousa",
  "Fernandes", "Gomes", "Marques", "Almeida", "Ribeiro",
  "Müller", "Schmidt", "Schneider", "Fischer", "Weber",
  "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann",
  "Smith", "Johnson", "Williams", "Brown", "Jones",
  "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris",
  "Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe",
  "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Kato",
  "Yoshida", "Yamada", "Sasaki", "Yamaguchi", "Saito",
  "Matsumoto", "Inoue", "Kimura", "Hayashi", "Shimizu",
  "Wang", "Li", "Zhang", "Liu", "Chen",
  "Yang", "Huang", "Zhao", "Wu", "Zhou",
  "Xu", "Sun", "Ma", "Zhu", "Hu",
  "Guo", "He", "Gao", "Lin", "Luo",
  "Kim", "Lee", "Park", "Choi", "Jung",
  "Kang", "Cho", "Yoon", "Jang", "Lim",
  "Han", "Oh", "Seo", "Shin", "Kwon",
  "Hwang", "Ahn", "Song", "Ryu", "Jeon",
  "Hong", "Go", "Moon", "Yang", "Son",
  "Bae", "Baek", "Huh", "Noh", "Nam"
];

interface Props {
  onNameClick?: (name: string) => void;
}

const NameCarousel: React.FC<Props> = ({ onNameClick }) => {
  // Use a fixed seed or just shuffle once on mount to avoid hydration mismatch if using SSR, 
  // but here it's purely client-side React.
  const shuffled = React.useMemo(() => {
    const doubled = [...NAMES, ...NAMES];
    return doubled.sort(() => 0.5 - Math.random());
  }, []);
  
  // Split into 12 rows for a dense look that fills the screen
  const row1 = shuffled.slice(0, 40);
  const row2 = shuffled.slice(40, 80);
  const row3 = shuffled.slice(80, 120);
  const row4 = shuffled.slice(120, 160);
  const row5 = shuffled.slice(160, 200);
  const row6 = shuffled.slice(200, 240);
  const row7 = shuffled.slice(240, 280);
  const row8 = shuffled.slice(280, 320);
  const row9 = shuffled.slice(320, 360);
  const row10 = shuffled.slice(360, 400);
  const row11 = shuffled.slice(400, 440);
  const row12 = shuffled.slice(440, 480);
  const row13 = shuffled.slice(480, 520);
  const row14 = shuffled.slice(520, 560);
  const row15 = shuffled.slice(560, 600);

  const Row = ({ names, speed, direction }: { names: string[], speed: number, direction: 'left' | 'right' }) => (
    <div className="flex overflow-hidden whitespace-nowrap py-4 select-none opacity-80 hover:opacity-100 transition-opacity">
      <div 
        className="flex min-w-max items-center hover:[animation-play-state:paused]"
        style={{ animation: `marquee-${direction} ${speed}s linear infinite` }}
      >
        {names.map((name, i) => (
          <span 
            key={i} 
            onClick={() => onNameClick && onNameClick(name)}
            className={`mx-6 text-2xl md:text-3xl font-bold text-stone-400 hover:text-[#D97706] transition-colors ${onNameClick ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {name}
          </span>
        ))}
        {/* Duplicate for seamless loop */}
        {names.map((name, i) => (
          <span 
            key={`dup-${i}`} 
            onClick={() => onNameClick && onNameClick(name)}
            className={`mx-6 text-2xl md:text-3xl font-bold text-stone-400 hover:text-[#D97706] transition-colors ${onNameClick ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full py-12 overflow-hidden relative flex flex-col justify-center">
      <div className="transform -rotate-2 scale-125 relative z-0">
        <Row names={row1} speed={250} direction="left" />
        <Row names={row2} speed={220} direction="right" />
        <Row names={row3} speed={280} direction="left" />
        <Row names={row4} speed={240} direction="right" />
        <Row names={row5} speed={260} direction="left" />
        <Row names={row6} speed={230} direction="right" />
        <Row names={row7} speed={270} direction="left" />
        <Row names={row8} speed={210} direction="right" />
        <Row names={row9} speed={290} direction="left" />
        <Row names={row10} speed={250} direction="right" />
        <Row names={row11} speed={230} direction="left" />
        <Row names={row12} speed={260} direction="right" />
        <Row names={row13} speed={240} direction="left" />
        <Row names={row14} speed={280} direction="right" />
        <Row names={row15} speed={220} direction="left" />
      </div>
    </div>
  );
};

export default NameCarousel;

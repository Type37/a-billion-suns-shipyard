// Naming your High-Value Personnel.
//
// The rules ask for this directly (p.57, "Naming Your HVP"): "I have given them
// generic titles, but you can make a space in your fleet list to give them
// unique names if you like. Not just 'Chief Engineer', but 'Lt. Commander Sadie
// Hyatt, Chief Engineer'." The die beside the personnel field fills one in.
//
// Every name below is transcribed, not invented: the faction rosters in
// NAME_LISTS and the d100 name tables in TABLES. A roll picks a culture, then
// either takes a whole name off a roster or builds one from that culture's
// table - given + surname, given + place, or a bare place. Nothing is decorated
// with epithets, callsigns or titles: the table is the whole vocabulary.

import { TRIBUTE_NAMES } from "./tributes.ts";

export type Rand = () => number;

/** A d100 name table: three columns of people, one of places. */
export interface NameTable {
  male: string[];
  female: string[];
  surname: string[];
  place: string[];
}

// ---------------------------------------------------------------------------
// d100 tables
// ---------------------------------------------------------------------------

export const TABLES: Record<string, NameTable> = {
  arabic: {
    male: [
      "Aamir", "Ayub", "Binyamin", "Efraim", "Ibrahim", "Ilyas", "Ismail", "Jibril",
      "Jumanah", "Kazi", "Lut", "Matta", "Mohammed", "Mubarak", "Mustafa", "Nazir",
      "Rahim", "Reza", "Sharif", "Taimur", "Usman", "Yakub", "Yusuf", "Zakariya", "Zubair",
    ],
    female: [
      "Aisha", "Alimah", "Badia", "Bisharah", "Chanda", "Daliya", "Fatimah", "Ghania",
      "Halah", "Kaylah", "Khayrah", "Layla", "Mina", "Munisa", "Mysha", "Naimah",
      "Nissa", "Nura", "Parveen", "Rana", "Shalha", "Suhira", "Tahirah", "Yasmin", "Zulehka",
    ],
    surname: [
      "Abdel", "Awad", "Dahhak", "Essa", "Hanna", "Harbi", "Hassan", "Isa", "Kasim",
      "Katib", "Khalil", "Malik", "Mansoor", "Mazin", "Musa", "Najeeb", "Namari",
      "Naser", "Rahman", "Rasheed", "Saleh", "Salim", "Shadi", "Sulaiman", "Tabari",
    ],
    place: [
      "Adan", "Ahsa", "Andalus", "Asmara", "Asqlan", "Baqubah", "Basit", "Baysan",
      "Baytlahm", "Bursaid", "Dahilah", "Darasalam", "Dawhah", "Ganin", "Gebal",
      "Gibuti", "Giddah", "Harmah", "Hartum", "Hibah", "Hims", "Hubar", "Karbala",
      "Kut", "Lacant", "Magrit", "Masqat", "Misr", "Muruni", "Qabis", "Qina", "Rabat",
      "Ramlah", "Riyadh", "Sabtah", "Salalah", "Sana", "Sinqit", "Suqutrah", "Sur",
      "Tabuk", "Tangah", "Tarifah", "Tarrakunah", "Tisit", "Uman", "Urdunn", "Wasqah",
      "Yaburah", "Yaman",
    ],
  },

  chinese: {
    male: [
      "Aiguo", "Bohai", "Chao", "Dai", "Dawei", "Duyi", "Fa", "Fu", "Gui", "Hong",
      "Jianyu", "Kang", "Li", "Niu", "Peng", "Quan", "Ru", "Shen", "Shi", "Song",
      "Tao", "Xue", "Yi", "Yuan", "Zian",
    ],
    female: [
      "Biyu", "Changying", "Daiyu", "Huidai", "Huiliang", "Jia", "Jingfei", "Lan",
      "Liling", "Liu", "Meili", "Niu", "Peizhi", "Qiao", "Qing", "Ruolan", "Shu",
      "Suyin", "Ting", "Xia", "Xiaowen", "Xiulan", "Ya", "Ying", "Zhilan",
    ],
    surname: [
      "Bai", "Cao", "Chen", "Cui", "Ding", "Du", "Fang", "Fu", "Guo", "Han", "Hao",
      "Huang", "Lei", "Li", "Liang", "Liu", "Long", "Song", "Tan", "Tang", "Wang",
      "Wu", "Xing", "Yang", "Zhang",
    ],
    place: [
      "Andong", "Anqing", "Anshan", "Chaoyang", "Chaozhou", "Chifeng", "Dalian",
      "Dunhuang", "Fengjia", "Fengtian", "Fuliang", "Fushun", "Gansu", "Ganzhou",
      "Guizhou", "Hotan", "Hunan", "Jinan", "Jingdezhen", "Jinxi", "Jinzhou",
      "Kunming", "Liaoning", "Linyi", "Lushun", "Luzhou", "Ningxia", "Pingxiang",
      "Pizhou", "Qidong", "Qingdao", "Qinghai", "Rehe", "Shanxi", "Taiyuan",
      "Tengzhou", "Urumqi", "Weifang", "Wugang", "Wuxi", "Xiamen", "Xian", "Xikang",
      "Xining", "Xinjiang", "Yingkou", "Yuxi", "Zigong", "Zoige",
    ],
  },

  english: {
    male: [
      "Adam", "Albert", "Alfred", "Allan", "Archibald", "Arthur", "Basil", "Charles",
      "Colin", "Donald", "Douglas", "Edgar", "Edmund", "Edward", "George", "Harold",
      "Henry", "Ian", "James", "John", "Lewis", "Oliver", "Philip", "Richard", "William",
    ],
    female: [
      "Abigail", "Anne", "Beatrice", "Blanche", "Catherine", "Charlotte", "Claire",
      "Eleanor", "Elizabeth", "Emily", "Emma", "Georgia", "Harriet", "Joan", "Judy",
      "Julia", "Lucy", "Lydia", "Margaret", "Mary", "Molly", "Nora", "Rosie", "Sarah",
      "Victoria",
    ],
    surname: [
      "Barker", "Brown", "Butler", "Carter", "Chapman", "Collins", "Cook", "Davies",
      "Gray", "Green", "Harris", "Jackson", "Jones", "Lloyd", "Miller", "Roberts",
      "Smith", "Taylor", "Thomas", "Turner", "Watson", "White", "Williams", "Wood",
      "Young",
    ],
    place: [
      "Aldington", "Appleton", "Ashdon", "Berwick", "Bramford", "Brimstage", "Carden",
      "Churchill", "Clifton", "Colby", "Copford", "Cromer", "Davenham", "Dersingham",
      "Doverdale", "Elsted", "Ferring", "Gissing", "Heydon", "Holt", "Hunston",
      "Hutton", "Inkberrow", "Inworth", "Isfield", "Kedington", "Latchford", "Leigh",
      "Leighton", "Maresfield", "Markshall", "Netherpool", "Newton", "Oxton",
      "Preston", "Ridley", "Rochford", "Seaford", "Selsey", "Stanton", "Stockham",
      "Stoke", "Sutton", "Thakeham", "Thetford", "Thorndon", "Ulting", "Upton",
      "Westhorpe", "Worcester",
    ],
  },

  greek: {
    male: [
      "Alexander", "Alexius", "Anastasius", "Christodoulos", "Christos", "Damian",
      "Dimitris", "Dysmas", "Elias", "Giorgos", "Ioannis", "Konstantinos", "Lambros",
      "Leonidas", "Marcos", "Miltiades", "Nestor", "Nikos", "Orestes", "Petros",
      "Simon", "Stavros", "Theodore", "Vassilios", "Yannis",
    ],
    female: [
      "Alexandra", "Amalia", "Callisto", "Charis", "Chloe", "Dorothea", "Elena",
      "Eudoxia", "Giada", "Helena", "Ioanna", "Lydia", "Melania", "Melissa", "Nika",
      "Nikolina", "Olympias", "Philippa", "Phoebe", "Sophia", "Theodora", "Valentina",
      "Valeria", "Yianna", "Zoe",
    ],
    surname: [
      "Andreas", "Argyros", "Dimitriou", "Floros", "Gavras", "Ioannidis", "Katsaros",
      "Kyrkos", "Leventis", "Makris", "Metaxas", "Nikolaidis", "Pallis", "Pappas",
      "Petrou", "Raptis", "Simonides", "Spiros", "Stavros", "Stephanidis", "Stratigos",
      "Terzis", "Theodorou", "Vasiliadis", "Yannakakis",
    ],
    place: [
      "Adramyttion", "Ainos", "Alikarnassos", "Avydos", "Dakia", "Dardanos",
      "Dekapoli", "Dodoni", "Efesos", "Efstratios", "Elefsina", "Ellada", "Epidavros",
      "Erymanthos", "Evripos", "Gavdos", "Gytheio", "Ikaria", "Ilios", "Illyria",
      "Iraia", "Irakleio", "Isminos", "Ithaki", "Kadmeia", "Kallisto", "Katerini",
      "Kithairon", "Kydonia", "Lakonia", "Leros", "Lesvos", "Limnos", "Lykia",
      "Megara", "Messene", "Milos", "Nikaia", "Orontis", "Parnasos", "Petro", "Samos",
      "Syros", "Thapsos", "Thessalia", "Thira", "Thiva", "Varvara", "Voiotia", "Vyvlos",
    ],
  },

  indian: {
    male: [
      "Amrit", "Ashok", "Chand", "Dinesh", "Gobind", "Harinder", "Jagdish", "Johar",
      "Kurien", "Lakshman", "Madhav", "Mahinder", "Mohal", "Narinder", "Nikhil",
      "Omrao", "Prasad", "Pratap", "Ranjit", "Sanjay", "Shankar", "Thakur", "Vijay",
      "Vipul", "Yash",
    ],
    female: [
      "Amala", "Asha", "Chandra", "Devika", "Esha", "Gita", "Indira", "Indrani",
      "Jaya", "Jayanti", "Kiri", "Lalita", "Malati", "Mira", "Mohana", "Neela", "Nita",
      "Rajani", "Sarala", "Sarika", "Sheela", "Sunita", "Trishna", "Usha", "Vasanta",
    ],
    surname: [
      "Achari", "Banerjee", "Bhatnagar", "Bose", "Chauhan", "Chopra", "Das", "Dutta",
      "Gupta", "Johar", "Kapoor", "Mahajan", "Malhotra", "Mehra", "Nehru", "Patil",
      "Rao", "Saxena", "Shah", "Sharma", "Singh", "Trivedi", "Venkatesan", "Verma",
      "Yadav",
    ],
    place: [
      "Ahmedabad", "Alipurduar", "Alubari", "Anjanadri", "Ankleshwar", "Balarika",
      "Bhanuja", "Bhilwada", "Brahmaghosa", "Bulandshahar", "Candrama", "Chalisgaon",
      "Chandragiri", "Charbagh", "Chayanka", "Chittorgarh", "Dayabasti", "Dikpala",
      "Ekanga", "Gandhidham", "Gollaprolu", "Grahisa", "Guwahati", "Haridasva",
      "Indraprastha", "Jaisalmer", "Jharonda", "Kadambur", "Kalasipalyam", "Karnataka",
      "Kutchuhery", "Lalgola", "Mainaguri", "Nainital", "Nandidurg", "Narayanadri",
      "Panipat", "Panjagutta", "Pathankot", "Pathardih", "Porbandar", "Rajasthan",
      "Renigunta", "Sewagram", "Shakurbasti", "Siliguri", "Sonepat", "Teliwara",
      "Tinpahar", "Villivakkam",
    ],
  },

  japanese: {
    male: [
      "Akira", "Daisuke", "Fukashi", "Goro", "Hiro", "Hiroya", "Hotaka", "Katsu",
      "Katsuto", "Keishuu", "Kyuuto", "Mikiya", "Mitsunobu", "Mitsuru", "Naruhiko",
      "Nobu", "Shigeo", "Shigeto", "Shou", "Shuji", "Takaharu", "Teruaki", "Tetsushi",
      "Tsukasa", "Yasuharu",
    ],
    female: [
      "Aemi", "Airi", "Ako", "Ayu", "Chikaze", "Eriko", "Hina", "Kaori", "Keiko",
      "Kyouka", "Mayumi", "Miho", "Namiko", "Natsu", "Nobuko", "Rei", "Ririsa",
      "Sakimi", "Shihoko", "Shika", "Tsukiko", "Tsuzune", "Yoriko", "Yorimi", "Yoshiko",
    ],
    surname: [
      "Abe", "Arakaki", "Endo", "Fujiwara", "Goto", "Ito", "Kikuchi", "Kinjo",
      "Kobayashi", "Koga", "Komatsu", "Maeda", "Nakamura", "Narita", "Ochi", "Oshiro",
      "Saito", "Sakamoto", "Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe",
      "Yamamoto", "Yamasaki",
    ],
    place: [
      "Bando", "Chikuma", "Chikusei", "Chino", "Hitachi", "Hitachinaka",
      "Hitachiomiya", "Hitachiota", "Iida", "Iiyama", "Ina", "Inashiki", "Ishioka",
      "Itako", "Kamisu", "Kasama", "Kashima", "Kasumigaura", "Kitaibaraki", "Kiyose",
      "Koga", "Komagane", "Komoro", "Matsumoto", "Mito", "Mitsukaido", "Moriya",
      "Nagano", "Naka", "Nakano", "Ogi", "Okaya", "Omachi", "Ryugasaki", "Saku",
      "Settsu", "Shimotsuma", "Shiojiri", "Suwa", "Suzaka", "Takahagi", "Takeo",
      "Tomi", "Toride", "Tsuchiura", "Tsukuba", "Ueda", "Ushiku", "Yoshikawa", "Yuki",
    ],
  },

  latin: {
    male: [
      "Agrippa", "Appius", "Aulus", "Caeso", "Decimus", "Faustus", "Gaius", "Gnaeus",
      "Hostus", "Lucius", "Mamercus", "Manius", "Marcus", "Mettius", "Nonus",
      "Numerius", "Opiter", "Paulus", "Proculus", "Publius", "Quintus", "Servius",
      "Tiberius", "Titus", "Volescus",
    ],
    female: [
      "Appia", "Aula", "Caesula", "Decima", "Fausta", "Gaia", "Gnaea", "Hosta",
      "Lucia", "Maio", "Marcia", "Maxima", "Mettia", "Nona", "Numeria", "Octavia",
      "Postuma", "Prima", "Procula", "Septima", "Servia", "Tertia", "Tiberia", "Titia",
      "Vibia",
    ],
    surname: [
      "Antius", "Aurius", "Barbatius", "Calidius", "Cornelius", "Decius", "Fabius",
      "Flavius", "Galerius", "Horatius", "Julius", "Juventius", "Licinius", "Marius",
      "Minicius", "Nerius", "Octavius", "Pompeius", "Quinctius", "Rutilius", "Sextius",
      "Titius", "Ulpius", "Valerius", "Vitellius",
    ],
    place: [
      "Abilia", "Alsium", "Aquileia", "Argentoratum", "Ascrivium", "Asculum",
      "Attalia", "Barium", "Batavorum", "Belum", "Bobbium", "Brigantium", "Burgodunum",
      "Camulodunum", "Clausentum", "Corduba", "Coriovallum", "Durocobrivis",
      "Eboracum", "Emona", "Florentia", "Lactodurum", "Lentia", "Lindum", "Londinium",
      "Lucus", "Lugdunum", "Mediolanum", "Novaesium", "Patavium", "Pistoria",
      "Pompeii", "Raurica", "Rigomagus", "Roma", "Salernum", "Salona", "Segovia",
      "Sirmium", "Spalatum", "Tarraco", "Treverorum", "Verulamium", "Vesontio",
      "Vetera", "Vindelicorum", "Vindobona", "Vinovia", "Viroconium", "Volubilis",
    ],
  },

  nigerian: {
    male: [
      "Adesegun", "Akintola", "Amabere", "Arikawe", "Asagwara", "Chidubem", "Chinedu",
      "Chiwetei", "Damilola", "Esangbedo", "Ezenwoye", "Folarin", "Genechi", "Idowu",
      "Kelechi", "Ketanndu", "Melubari", "Nkanta", "Obafemi", "Olatunde", "Olumide",
      "Tombari", "Udofia", "Uyoata", "Uzochi",
    ],
    female: [
      "Abike", "Adesuwa", "Adunola", "Anguli", "Arewa", "Asari", "Bisola", "Chioma",
      "Eduwa", "Emilohi", "Fehintola", "Folasade", "Mahparah", "Minika", "Nkolika",
      "Nkoyo", "Nuanae", "Obioma", "Olafemi", "Shanumi", "Sominabo", "Suliat",
      "Tariere", "Temedire", "Yemisi",
    ],
    surname: [
      "Adegboye", "Adeniyi", "Adeyeku", "Adunola", "Agbaje", "Akpan", "Akpehi",
      "Aliki", "Asuni", "Babangida", "Ekim", "Ezeiruaku", "Fabiola", "Fasola",
      "Nwokolo", "Nzeocha", "Ojo", "Okonkwo", "Okoye", "Olaniyan", "Olawale",
      "Olumese", "Onajobi", "Soyinka", "Yamusa",
    ],
    place: [
      "Abadan", "Ador", "Agatu", "Akamkpa", "Akpabuyo", "Ala", "Askira", "Bakassi",
      "Bama", "Bayo", "Bekwara", "Biase", "Boki", "Buruku", "Calabar", "Chibok",
      "Damboa", "Dikwa", "Etung", "Gboko", "Gubio", "Guzamala", "Gwoza", "Hawul",
      "Ikom", "Jere", "Kalabalge", "Katsina", "Knoduga", "Konshishatse", "Kukawa",
      "Kwande", "Kwayakusar", "Logo", "Mafa", "Makurdi", "Nganzai", "Obanliku", "Obi",
      "Obubra", "Obudu", "Odukpani", "Ogbadibo", "Ohimini", "Okpokwu", "Otukpo",
      "Shani", "Ugep", "Vandeikya", "Yala",
    ],
  },

  russian: {
    male: [
      "Aleksandr", "Andrei", "Arkady", "Boris", "Dmitri", "Dominik", "Grigory", "Igor",
      "Ilya", "Ivan", "Kiril", "Konstantin", "Leonid", "Nikolai", "Oleg", "Pavel",
      "Petr", "Sergei", "Stepan", "Valentin", "Vasily", "Viktor", "Yakov", "Yegor",
      "Yuri",
    ],
    female: [
      "Aleksandra", "Anastasia", "Anja", "Catarina", "Devora", "Dima", "Ekaterina",
      "Eva", "Irina", "Karolina", "Katina", "Kira", "Ludmila", "Mara", "Nadezdha",
      "Nastassia", "Natalya", "Oksana", "Olena", "Olga", "Sofia", "Svetlana",
      "Tatyana", "Vilma", "Yelena",
    ],
    surname: [
      "Abelev", "Bobrikov", "Chemerkin", "Gogunov", "Gurov", "Iltchenko", "Kavelin",
      "Komarov", "Korovin", "Kurnikov", "Lebedev", "Litvak", "Mekhdiev", "Muraviev",
      "Nikitin", "Ortov", "Peshkov", "Romasko", "Shvedov", "Sikorski", "Stolypin",
      "Turov", "Volokh", "Zaitsev", "Zhukov",
    ],
    place: [
      "Amur", "Arkhangelsk", "Astrakhan", "Belgorod", "Bryansk", "Chelyabinsk",
      "Chita", "Gorki", "Irkutsk", "Ivanovo", "Kaliningrad", "Kaluga", "Kamchatka",
      "Kemerovo", "Kirov", "Kostroma", "Kurgan", "Kursk", "Leningrad", "Lipetsk",
      "Magadan", "Moscow", "Murmansk", "Novgorod", "Novosibirsk", "Omsk", "Orenburg",
      "Oryol", "Penza", "Perm", "Pskov", "Rostov", "Ryazan", "Sakhalin", "Samara",
      "Saratov", "Smolensk", "Sverdlovsk", "Tambov", "Tomsk", "Tula", "Tver", "Tyumen",
      "Ulyanovsk", "Vladimir", "Volgograd", "Vologda", "Voronezh", "Vyborg", "Yaroslavl",
    ],
  },

  spanish: {
    male: [
      "Alejandro", "Alonso", "Amelio", "Armando", "Bernardo", "Carlos", "Cesar",
      "Diego", "Emilio", "Estevan", "Felipe", "Francisco", "Guillermo", "Javier",
      "Jose", "Juan", "Julio", "Luis", "Pedro", "Raul", "Ricardo", "Salvador",
      "Santiago", "Valeriano", "Vicente",
    ],
    female: [
      "Adalina", "Aleta", "Ana", "Ascencion", "Beatriz", "Carmela", "Celia", "Dolores",
      "Elena", "Emelina", "Felipa", "Inez", "Isabel", "Jacinta", "Lucia", "Lupe",
      "Maria", "Marta", "Nina", "Paloma", "Rafaela", "Soledad", "Teresa", "Valencia",
      "Zenaida",
    ],
    surname: [
      "Arellano", "Arispana", "Borrego", "Carderas", "Carranzo", "Cordova", "Enciso",
      "Espejo", "Gavilan", "Guerra", "Guillen", "Huertas", "Illan", "Jurado",
      "Moretta", "Motolinia", "Pancorbo", "Paredes", "Quesada", "Roma", "Rubiera",
      "Santoro", "Torrillas", "Vera", "Vivero",
    ],
    place: [
      "Aguascebas", "Alcazar", "Barranquete", "Bravatas", "Cabezudos", "Calderon",
      "Cantera", "Castillo", "Delgadas", "Donablanca", "Encinetas", "Estrella",
      "Faustino", "Fuentebravia", "Gafarillos", "Gironda", "Higueros", "Huelago",
      "Humilladero", "Illora", "Isabela", "Izbor", "Jandilla", "Jinetes", "Limones",
      "Loreto", "Lujar", "Marbela", "Matagorda", "Nacimiento", "Niguelas", "Ogijares",
      "Ortegicar", "Pampanico", "Pelado", "Quesada", "Quintera", "Riguelo", "Ruescas",
      "Salteras", "Santopitar", "Taberno", "Torres", "Umbrete", "Valdecazorla",
      "Velez", "Vistahermosa", "Yeguas", "Zahora", "Zumeta",
    ],
  },
};

// ---------------------------------------------------------------------------
// Rosters: whole names, taken as written
// ---------------------------------------------------------------------------

export const NAME_LISTS: Record<string, string[]> = {
  // The easter egg (see src/tributes.ts). Weighted far below every real
  // culture, so an HVP turns out to be a game designer about once in seventy
  // rolls - often enough to happen at a table, rare enough to be a surprise.
  tribute: TRIBUTE_NAMES,
  caledonia: [
    "Jack Robertson", "Charlie Campbell", "Callum Paterson", "Rory Campbell",
    "Gawen Stewart", "Robert Balfour", "James Conroy", "Nairn Kinnison",
    "Rannoch MacGillivray", "Connor MacLaren", "Lachlan Rose", "Caitlin MacDonald",
    "Imogen Anderson", "Dierdre Murray", "Eila Young", "Elesbeth Mitchell",
    "Isobella Christie", "Katreine Culloden", "Roselette MacColl",
    "Williamina MacEdwards", "Vanora O'Neill", "Besseta Paget", "Fynvola Cunningham",
  ],
  usariadna: [
    "Sebastian Smith", "Noah Williams", "Benjamin Jones", "Mason Miller",
    "Ethan Rodriguez", "Jacob Carter", "Luke Parker", "Jaxon Flores", "Eli Rivera",
    "Connor Rogers", "Nathan Morgan", "Dominic Price", "Kennedy Johnson",
    "Abigail Brown", "Scarlett Garcia", "Lily Wilson", "Penelope Anderson",
    "Addison King", "Natalie Myers", "Caroline Foster", "Gabriella Taylor",
    "Julia Robinson", "Vivian Bennett", "Athena Jenkins",
  ],
  merovingia: [
    "Alexandre Thomas", "Armand Picou", "Bastin Vallot", "Florian Germaine",
    "Gabriel Figard", "Hugo Dubois", "Leo Helbert", "Louis Lefevre", "Raphael Martin",
    "Sacha Bonneville", "Theo Leroy", "Alice Pichon", "Camille Autry", "Chloe Bonnet",
    "Delphine Dutoit", "Emma Petit", "Gabrielle Durand", "Jade Demerchant",
    "Juliette Laurent", "Lea Marcoux", "Maelys Viverette", "Margarete Sauvage",
    "Mathilde Simon",
  ],
  rodina: [
    "Maksim Smirnov", "Artyom Voyennoy", "Ivan Lebedev", "Andrey Kozlov",
    "Yegor Novikov", "Mark Vorobyov", "Fyodor Ushakov", "Sergey Lukin",
    "Konstantin Davydov", "Platon Falin", "Leonid Gurin", "Amir Dmitriev",
    "Irina Ivanova", "Zlatov Kusnetsova", "Angelina Sokolova", "Kristina Morozova",
    "Sofiya Petrova", "Mariya Volkova", "Anna Bogdanova", "Viktoriya Savina",
    "Kseniya Angeloffa", "Valeriya Berezina", "Kira Shubina", "Alyona Melnikova",
  ],
  caliphate: [
    "Afif Al-Medini", "Ghayth Al-Ferdousi", "Hasan Al-Qalawari", "Iqbal Al-Bahiti",
    "Ismail Al-Ravansari", "Jamaal Al-Funduqi", "Khaled Boutros", "Miraj Faheem",
    "Muhammad Hadrami", "Nurul Mortara", "Saleh Dandachi", "Zahira Al-Talawati",
    "Suraya Al-Medinati", "Shadiya Al-Amali", "Azra Al-Mish'iyahi", "Dania Al-Nawali",
    "Fidda Al-Turfani", "Hadia Hajji", "Inas Farrugia", "Janan Nadwi", "Laila Okasha",
    "Aaliyah Rashid", "Munira Tarhouni",
  ],
  khanate: [
    "Nabi Abdullayev", "Waleed Akhmatov", "Ghafoor Sulaimanov", "Jangi Isakov",
    "Habib Karimov", "Ghulam Sultanov", "Aibek Yunusov", "Yeruslan Zhaparov",
    "Sukhrab Babaev", "Taalay Ergashev", "Kanat Rasulov", "Kasym Tynstanov",
    "Homa Kadyrova", "Zeyba Akmatova", "Fereyba Osmonova", "Laila Asanova",
    "Nasrin Ialiyeva", "Ayesha Rakhimova", "Anara Sydykova", "Bermet Sultanbekova",
    "Gulnara Zhusupova", "Jyrgal Aytamova", "Byubyusara Ergasheva", "Nazira Kurbanova",
  ],
  shahnate: [
    "Yousef Abbasi", "Vahid Esfahani", "Omid Dehkordi", "Reza Gul", "Kian Hashemi",
    "Khurshid Jahandar", "Davud Khadem", "Eskandar Mokri", "Azad Parsi",
    "Bahman Rajavi", "Sadeq Tir", "Amaya Ahura", "Astar Avesta", "Leila Dabiri",
    "Delara Farahmand", "Mina Hooshang", "Firuzeh Jamshidi", "Yasamin Kazemi",
    "Zaynab Lajani", "Jaleh Mehregan", "Roshanak Paria", "Maryam Shamshiri",
    "Kiana Jazani",
  ],
  sultanate: [
    // The source roster is alphabetical by surname and its sixth entry lost its
    // surname somewhere upstream - "Muhammed", nothing after it, between Kaya
    // and Koca. Kilic is filled in for it: it sorts into that gap, and it is
    // the same kind of word as the names around it (Aslan lion, Kaplan tiger,
    // Ceylan gazelle, Reis captain - Kilic, sword).
    "Yusuf Aga", "Mustafa Aslan", "Mirac Bata", "Ayaz Dogan", "Ahmet Kaya",
    "Muhammed Kilic", "Emir Koca", "Koray Malas", "Mansur Onder", "Zekeriya Ozan", "Ensar Sari",
    "Ozturk Ceylan", "Medine Asker", "Mira Barak", "Elif-Nur Beg", "Esma Kaplan",
    "Beren Koc", "Zeynep Kocak", "Ecrin Mogul", "Defne Osman", "Elif-Ada Reis",
    "Hulya Tabak", "Fadime Tati", "Cemile Younan",
  ],
  nomads: [
    "Emilio Accardo", "Gianpiero Allegra", "Mirko Balla", "Alfonso Carota",
    "Cipriano Ferrari", "Renzo Colombo", "Jacopo Scuderi", "Dieter Ahlbrecht",
    "Michael Beissel", "Christian Damitz", "Karl Doring", "Lukas Finkel",
    "Jannik Glass", "Jurgen Welle", "Sorin Petran", "Artem Vaduva",
    "Sebastian Nicolescu", "Marisus Adam", "Remus Ardelean", "Victor Ionescu",
    "Emil Matei", "Ignas Kublius", "Darius Simonis", "Tautrimas Zukauskas",
    "Titus Pavlis", "Benas Miskinis", "Livia Alessandrini", "Samanta Rossi",
    "Monica Bergamo", "Tatiana Carriere", "Marilena Codella", "Zaira Mancini",
    "Perlita Lombardi", "Gertrud Allendorf", "Gisela Banghart", "Christa Dall",
    "Petra Ganske", "Lena Goerdt", "Birgit Vogus", "Karin Loeb", "Ioana Balan",
    "Daria Grigorescu", "Ralu Lungu", "Orsi Pacuraru", "Anita Botezatu",
    "Maia Angeles", "Ramona Radu", "Greta Adomaitis", "Rosita Rubis", "Alina Wirkus",
    "Victoria Markunas", "Elina Gabrys", "Lalia Dinius", "Modesta Gaida",
  ],
  panoceania: [
    "Afendi Tengku", "Nagor Megat", "Samuri Nik", "Zulfikri Merican", "Jalani Daeng",
    "Anastacio Abaya", "Venju Bautista", "Romulo Dacua", "Jestoni Esguerra",
    "Sinag King", "Diwa Mateo", "Jelvin Silonga", "Chyll Tizon", "Jagjeet Apte",
    "Kashif Badami", "Sunpreet Chaudhari", "Nihal Jain", "Midhu Padmanabhan",
    "Anandkumar Sethi", "Ricardo Fernandez", "Jupiter Blanco", "Ryano Varela",
    "Francisco Nunez", "Jorao Medina", "Miguel Valenzuela", "Carlinhos Ferreira",
    "Adirah Wan", "Dilah Raja", "Jetny Che", "Nitia Khan", "Sofea Teuku",
    "Aisa Fontanilla", "Dharla Galvez", "Lunabeth Hidalgo", "Charina Lucero",
    "Trixia Nofuente", "Philomena Perez", "Ellithia Ramirez", "Naomae Zapata",
    "Inika Chandra", "Shamiya Ganesh", "Shivi Kala", "Navitha Mani", "Bashita Narang",
    "Mamta Radhakrishnan", "Abril Garcia", "Edmea Suarez", "Ivonete Sosa",
    "Kinnia Cardoso", "Ticiana Rojas", "Raica Fuentes", "Jandira Contreras",
    "Maira Sepulveda", "Adriana Rousseff",
  ],
  mandarin: [
    "Ang Bing", "Au Yeung Lei", "Bo Dewei", "Bu Gao", "Cai Liko", "Cao Ming",
    "Cham Wang", "Chang Guanting", "Cheong Hong", "Chin Zhuang", "Deng Chen", "Du Min",
    "Feng Rong", "Fok Niao-ka", "Fung Shi", "Geng Qiang", "Guan Genjo", "Han Yao",
    "Hsiao Xi-Wang", "Hsueh Jiang", "Ip Hsin", "Jang Deshi", "Kam Qing", "Kho Zhu",
    "Kwock Ye", "Lei Fo-hsing", "Lok Da-xia", "Lu Kimora", "Mei Ushi", "Moy Fai",
    "Ng Zhi", "Ngai Xun", "Ping Hua", "Qi Lee", "Rao Li Mei", "Seto Ting", "Shan Ya",
    "Shieh Lim", "Shing Bao", "Song Chen-chio", "Soong Xi", "Tan Xiang", "Toh Jingyi",
    "Tong Jun", "Tsang Bo", "Tso Bai", "Tzeng Xiao-Niao", "Wan Lim", "Weng Ping",
    "Wong Ru", "Xiang Chen-tao", "Xiao Shufen", "Yang Yin", "Yeh Shui",
  ],
  "yu-jing-japanese": [
    "Abe Fukuya", "Fukuda Keiji", "Hattori Buichiro", "Komatsu Hanamaru",
    "Ishida Aihito", "Nakajima Makkenyu", "Sakamoto Mikko", "Takashima Hiro",
    "Honda Sao", "Ashikaga Renki", "Hamada Segiko", "Fujita Kumori", "Kaneko Ikumi",
    "Nitta Menori", "Sada Natsune", "Shintani Madoka", "Tanaka Iro", "Tao Yoshimi",
  ],
  korean: [
    "Jeong Beom-seok", "Ban Seo-jun", "Hyun Tae-hwan", "Kwan Jun-seo", "Lee Min-jun",
    "Pyun Ju-heon", "Han Chae-seon", "Lim Eo-jin", "Moon Han-sol", "Paek Min-seo",
    "Youn Da-eun", "Seo Seo-yun",
  ],
  vietnamese: [
    "Nguyen Bien Vy", "Binh Lanan Ninh", "Pham Dao Tam", "Vu Khoi Hoang", "Tran Cuong",
    "Ngo Gia Trung", "Nguyen Auco Shamiekwa", "Diep Chan Than", "Hoang Khiem Baolinh",
    "Duong Hang Zaochi", "Dao Lanan Thikim", "Kien Nghia Khue",
  ],
};

// ---------------------------------------------------------------------------
// Rolling
// ---------------------------------------------------------------------------

const TABLE_KEYS = Object.keys(TABLES);
const LIST_KEYS = Object.keys(NAME_LISTS);
/** Every culture a roll can land on, rosters and tables together. */
export const CULTURES = [...LIST_KEYS, ...TABLE_KEYS];

/**
 * How often each culture comes up, relative to the others.
 *
 * Flat odds put 14 of the 24 cultures - 58% of all rolls - on the faction
 * rosters, which are the smallest and most distinctive lists in the file, so
 * they repeated first and hardest. The tables carry hundreds of combinations
 * each and can take the traffic.
 *
 * 10 is the baseline table. Japanese and Indian sit a little under it, Russian
 * further under, and every roster is equally lower again. Weights are relative,
 * so any of them can be nudged without touching the others.
 */
export const CULTURE_WEIGHT: Record<string, number> = {
  arabic: 10,
  chinese: 10,
  english: 10,
  greek: 10,
  latin: 10,
  nigerian: 10,
  spanish: 10,
  japanese: 8,
  indian: 8,
  russian: 6,
  tribute: 2,
};
const ROSTER_WEIGHT = 4;

/** Cumulative weights, built once: [culture, running total]. */
const WEIGHTED: Array<[string, number]> = [];
let WEIGHT_TOTAL = 0;
for (const culture of CULTURES) {
  WEIGHT_TOTAL += CULTURE_WEIGHT[culture] ?? ROSTER_WEIGHT;
  WEIGHTED.push([culture, WEIGHT_TOTAL]);
}

/** The odds of each culture, as a fraction of 1. For tests and for tuning. */
export function cultureOdds(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of CULTURES) out[c] = (CULTURE_WEIGHT[c] ?? ROSTER_WEIGHT) / WEIGHT_TOTAL;
  return out;
}

function pick<T>(arr: readonly T[], rand: Rand): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

/** The culture a roll lands on. Exported so a test can walk the whole range. */
export function pickCulture(rand: Rand): string {
  const r = rand() * WEIGHT_TOTAL;
  for (const [culture, upTo] of WEIGHTED) if (r < upTo) return culture;
  return WEIGHTED[WEIGHTED.length - 1]![0];
}

/**
 * Roll a name: a culture first, then a name from it.
 *
 * A roster culture hands back a whole name as written. A table culture builds
 * one - given + surname most of the time, sometimes given + place, sometimes a
 * place on its own. The culture is weighted (see CULTURE_WEIGHT); the name
 * within it is not, because the tables are d100 tables and every row on one is
 * as likely as every other.
 */
export function rollName(rand: Rand = Math.random): string {
  const culture = pickCulture(rand);

  const list = NAME_LISTS[culture];
  if (list) return pick(list, rand);

  const t = TABLES[culture]!;
  const given = pick(rand() < 0.5 ? t.male : t.female, rand);
  const shape = rand();
  if (shape < 0.7) return `${given} ${pick(t.surname, rand)}`;
  if (shape < 0.9) return `${given} ${pick(t.place, rand)}`;
  return pick(t.place, rand);
}

// ---------------------------------------------------------------------------
// Who does not get rolled
// ---------------------------------------------------------------------------

/**
 * Factions whose High-Value Personnel are not human beings.
 *
 * Every name in this file is a human name off a human table, so the die has
 * nothing to offer these four and is not shown on their rows at all:
 *
 *   aegis               HVP are "Protocol Shards" (p.164) - software. Every
 *                       entry is "<something> Protocols". Nobody is in there.
 *   golem-mega-systems  The book titles the section "Mission Critical Systems
 *                       (High-Value Personnel)" (p.159). Targeting Matrix,
 *                       Auto-Repair Relay: machinery aboard a machine.
 *   vyke                Alien, and named by caste before self (p.162) -
 *                       Brood-Mother, Molt-Priest, Clade-Principle.
 *   alliance            The Alliance of NON-HUMAN Worlds (p.170). Gorgronti,
 *                       Rannari and Yynnx, and the book labels which is which
 *                       in the title of every one of its HVP.
 *
 * This covers the five generic HVP (p.57) in those fleets too, deliberately: a
 * Chief Engineer in an AEGIS fleet is still a protocol shard, because AEGIS's
 * own faction rule says every HVP it holds is one.
 */
export const NON_HUMAN_FACTIONS = new Set(["aegis", "golem-mega-systems", "vyke", "alliance"]);

/**
 * Individual HVP in otherwise-human factions who still take no rolled name.
 *
 * Two reasons, both from the book:
 *
 *   Not human -    the Discord's wings are human; their Gorgronti Veteran
 *                  (p.157) is not.
 *   Not a person - a crew, a cell or a cabal is a group, and "Documentary Crew
 *                  Callum Paterson" is a category error.
 *
 * And one that is its own joke: Gen Omega's Nameless Punk (p.169) has no name
 * on purpose, and handing them one deletes the only characterisation they have.
 *
 * The Ordinate's Blessed Lambda and Quantum Seraph were on this list once, read
 * as relics its priests keep rather than priests. They are not: the user's call,
 * and the titles are honorifics on people, the way the Hand of the Registrar is.
 */
export const NON_HUMAN_HVP = new Set([
  "gorgronti-veteran",   // The Discord
  "the-nameless-punk",   // Gen Omega
  "righteous-saboteurs", // Gen Omega - a cell
  "documentary-crew",    // News Inc. - a crew
  "technocratic-cabal",  // The Ordinate - a cabal
]);

/**
 * Whether this HVP can be handed a rolled name at all.
 *
 * Custom factions are not listed either way and default to yes: a homebrew
 * faction is human until its author says otherwise, and an unwanted die is a
 * smaller problem than a missing one.
 */
export function canRollName(factionId: string, hvpId: string): boolean {
  return !NON_HUMAN_FACTIONS.has(factionId) && !NON_HUMAN_HVP.has(hvpId);
}

/**
 * Name an HVP: the printed job title, plus whoever the die found.
 *
 * Returns the whole line, because that is what the field holds and what the
 * roster prints - "Chief Engineer Callum Paterson". The title stays in front
 * for the same reason the field is seeded with it (see render.ts): the row has
 * to keep saying what this person does, in a list you read down.
 */
export function rollHvpName(title: string, rand: Rand = Math.random): string {
  return `${title} ${rollName(rand)}`;
}

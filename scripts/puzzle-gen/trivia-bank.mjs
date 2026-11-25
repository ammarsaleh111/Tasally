// Factually verified, deterministic trivia bank for Tasally (3,650+ unique questions).
// Every question has: question, options, answer, correctIndex, category, difficulty, source.

const WORLD_COUNTRIES = [
  ["Egypt", "Cairo", "Africa"], ["France", "Paris", "Europe"], ["Japan", "Tokyo", "Asia"],
  ["Brazil", "Brasilia", "South America"], ["Canada", "Ottawa", "North America"], ["Australia", "Canberra", "Oceania"],
  ["Germany", "Berlin", "Europe"], ["Italy", "Rome", "Europe"], ["Spain", "Madrid", "Europe"],
  ["Portugal", "Lisbon", "Europe"], ["United Kingdom", "London", "Europe"], ["Ireland", "Dublin", "Europe"],
  ["Netherlands", "Amsterdam", "Europe"], ["Belgium", "Brussels", "Europe"], ["Switzerland", "Bern", "Europe"],
  ["Austria", "Vienna", "Europe"], ["Poland", "Warsaw", "Europe"], ["Czechia", "Prague", "Europe"],
  ["Hungary", "Budapest", "Europe"], ["Greece", "Athens", "Europe"], ["Sweden", "Stockholm", "Europe"],
  ["Norway", "Oslo", "Europe"], ["Denmark", "Copenhagen", "Europe"], ["Finland", "Helsinki", "Europe"],
  ["Iceland", "Reykjavik", "Europe"], ["Romania", "Bucharest", "Europe"], ["Bulgaria", "Sofia", "Europe"],
  ["Croatia", "Zagreb", "Europe"], ["Serbia", "Belgrade", "Europe"], ["Ukraine", "Kyiv", "Europe"],
  ["Turkey", "Ankara", "Asia"], ["Russia", "Moscow", "Europe"], ["Morocco", "Rabat", "Africa"],
  ["Algeria", "Algiers", "Africa"], ["Tunisia", "Tunis", "Africa"], ["Libya", "Tripoli", "Africa"],
  ["Sudan", "Khartoum", "Africa"], ["Ethiopia", "Addis Ababa", "Africa"], ["Kenya", "Nairobi", "Africa"],
  ["Tanzania", "Dodoma", "Africa"], ["Uganda", "Kampala", "Africa"], ["Nigeria", "Abuja", "Africa"],
  ["Ghana", "Accra", "Africa"], ["Senegal", "Dakar", "Africa"], ["South Africa", "Pretoria", "Africa"],
  ["Namibia", "Windhoek", "Africa"], ["Botswana", "Gaborone", "Africa"], ["Zimbabwe", "Harare", "Africa"],
  ["Zambia", "Lusaka", "Africa"], ["Madagascar", "Antananarivo", "Africa"], ["Angola", "Luanda", "Africa"],
  ["Saudi Arabia", "Riyadh", "Asia"], ["United Arab Emirates", "Abu Dhabi", "Asia"], ["Qatar", "Doha", "Asia"],
  ["Kuwait", "Kuwait City", "Asia"], ["Oman", "Muscat", "Asia"], ["Jordan", "Amman", "Asia"],
  ["Lebanon", "Beirut", "Asia"], ["Iraq", "Baghdad", "Asia"], ["Iran", "Tehran", "Asia"],
  ["India", "New Delhi", "Asia"], ["Pakistan", "Islamabad", "Asia"], ["Bangladesh", "Dhaka", "Asia"],
  ["Sri Lanka", "Sri Jayawardenepura Kotte", "Asia"], ["Nepal", "Kathmandu", "Asia"], ["China", "Beijing", "Asia"],
  ["South Korea", "Seoul", "Asia"], ["North Korea", "Pyongyang", "Asia"], ["Vietnam", "Hanoi", "Asia"],
  ["Thailand", "Bangkok", "Asia"], ["Malaysia", "Kuala Lumpur", "Asia"], ["Indonesia", "Jakarta", "Asia"],
  ["Philippines", "Manila", "Asia"], ["Singapore", "Singapore", "Asia"], ["Mongolia", "Ulaanbaatar", "Asia"],
  ["Kazakhstan", "Astana", "Asia"], ["Uzbekistan", "Tashkent", "Asia"], ["Mexico", "Mexico City", "North America"],
  ["United States", "Washington, D.C.", "North America"], ["Cuba", "Havana", "North America"],
  ["Jamaica", "Kingston", "North America"], ["Costa Rica", "San Jose", "North America"],
  ["Panama", "Panama City", "North America"], ["Guatemala", "Guatemala City", "North America"],
  ["Argentina", "Buenos Aires", "South America"], ["Chile", "Santiago", "South America"],
  ["Colombia", "Bogota", "South America"], ["Peru", "Lima", "South America"],
  ["Ecuador", "Quito", "South America"], ["Venezuela", "Caracas", "South America"],
  ["Uruguay", "Montevideo", "South America"], ["Paraguay", "Asuncion", "South America"],
  ["Bolivia", "Sucre", "South America"], ["New Zealand", "Wellington", "Oceania"],
  ["Fiji", "Suva", "Oceania"], ["Papua New Guinea", "Port Moresby", "Oceania"],
  ["Slovakia", "Bratislava", "Europe"], ["Slovenia", "Ljubljana", "Europe"], ["Estonia", "Tallinn", "Europe"],
  ["Latvia", "Riga", "Europe"], ["Lithuania", "Vilnius", "Europe"], ["Luxembourg", "Luxembourg", "Europe"],
  ["Malta", "Valletta", "Europe"], ["Cyprus", "Nicosia", "Europe"], ["Georgia", "Tbilisi", "Asia"],
  ["Armenia", "Yerevan", "Asia"], ["Azerbaijan", "Baku", "Asia"], ["Cambodia", "Phnom Penh", "Asia"],
  ["Laos", "Vientiane", "Asia"], ["Myanmar", "Naypyidaw", "Asia"], ["Afghanistan", "Kabul", "Asia"],
  ["Rwanda", "Kigali", "Africa"], ["Cameroon", "Yaounde", "Africa"], ["Mali", "Bamako", "Africa"],
  ["Niger", "Niamey", "Africa"], ["Chad", "N'Djamena", "Africa"], ["Mauritania", "Nouakchott", "Africa"],
  ["Mozambique", "Maputo", "Africa"], ["Malawi", "Lilongwe", "Africa"], ["Somalia", "Mogadishu", "Africa"],
  ["Djibouti", "Djibouti", "Africa"], ["Bahrain", "Manama", "Asia"], ["Yemen", "Sanaa", "Asia"],
  ["Syria", "Damascus", "Asia"], ["Honduras", "Tegucigalpa", "North America"], ["Nicaragua", "Managua", "North America"],
  ["El Salvador", "San Salvador", "North America"], ["Dominican Republic", "Santo Domingo", "North America"],
  ["Haiti", "Port-au-Prince", "North America"], ["Bahamas", "Nassau", "North America"],
  ["Barbados", "Bridgetown", "North America"], ["Trinidad and Tobago", "Port of Spain", "North America"],
  ["Guyana", "Georgetown", "South America"], ["Suriname", "Paramaribo", "South America"],
  ["Belarus", "Minsk", "Europe"], ["Moldova", "Chisinau", "Europe"], ["Albania", "Tirana", "Europe"],
  ["North Macedonia", "Skopje", "Europe"], ["Montenegro", "Podgorica", "Europe"], ["Bosnia and Herzegovina", "Sarajevo", "Europe"],
];

const US_STATES = [
  ["Alabama", "Montgomery", "AL"], ["Alaska", "Juneau", "AK"], ["Arizona", "Phoenix", "AZ"],
  ["Arkansas", "Little Rock", "AR"], ["California", "Sacramento", "CA"], ["Colorado", "Denver", "CO"],
  ["Connecticut", "Hartford", "CT"], ["Delaware", "Dover", "DE"], ["Florida", "Tallahassee", "FL"],
  ["Georgia", "Atlanta", "GA"], ["Hawaii", "Honolulu", "HI"], ["Idaho", "Boise", "ID"],
  ["Illinois", "Springfield", "IL"], ["Indiana", "Indianapolis", "IN"], ["Iowa", "Des Moines", "IA"],
  ["Kansas", "Topeka", "KS"], ["Kentucky", "Frankfort", "KY"], ["Louisiana", "Baton Rouge", "LA"],
  ["Maine", "Augusta", "ME"], ["Maryland", "Annapolis", "MD"], ["Massachusetts", "Boston", "MA"],
  ["Michigan", "Lansing", "MI"], ["Minnesota", "Saint Paul", "MN"], ["Mississippi", "Jackson", "MS"],
  ["Missouri", "Jefferson City", "MO"], ["Montana", "Helena", "MT"], ["Nebraska", "Lincoln", "NE"],
  ["Nevada", "Carson City", "NV"], ["New Hampshire", "Concord", "NH"], ["New Jersey", "Trenton", "NJ"],
  ["New Mexico", "Santa Fe", "NM"], ["New York", "Albany", "NY"], ["North Carolina", "Raleigh", "NC"],
  ["North Dakota", "Bismarck", "ND"], ["Ohio", "Columbus", "OH"], ["Oklahoma", "Oklahoma City", "OK"],
  ["Oregon", "Salem", "OR"], ["Pennsylvania", "Harrisburg", "PA"], ["Rhode Island", "Providence", "RI"],
  ["South Carolina", "Columbia", "SC"], ["South Dakota", "Pierre", "SD"], ["Tennessee", "Nashville", "TN"],
  ["Texas", "Austin", "TX"], ["Utah", "Salt Lake City", "UT"], ["Vermont", "Montpelier", "VT"],
  ["Virginia", "Richmond", "VA"], ["Washington", "Olympia", "WA"], ["West Virginia", "Charleston", "WV"],
  ["Wisconsin", "Madison", "WI"], ["Wyoming", "Cheyenne", "WY"],
];

const ELEMENTS = [
  [1, "H", "Hydrogen"], [2, "He", "Helium"], [3, "Li", "Lithium"], [4, "Be", "Beryllium"],
  [5, "B", "Boron"], [6, "C", "Carbon"], [7, "N", "Nitrogen"], [8, "O", "Oxygen"],
  [9, "F", "Fluorine"], [10, "Ne", "Neon"], [11, "Na", "Sodium"], [12, "Mg", "Magnesium"],
  [13, "Al", "Aluminum"], [14, "Si", "Silicon"], [15, "P", "Phosphorus"], [16, "S", "Sulfur"],
  [17, "Cl", "Chlorine"], [18, "Ar", "Argon"], [19, "K", "Potassium"], [20, "Ca", "Calcium"],
  [21, "Sc", "Scandium"], [22, "Ti", "Titanium"], [23, "V", "Vanadium"], [24, "Cr", "Chromium"],
  [25, "Mn", "Manganese"], [26, "Fe", "Iron"], [27, "Co", "Cobalt"], [28, "Ni", "Nickel"],
  [29, "Cu", "Copper"], [30, "Zn", "Zinc"], [31, "Ga", "Gallium"], [32, "Ge", "Germanium"],
  [33, "As", "Arsenic"], [34, "Se", "Selenium"], [35, "Br", "Bromine"], [36, "Kr", "Krypton"],
  [37, "Rb", "Rubidium"], [38, "Sr", "Strontium"], [39, "Y", "Yttrium"], [40, "Zr", "Zirconium"],
  [41, "Nb", "Niobium"], [42, "Mo", "Molybdenum"], [43, "Tc", "Technetium"], [44, "Ru", "Ruthenium"],
  [45, "Rh", "Rhodium"], [46, "Pd", "Palladium"], [47, "Ag", "Silver"], [48, "Cd", "Cadmium"],
  [49, "In", "Indium"], [50, "Sn", "Tin"], [51, "Sb", "Antimony"], [52, "Te", "Tellurium"],
  [53, "I", "Iodine"], [54, "Xe", "Xenon"], [55, "Cs", "Cesium"], [56, "Ba", "Barium"],
  [57, "La", "Lanthanum"], [58, "Ce", "Cerium"], [59, "Pr", "Praseodymium"], [60, "Nd", "Neodymium"],
  [61, "Pm", "Promethium"], [62, "Sm", "Samarium"], [63, "Eu", "Europium"], [64, "Gd", "Gadolinium"],
  [65, "Tb", "Terbium"], [66, "Dy", "Dysprosium"], [67, "Ho", "Holmium"], [68, "Er", "Erbium"],
  [69, "Tm", "Thulium"], [70, "Yb", "Ytterbium"], [71, "Lu", "Lutetium"], [72, "Hf", "Hafnium"],
  [73, "Ta", "Tantalum"], [74, "W", "Tungsten"], [75, "Re", "Rhenium"], [76, "Os", "Osmium"],
  [77, "Ir", "Iridium"], [78, "Pt", "Platinum"], [79, "Au", "Gold"], [80, "Hg", "Mercury"],
  [81, "Tl", "Thallium"], [82, "Pb", "Lead"], [83, "Bi", "Bismuth"], [84, "Po", "Polonium"],
  [85, "At", "Astatine"], [86, "Rn", "Radon"], [87, "Fr", "Francium"], [88, "Ra", "Radium"],
  [89, "Ac", "Actinium"], [90, "Th", "Thorium"], [91, "Pa", "Protactinium"], [92, "U", "Uranium"],
  [93, "Np", "Neptunium"], [94, "Pu", "Plutonium"], [95, "Am", "Americium"], [96, "Cm", "Curium"],
  [97, "Bk", "Berkelium"], [98, "Cf", "Californium"], [99, "Es", "Einsteinium"], [100, "Fm", "Fermium"],
  [101, "Md", "Mendelevium"], [102, "No", "Nobelium"], [103, "Lr", "Lawrencium"], [104, "Rf", "Rutherfordium"],
  [105, "Db", "Dubnium"], [106, "Sg", "Seaborgium"], [107, "Bh", "Bohrium"], [108, "Hs", "Hassium"],
  [109, "Mt", "Meitnerium"], [110, "Ds", "Darmstadtium"], [111, "Rg", "Roentgenium"], [112, "Cn", "Copernicium"],
  [113, "Nh", "Nihonium"], [114, "Fl", "Flerovium"], [115, "Mc", "Moscovium"], [116, "Lv", "Livermorium"],
  [117, "Ts", "Tennessine"], [118, "Og", "Oganesson"],
];

const CURATED_GENERAL_FACTS = [
  // Astronomy & Physics
  ["Which planet is closest to the Sun?", ["Mercury", "Venus", "Earth", "Mars"], "Mercury", "Science", "easy", "NASA Solar System Exploration"],
  ["Which planet is known as the Red Planet?", ["Mars", "Jupiter", "Venus", "Saturn"], "Mars", "Science", "easy", "NASA Solar System Exploration"],
  ["What is the largest planet in our solar system?", ["Jupiter", "Saturn", "Neptune", "Uranus"], "Jupiter", "Science", "easy", "NASA Solar System Exploration"],
  ["Which planet has the most prominent ring system?", ["Saturn", "Uranus", "Jupiter", "Neptune"], "Saturn", "Science", "easy", "NASA Solar System Exploration"],
  ["What is the SI unit of electrical resistance?", ["Ohm", "Volt", "Ampere", "Watt"], "Ohm", "Science", "medium", "BIPM SI Brochure"],
  ["What is the SI unit of force?", ["Newton", "Joule", "Pascal", "Watt"], "Newton", "Science", "easy", "BIPM SI Brochure"],
  ["What is the SI unit of energy?", ["Joule", "Newton", "Watt", "Tesla"], "Joule", "Science", "easy", "BIPM SI Brochure"],
  ["What is the SI unit of power?", ["Watt", "Joule", "Volt", "Hertz"], "Watt", "Science", "easy", "BIPM SI Brochure"],
  ["What is the SI unit of frequency?", ["Hertz", "Tesla", "Weber", "Kelvin"], "Hertz", "Science", "easy", "BIPM SI Brochure"],
  ["What is the SI unit of pressure?", ["Pascal", "Newton", "Joule", "Bar"], "Pascal", "Science", "medium", "BIPM SI Brochure"],
  ["What is the SI unit of magnetic flux density?", ["Tesla", "Weber", "Henry", "Coulomb"], "Tesla", "Science", "medium", "BIPM SI Brochure"],
  ["What is the SI unit of electric charge?", ["Coulomb", "Ampere", "Volt", "Farad"], "Coulomb", "Science", "medium", "BIPM SI Brochure"],
  ["What is the SI unit of capacitance?", ["Farad", "Henry", "Ohm", "Siemens"], "Farad", "Science", "hard", "BIPM SI Brochure"],
  ["What is the SI unit of inductance?", ["Henry", "Farad", "Tesla", "Weber"], "Henry", "Science", "hard", "BIPM SI Brochure"],
  ["At standard atmospheric pressure, at what temperature Celsius does pure water freeze?", ["0°C", "32°C", "-10°C", "4°C"], "0°C", "Science", "easy", "IUPAC / BIPM"],
  ["At standard atmospheric pressure, at what temperature Celsius does pure water boil?", ["100°C", "90°C", "112°C", "212°C"], "100°C", "Science", "easy", "IUPAC / BIPM"],
  ["What is the approximate speed of light in a vacuum in km/s?", ["300,000 km/s", "150,000 km/s", "30,000 km/s", "1,000,000 km/s"], "300,000 km/s", "Science", "medium", "CODATA"],
  ["Which subatomic particle carries a negative electric charge?", ["Electron", "Proton", "Neutron", "Photon"], "Electron", "Science", "easy", "Particle Data Group"],
  ["Which subatomic particle has no electric charge?", ["Neutron", "Proton", "Electron", "Positron"], "Neutron", "Science", "easy", "Particle Data Group"],
  ["What is the most abundant gas in Earth's atmosphere?", ["Nitrogen", "Oxygen", "Carbon Dioxide", "Argon"], "Nitrogen", "Science", "easy", "NOAA Atmosphere Data"],
  ["What is the hardest naturally occurring mineral on the Mohs scale?", ["Diamond", "Quartz", "Corundum", "Topaz"], "Diamond", "Science", "easy", "USGS Mineralogy"],
  ["How many bones are in the adult human body?", ["206", "196", "216", "256"], "206", "Science", "easy", "Gray's Anatomy"],
  ["Which blood type is known as the universal red-cell donor?", ["O negative", "AB positive", "A positive", "B negative"], "O negative", "Science", "medium", "WHO Blood Transfusion Guidelines"],
  ["What is the largest organ of the human body?", ["Skin", "Liver", "Lungs", "Small Intestine"], "Skin", "Science", "easy", "Gray's Anatomy"],
  ["Which organelle is known as the powerhouse of the cell?", ["Mitochondria", "Nucleus", "Ribosome", "Golgi apparatus"], "Mitochondria", "Science", "easy", "Molecular Biology of the Cell"],
  ["What molecule carries genetic instructions in most living organisms?", ["DNA", "ATP", "Glucose", "Hemoglobin"], "DNA", "Science", "easy", "Molecular Biology of the Cell"],
  ["How many chambers does a human heart have?", ["4", "2", "3", "6"], "4", "Science", "easy", "Gray's Anatomy"],
  ["Which gas do plants primarily absorb from the atmosphere for photosynthesis?", ["Carbon dioxide", "Nitrogen", "Oxygen", "Methane"], "Carbon dioxide", "Science", "easy", "Encyclopedia Britannica"],
  ["What is the pH value of pure neutral water at 25°C?", ["7", "0", "5", "14"], "7", "Science", "easy", "IUPAC"],
  ["Which planet in our solar system has the hottest surface temperature?", ["Venus", "Mercury", "Mars", "Jupiter"], "Venus", "Science", "medium", "NASA Solar System Exploration"],
  // History & Landmarks
  ["In which year did Apollo 11 first land humans on the Moon?", ["1969", "1965", "1971", "1973"], "1969", "History", "easy", "NASA History"],
  ["In which year did World War II end?", ["1945", "1943", "1947", "1939"], "1945", "History", "easy", "Encyclopedia Britannica"],
  ["In which year did World War I begin?", ["1914", "1918", "1912", "1920"], "1914", "History", "easy", "Encyclopedia Britannica"],
  ["In which year did the Berlin Wall fall?", ["1989", "1985", "1991", "1979"], "1989", "History", "easy", "Encyclopedia Britannica"],
  ["In which country are the Pyramids of Giza located?", ["Egypt", "Sudan", "Mexico", "Peru"], "Egypt", "History", "easy", "UNESCO World Heritage"],
  ["In which city is the Colosseum located?", ["Rome", "Athens", "Naples", "Milan"], "Rome", "History", "easy", "UNESCO World Heritage"],
  ["In which country is Machu Picchu located?", ["Peru", "Chile", "Bolivia", "Colombia"], "Peru", "History", "easy", "UNESCO World Heritage"],
  ["In which country is the Taj Mahal located?", ["India", "Pakistan", "Nepal", "Bangladesh"], "India", "History", "easy", "UNESCO World Heritage"],
  ["In which year was the Magna Carta first sealed?", ["1215", "1066", "1492", "1348"], "1215", "History", "medium", "British Library"],
  ["Who was the first President of the United States?", ["George Washington", "Thomas Jefferson", "John Adams", "Abraham Lincoln"], "George Washington", "History", "easy", "US National Archives"],
  ["Who invented the movable-type printing press in Europe around 1440?", ["Johannes Gutenberg", "Galileo Galilei", "Leonardo da Vinci", "Isaac Newton"], "Johannes Gutenberg", "History", "easy", "Encyclopedia Britannica"],
  ["Which ancient civilization built Petra in modern-day Jordan?", ["Nabataeans", "Phoenicians", "Sumerians", "Minoans"], "Nabataeans", "History", "medium", "UNESCO World Heritage"],
  ["In which year was the United Nations founded?", ["1945", "1919", "1950", "1939"], "1945", "History", "medium", "United Nations"],
  ["Who was the first woman to win a Nobel Prize?", ["Marie Curie", "Rosalind Franklin", "Ada Lovelace", "Florence Nightingale"], "Marie Curie", "History", "easy", "Nobel Prize Archives"],
  ["Which strait separates Europe from Africa at its narrowest point in the west?", ["Strait of Gibraltar", "Bering Strait", "Strait of Hormuz", "Strait of Malacca"], "Strait of Gibraltar", "Geography", "medium", "Encyclopedia Britannica"],
  // Literature & Arts
  ["Who wrote the play 'Hamlet'?", ["William Shakespeare", "Christopher Marlowe", "Charles Dickens", "Jane Austen"], "William Shakespeare", "Arts & Literature", "easy", "Folger Shakespeare Library"],
  ["Who painted the 'Mona Lisa'?", ["Leonardo da Vinci", "Michelangelo", "Raphael", "Donatello"], "Leonardo da Vinci", "Arts & Literature", "easy", "Louvre Museum"],
  ["Who painted 'The Starry Night'?", ["Vincent van Gogh", "Claude Monet", "Pablo Picasso", "Salvador Dali"], "Vincent van Gogh", "Arts & Literature", "easy", "MoMA"],
  ["Who wrote 'Pride and Prejudice'?", ["Jane Austen", "Charlotte Bronte", "Emily Bronte", "Mary Shelley"], "Jane Austen", "Arts & Literature", "easy", "British Library"],
  ["Who wrote '1984'?", ["George Orwell", "Aldous Huxley", "Ray Bradbury", "H.G. Wells"], "George Orwell", "Arts & Literature", "easy", "Encyclopedia Britannica"],
  ["Who wrote 'The Odyssey'?", ["Homer", "Virgil", "Sophocles", "Euripides"], "Homer", "Arts & Literature", "easy", "Encyclopedia Britannica"],
  ["Who wrote 'Don Quixote'?", ["Miguel de Cervantes", "Gabriel Garcia Marquez", "Jorge Luis Borges", "Pablo Neruda"], "Miguel de Cervantes", "Arts & Literature", "medium", "Encyclopedia Britannica"],
  ["How many keys are on a standard full-size piano?", ["88", "76", "92", "64"], "88", "Arts & Literature", "easy", "Encyclopedia Britannica"],
  ["How many strings does a standard concert violin have?", ["4", "5", "6", "3"], "4", "Arts & Literature", "easy", "Encyclopedia Britannica"],
  ["Which composer wrote the 'Moonlight Sonata'?", ["Ludwig van Beethoven", "Wolfgang Amadeus Mozart", "Johann Sebastian Bach", "Frederic Chopin"], "Ludwig van Beethoven", "Arts & Literature", "easy", "Encyclopedia Britannica"],
  // Computing & Tech
  ["What does 'HTTP' stand for?", ["Hypertext Transfer Protocol", "Hyperlink Text Transmission Process", "High Transfer Text Protocol", "Host Transport Terminal Protocol"], "Hypertext Transfer Protocol", "Computing", "easy", "IETF RFC 9110"],
  ["What does 'CPU' stand for?", ["Central Processing Unit", "Core Program Unit", "Central Power Unit", "Computer Processing Utility"], "Central Processing Unit", "Computing", "easy", "IEEE Computer Society"],
  ["What HTTP status code indicates 'Not Found'?", ["404", "403", "500", "301"], "404", "Computing", "easy", "IETF RFC 9110"],
  ["What HTTP status code indicates 'OK' (successful request)?", ["200", "201", "204", "302"], "200", "Computing", "easy", "IETF RFC 9110"],
  ["What HTTP status code indicates 'Internal Server Error'?", ["500", "400", "404", "503"], "500", "Computing", "easy", "IETF RFC 9110"],
  ["What HTTP status code indicates 'Unauthorized'?", ["401", "403", "400", "404"], "401", "Computing", "medium", "IETF RFC 9110"],
  ["What HTTP status code indicates 'Forbidden'?", ["403", "401", "404", "429"], "403", "Computing", "medium", "IETF RFC 9110"],
  ["What HTTP status code indicates 'Too Many Requests'?", ["429", "408", "502", "413"], "429", "Computing", "medium", "IETF RFC 6585"],
  ["How many bits are in one byte?", ["8", "4", "16", "32"], "8", "Computing", "easy", "ISO/IEC 2382"],
  ["Which default TCP port is used by HTTPS?", ["443", "80", "22", "53"], "443", "Computing", "medium", "IANA Port Registry"],
  ["Which default TCP port is used by unencrypted HTTP?", ["80", "443", "21", "25"], "80", "Computing", "easy", "IANA Port Registry"],
  ["Which default TCP port is used by SSH?", ["22", "23", "80", "3306"], "22", "Computing", "medium", "IANA Port Registry"],
  ["Which default port is used by PostgreSQL?", ["5432", "3306", "27017", "6379"], "5432", "Computing", "medium", "PostgreSQL Documentation"],
  ["Who is credited with writing the first algorithm intended for a machine (the Analytical Engine)?", ["Ada Lovelace", "Alan Turing", "Grace Hopper", "Charles Babbage"], "Ada Lovelace", "Computing", "easy", "Encyclopedia Britannica"],
  ["Who created the Python programming language?", ["Guido van Rossum", "James Gosling", "Bjarne Stroustrup", "Dennis Ritchie"], "Guido van Rossum", "Computing", "medium", "Python Software Foundation"],
  ["Who created the C programming language?", ["Dennis Ritchie", "Ken Thompson", "Linus Torvalds", "Niklaus Wirth"], "Dennis Ritchie", "Computing", "medium", "Bell Labs / ACM"],
  ["Who created the Linux kernel in 1991?", ["Linus Torvalds", "Richard Stallman", "Ken Thompson", "Bill Joy"], "Linus Torvalds", "Computing", "easy", "Linux Foundation"],
  ["What data structure operates on a Last-In, First-Out (LIFO) principle?", ["Stack", "Queue", "Heap", "Hash Table"], "Stack", "Computing", "easy", "CLRS Introduction to Algorithms"],
  ["What data structure operates on a First-In, First-Out (FIFO) principle?", ["Queue", "Stack", "Binary Tree", "Graph"], "Queue", "Computing", "easy", "CLRS Introduction to Algorithms"],
  ["What is the average-case time complexity of binary search on a sorted array of size n?", ["O(log n)", "O(n)", "O(1)", "O(n log n)"], "O(log n)", "Computing", "medium", "CLRS Introduction to Algorithms"],
  // Sports & General
  ["How many players are on the field for one team in a standard association football (soccer) match?", ["11", "9", "10", "12"], "11", "General Knowledge", "easy", "IFAB Laws of the Game"],
  ["In chess, which piece can only move diagonally?", ["Bishop", "Rook", "Knight", "Queen"], "Bishop", "General Knowledge", "easy", "FIDE Laws of Chess"],
  ["How many squares are on a standard chessboard?", ["64", "48", "72", "100"], "64", "General Knowledge", "easy", "FIDE Laws of Chess"],
  ["How many minutes are in one standard half of a professional football (soccer) match?", ["45", "40", "50", "30"], "45", "General Knowledge", "easy", "IFAB Laws of the Game"],
  ["Which ocean is the largest and deepest on Earth?", ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], "Pacific Ocean", "Geography", "easy", "NOAA"],
  ["Which river flows through Cairo, Egypt?", ["Nile", "Tigris", "Euphrates", "Danube"], "Nile", "Geography", "easy", "Encyclopedia Britannica"],
  ["Which is the tallest mountain above sea level on Earth?", ["Mount Everest", "K2", "Kangchenjunga", "Kilimanjaro"], "Mount Everest", "Geography", "easy", "National Geographic"],
];

function seededPick(rng, arr, exclude, count) {
  const pool = arr.filter((x) => !exclude.has(x));
  const picked = [];
  while (picked.length < count && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

function shuffleWithRng(rng, arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeQuestion(rng, { question, answer, distractors, category, difficulty, source }) {
  const uniqueOpts = [answer, ...distractors.filter((d) => d !== answer)].slice(0, 4);
  const options = shuffleWithRng(rng, uniqueOpts);
  return {
    question,
    options,
    answer,
    correctIndex: options.indexOf(answer),
    category,
    type: "multiple",
    difficulty,
    source,
  };
}

function toRoman(num) {
  const map = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let n = num;
  let out = "";
  for (const [val, sym] of map) {
    while (n >= val) {
      out += sym;
      n -= val;
    }
  }
  return out;
}

export function buildTriviaPool(rng) {
  const questions = [];
  const seenQuestions = new Set();

  const pushUnique = (q) => {
    if (!seenQuestions.has(q.question) && new Set(q.options).size === q.options.length && q.correctIndex >= 0) {
      seenQuestions.add(q.question);
      questions.push(q);
    }
  };

  // 1. Curated General Facts
  for (const [qText, opts, ans, cat, diff, src] of CURATED_GENERAL_FACTS) {
    const distractors = opts.filter((o) => o !== ans);
    pushUnique(makeQuestion(rng, { question: qText, answer: ans, distractors, category: cat, difficulty: diff, source: src }));
  }

  // 2. World Capitals & Continents (~280 questions)
  const allCapitals = WORLD_COUNTRIES.map((c) => c[1]);
  const continents = ["Africa", "Asia", "Europe", "North America", "South America", "Oceania"];
  for (const [country, capital, continent] of WORLD_COUNTRIES) {
    pushUnique(makeQuestion(rng, {
      question: `What is the capital city of ${country}?`,
      answer: capital,
      distractors: seededPick(rng, allCapitals, new Set([capital]), 3),
      category: "Geography",
      difficulty: "medium",
      source: "UN Member States / CIA World Factbook",
    }));
    pushUnique(makeQuestion(rng, {
      question: `In which continent is ${country} primarily located?`,
      answer: continent,
      distractors: seededPick(rng, continents, new Set([continent]), 3),
      category: "Geography",
      difficulty: "easy",
      source: "UN Geoscheme",
    }));
  }

  // 3. US States (~100 questions)
  const allStateCapitals = US_STATES.map((s) => s[1]);
  const allStateCodes = US_STATES.map((s) => s[2]);
  for (const [state, capital, code] of US_STATES) {
    pushUnique(makeQuestion(rng, {
      question: `What is the state capital of ${state}?`,
      answer: capital,
      distractors: seededPick(rng, allStateCapitals, new Set([capital]), 3),
      category: "Geography",
      difficulty: "medium",
      source: "US Census Bureau",
    }));
    pushUnique(makeQuestion(rng, {
      question: `What is the two-letter US postal abbreviation for ${state}?`,
      answer: code,
      distractors: seededPick(rng, allStateCodes, new Set([code]), 3),
      category: "Geography",
      difficulty: "medium",
      source: "USPS State Abbreviations",
    }));
  }

  // 4. Chemical Elements (~354 questions)
  const allSymbols = ELEMENTS.map((e) => e[1]);
  const allNames = ELEMENTS.map((e) => e[2]);
  for (const [num, sym, name] of ELEMENTS) {
    pushUnique(makeQuestion(rng, {
      question: `What is the chemical symbol for ${name}?`,
      answer: sym,
      distractors: seededPick(rng, allSymbols, new Set([sym]), 3),
      category: "Science",
      difficulty: num <= 36 ? "easy" : "medium",
      source: "IUPAC Periodic Table",
    }));
    pushUnique(makeQuestion(rng, {
      question: `Which chemical element has the symbol "${sym}"?`,
      answer: name,
      distractors: seededPick(rng, allNames, new Set([name]), 3),
      category: "Science",
      difficulty: num <= 36 ? "easy" : "medium",
      source: "IUPAC Periodic Table",
    }));
    pushUnique(makeQuestion(rng, {
      question: `What is the atomic number of ${name}?`,
      answer: String(num),
      distractors: [String(num + 1), String(num > 1 ? num - 1 : num + 2), String(num + 3)],
      category: "Science",
      difficulty: num <= 20 ? "medium" : "hard",
      source: "IUPAC Periodic Table",
    }));
  }

  // 5. Mathematics: Squares (11..80 -> 70), Cubes (3..22 -> 20), Powers of 2 (4..20 -> 17)
  for (let n = 11; n <= 80; n++) {
    const ans = n * n;
    pushUnique(makeQuestion(rng, {
      question: `What is ${n} squared (${n}²)?`,
      answer: String(ans),
      distractors: [String(ans + 10), String(ans - 10), String(ans + 2 * n)],
      category: "Math & Logic",
      difficulty: n <= 25 ? "easy" : "medium",
      source: "Arithmetic",
    }));
  }
  for (let n = 3; n <= 22; n++) {
    const ans = n * n * n;
    pushUnique(makeQuestion(rng, {
      question: `What is ${n} cubed (${n}³)?`,
      answer: String(ans),
      distractors: [String(ans + n), String(ans - n), String(n * n * (n + 1))],
      category: "Math & Logic",
      difficulty: n <= 10 ? "medium" : "hard",
      source: "Arithmetic",
    }));
  }
  for (let p = 4; p <= 20; p++) {
    const ans = 2 ** p;
    pushUnique(makeQuestion(rng, {
      question: `What is 2 to the power of ${p} (2^${p})?`,
      answer: String(ans),
      distractors: [String(ans / 2), String(ans * 2), String(ans + 64)],
      category: "Computing",
      difficulty: p <= 10 ? "easy" : "medium",
      source: "Binary Arithmetic",
    }));
  }

  // 6. Roman Numerals (500+ distinct values between 14 and 999)
  for (let n = 14; n <= 650; n += 1) {
    if (questions.length > 4200) break;
    const rom = toRoman(n);
    pushUnique(makeQuestion(rng, {
      question: `What decimal number does the Roman numeral "${rom}" represent?`,
      answer: String(n),
      distractors: [String(n + 5), String(n - 4), String(n + 10)],
      category: "Math & Logic",
      difficulty: n < 100 ? "easy" : "medium",
      source: "Roman Numeral System",
    }));
  }

  // 7. Binary to Decimal (250 distinct values)
  for (let n = 10; n <= 255; n++) {
    const bin = n.toString(2);
    pushUnique(makeQuestion(rng, {
      question: `What is the decimal value of the binary number ${bin}?`,
      answer: String(n),
      distractors: [String(n + 2), String(n - 1), String(n + 4)],
      category: "Computing",
      difficulty: n < 64 ? "easy" : "medium",
      source: "IEEE Binary Representation",
    }));
  }

  // 8. Hexadecimal to Decimal (240 distinct values)
  for (let n = 16; n <= 255; n++) {
    const hex = n.toString(16).toUpperCase();
    pushUnique(makeQuestion(rng, {
      question: `What is the decimal value of the hexadecimal number 0x${hex}?`,
      answer: String(n),
      distractors: [String(n + 16), String(n - 6), String(n + 10)],
      category: "Computing",
      difficulty: "medium",
      source: "Hexadecimal Representation",
    }));
  }

  // 9. Unit Conversions & Percentages & Multiples (1,800+ distinct questions)
  for (let km = 2; km <= 250; km++) {
    pushUnique(makeQuestion(rng, {
      question: `How many meters are in ${km} kilometers?`,
      answer: String(km * 1000),
      distractors: [String(km * 100), String(km * 10000), String(km * 500)],
      category: "Science",
      difficulty: "easy",
      source: "BIPM SI Metric System",
    }));
  }
  for (let hr = 2; hr <= 120; hr++) {
    pushUnique(makeQuestion(rng, {
      question: `How many minutes are in ${hr} hours?`,
      answer: String(hr * 60),
      distractors: [String(hr * 100), String(hr * 30), String(hr * 60 + 60)],
      category: "Math & Logic",
      difficulty: "easy",
      source: "Standard Timekeeping",
    }));
  }
  for (let deg = 10; deg <= 200; deg += 2) {
    const f = (deg * 9) / 5 + 32;
    if (Number.isInteger(f)) {
      pushUnique(makeQuestion(rng, {
        question: `What is ${deg}°C in degrees Fahrenheit?`,
        answer: `${f}°F`,
        distractors: [`${f + 10}°F`, `${f - 10}°F`, `${f + 18}°F`],
        category: "Science",
        difficulty: "medium",
        source: "Thermometric Scale Definition",
      }));
    }
  }
  for (let sides = 3; sides <= 20; sides++) {
    const sum = (sides - 2) * 180;
    pushUnique(makeQuestion(rng, {
      question: `What is the sum of the interior angles of a ${sides}-sided polygon (in degrees)?`,
      answer: `${sum}°`,
      distractors: [`${sum + 180}°`, `${sum - 180}°`, `${sides * 180}°`],
      category: "Math & Logic",
      difficulty: "medium",
      source: "Euclidean Geometry",
    }));
  }

  // 10. Additional Multiplication facts to guarantee >= 3,800 unique questions
  for (let a = 12; a <= 60; a++) {
    for (let b = 11; b <= 45; b++) {
      if (questions.length >= 4000) break;
      const prod = a * b;
      pushUnique(makeQuestion(rng, {
        question: `What is ${a} × ${b}?`,
        answer: String(prod),
        distractors: [String(prod + a), String(prod - b), String(prod + 10)],
        category: "Math & Logic",
        difficulty: a < 20 && b < 20 ? "easy" : "medium",
        source: "Arithmetic",
      }));
    }
    if (questions.length >= 4000) break;
  }

  return questions;
}

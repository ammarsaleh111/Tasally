/**
 * Generate valid 5×5 mini crossword puzzles for month-02 (February 2026).
 * 
 * Grid layout (matches months 03-06):
 *   Row 0: A1 (across word, 5 letters)
 *   Row 1: isolated cells at cols 0,2,4 — blocks at cols 1,3
 *   Row 2: A4 (across word, 5 letters)
 *   Row 3: isolated cells at cols 0,2,4 — blocks at cols 1,3
 *   Row 4: A5 (across word, 5 letters)
 * 
 * Down words: D1 (col 0), D2 (col 2), D3 (col 4) — each 5 letters.
 */
const fs = require('fs');
const dictionary = require('../src/data/dictionary/common-english-words.json');

const allWords = dictionary
  .filter(w => w.length === 5 && /^[a-z]+$/.test(w))
  .map(w => w.toUpperCase());

// ------- Curated clue bank (only words with clues can be used) -------
const clueBank = {
  ABOUT:'Concerning', ABOVE:'Higher than', ABUSE:'Mistreat', ACTOR:'Movie performer',
  ACUTE:'Sharp or severe', ADMIT:'Let in', ADOPT:'Take as one\'s own', ADULT:'Grown-up',
  AFTER:'Following', AGAIN:'Once more', AGENT:'Representative', AGREE:'See eye to eye',
  AHEAD:'In front', ALARM:'Warning signal', ALBUM:'Music collection', ALERT:'Watchful',
  ALIEN:'From outer space', ALIGN:'Line up', ALIKE:'Similar', ALIVE:'Not dead',
  ALLEY:'Narrow lane', ALLOW:'Permit', ALONE:'By oneself', ALONG:'Beside',
  ALTER:'Change', AMAZE:'Astonish', AMBER:'Golden color', AMPLE:'Plenty',
  ANGEL:'Heavenly being', ANGER:'Fury', ANGLE:'Corner measure', ANGRY:'Furious',
  ANKLE:'Foot joint', APART:'Separated', APPLE:'Common fruit', APPLY:'Put to use',
  ARENA:'Stadium', ARGUE:'Debate', ARISE:'Get up', ARMOR:'Protective gear',
  ARROW:'Pointed projectile', ASIDE:'To the side', ASPEN:'Quaking tree', AWFUL:'Terrible',
  BADGE:'ID pin', BASIC:'Fundamental', BASIN:'Bowl-shaped area', BASIS:'Foundation',
  BEACH:'Sandy shore', BEGIN:'Start', BEING:'Existence', BELOW:'Under',
  BENCH:'Park seat', BERRY:'Small fruit', BIRCH:'White-barked tree', BIRTH:'Coming into life',
  BLACK:'Darkest color', BLADE:'Knife edge', BLAME:'Hold responsible', BLAND:'Lacking flavor',
  BLANK:'Empty', BLAST:'Explosion', BLAZE:'Bright fire', BLEED:'Lose blood',
  BLEND:'Mix together', BLESS:'Give a benediction', BLIND:'Cannot see', BLISS:'Pure joy',
  BLOCK:'Solid piece', BLOOD:'Red fluid', BLOOM:'Flower opens', BLOWN:'Carried by wind',
  BOARD:'Flat piece of wood', BOOST:'Increase', BOUND:'Limit', BRACE:'Support',
  BRAIN:'Thinking organ', BRAND:'Product name', BRAVE:'Courageous', BREAD:'Baked loaf',
  BREAK:'Snap apart', BREED:'Type of animal', BRICK:'Building block', BRIDE:'Wedding woman',
  BRIEF:'Short', BRING:'Carry to', BRISK:'Quick and energetic', BROAD:'Wide',
  BROKE:'Without money', BROOK:'Small stream', BROTH:'Soup base', BROWN:'Earth color',
  BRUSH:'Painting tool', BRUTE:'Savage creature', BUILD:'Construct', BUNCH:'Group',
  BURST:'Explode', BUYER:'Purchaser', CABIN:'Small shelter', CAMEL:'Desert animal',
  CANOE:'Small boat', CARGO:'Shipped goods', CARRY:'Transport', CATCH:'Seize',
  CAUSE:'Reason', CEDAR:'Fragrant wood', CHAIN:'Linked metal', CHAIR:'Seat with back',
  CHALK:'Writing stick', CHARM:'Delight', CHART:'Graph', CHASE:'Run after',
  CHEAP:'Low cost', CHECK:'Verify', CHEEK:'Part of face', CHEER:'Shout with joy',
  CHESS:'Board game', CHEST:'Rib cage area', CHIEF:'Leader', CHILD:'Young person',
  CHILL:'Cool down', CHINA:'Far East nation', CHOIR:'Singing group', CHUNK:'Thick piece',
  CIDER:'Apple drink', CIVIC:'City-related', CIVIL:'Polite', CLAIM:'Assert',
  CLASH:'Conflict', CLASS:'School lesson', CLASP:'Fastener', CLEAN:'Spotless',
  CLEAR:'Transparent', CLERK:'Office worker', CLICK:'Mouse sound', CLIFF:'Steep rock face',
  CLIMB:'Go up', CLING:'Hold tightly', CLOAK:'Long cape', CLOCK:'Time device',
  CLONE:'Exact copy', CLOSE:'Shut', CLOTH:'Fabric', CLOUD:'Sky formation',
  CLOUT:'Influence', COACH:'Trainer', COAST:'Shoreline', COLOR:'Hue',
  COMET:'Space traveler', CORAL:'Reef builder', COULD:'Was able to', COUNT:'Add up',
  COURT:'Legal arena', COVER:'Conceal', CRACK:'Split', CRAFT:'Skill or trade',
  CRANE:'Lifting machine', CRASH:'Collision', CRAZY:'Insane', CREAM:'Dairy topping',
  CREEK:'Small stream', CREST:'Top point', CRIME:'Illegal act', CRISP:'Crunchy',
  CROSS:'Go over', CROWD:'Large group', CROWN:'King headwear', CRUEL:'Heartless',
  CRUMB:'Tiny bread piece', CRUSH:'Squeeze hard', CURVE:'Bend', CYCLE:'Repeating pattern',
  DAILY:'Every day', DANCE:'Move to music', DEBUT:'First appearance', DECOR:'Room decoration',
  DELAY:'Postpone', DELTA:'River mouth', DEMON:'Evil spirit', DENSE:'Thick',
  DEPTH:'Deepness', DERBY:'Horse race', DEVIL:'Evil one', DIARY:'Personal journal',
  DINER:'Casual restaurant', DIRTY:'Not clean', DIVER:'One who dives', DIZZY:'Lightheaded',
  DONOR:'Gift giver', DOUBT:'Uncertainty', DOUGH:'Bread mixture', DRAFT:'Rough copy',
  DRAIN:'Empty out', DRAMA:'Theater art', DRANK:'Past of drink', DRAWN:'Sketched',
  DREAM:'Night vision', DRESS:'Woman garment', DRIED:'Without moisture', DRIFT:'Float slowly',
  DRILL:'Boring tool', DRINK:'Beverage', DRIVE:'Operate a car', DRONE:'Flying device',
  DROVE:'Past of drive', DWARF:'Small person', DYING:'Near death', EAGER:'Keen',
  EAGLE:'Large bird', EARLY:'Before time', EARTH:'Our planet', EASEL:'Painter stand',
  EIGHT:'Number after seven', ELECT:'Vote for', ELITE:'Top class', EMBER:'Dying coal',
  EMPTY:'Nothing inside', ENEMY:'Foe', ENJOY:'Take pleasure in', ENTER:'Go in',
  ENTRY:'Way in', EQUAL:'Same as', ERROR:'Mistake', EVENT:'Happening',
  EVERY:'Each one', EVOKE:'Call forth', EXACT:'Precise', EXIST:'Be real',
  EXTRA:'Additional', FAINT:'Pass out', FAIRY:'Magical being', FAITH:'Belief',
  FALSE:'Untrue', FAULT:'Blame', FEAST:'Big meal', FELON:'Criminal',
  FENCE:'Yard boundary', FERRY:'Water transport', FIBER:'Thread material', FIELD:'Open land',
  FIFTH:'After fourth', FIFTY:'Half a hundred', FIGHT:'Battle', FINAL:'Last',
  FINER:'More refined', FIRST:'Number one', FIXED:'Repaired', FLAME:'Fire tongue',
  FLASH:'Brief light', FLASK:'Small bottle', FLESH:'Skin and muscle', FLEET:'Group of ships',
  FLIES:'Buzzing insects', FLINT:'Spark stone', FLOAT:'Rest on water', FLOOD:'Water overflow',
  FLOOR:'Room bottom', FLORA:'Plant life', FLOUR:'Baking powder', FLUID:'Liquid',
  FLUSH:'Even surface', FLUTE:'Wind instrument', FOCUS:'Concentrate', FOGGY:'Misty weather',
  FORCE:'Power', FORGE:'Metalwork shop', FORTY:'Four tens', FORUM:'Discussion place',
  FOUND:'Discovered', FRAME:'Border structure', FRANK:'Honest', FRAUD:'Deception',
  FRESH:'Newly made', FRONT:'Facing side', FROST:'Frozen dew', FROZE:'Became ice',
  FRUIT:'Seed bearer', FULLY:'Completely', GHOST:'Spooky spirit', GIANT:'Huge being',
  GIVEN:'Presented', GLARE:'Harsh light', GLASS:'Clear material', GLAZE:'Shiny coating',
  GLEAM:'Faint light', GLIDE:'Smooth movement', GLOBE:'World sphere', GLOOM:'Darkness',
  GLORY:'Great fame', GLOSS:'Shiny surface', GLOVE:'Hand cover', GRACE:'Elegance',
  GRADE:'Score level', GRAIN:'Cereal crop', GRAND:'Magnificent', GRANT:'Award',
  GRAPH:'Data chart', GRAPE:'Wine fruit', GRASP:'Hold firmly', GRASS:'Lawn plant',
  GRAVE:'Burial site', GRAZE:'Feed on grass', GREAT:'Excellent', GREEN:'Grass color',
  GREET:'Say hello', GRIEF:'Deep sorrow', GRILL:'Cook outside', GRIND:'Crush to powder',
  GROAN:'Sound of pain', GROOM:'Wedding man', GROSS:'Disgusting', GROUP:'Collection',
  GROVE:'Small forest', GROWL:'Dog sound', GROWN:'Fully developed', GUARD:'Protector',
  GUESS:'Estimate', GUEST:'Visitor', GUIDE:'Show the way', GUILD:'Trade group',
  GUILT:'Blame feeling', HABIT:'Regular practice', HAPPY:'Joyful', HARSH:'Rough',
  HASTE:'Hurry', HASTY:'Too quick', HAVEN:'Safe place', HAZEL:'Light brown',
  HEART:'Love organ', HEAVY:'Weighs a lot', HEDGE:'Garden border', HENCE:'Therefore',
  HIKER:'Trail walker', HOBBY:'Free-time activity', HONEY:'Bee product', HONOR:'Show respect',
  HORSE:'Riding animal', HOTEL:'Guest lodging', HOUSE:'Home', HUMAN:'Person',
  HUMOR:'Comedy', HURRY:'Rush', IDEAL:'Perfect', IMAGE:'Picture',
  IMPLY:'Suggest', INDEX:'List of items', INNER:'Inside part', INPUT:'Data entered',
  IRONY:'Opposite meaning', IVORY:'Creamy white', JEWEL:'Precious stone', JOINT:'Connection point',
  JUDGE:'Court official', JUICE:'Fruit liquid', KNACK:'Natural skill', KNEEL:'Bend the knee',
  KNOCK:'Door rap', KNOWN:'Familiar', LABEL:'Name tag', LADLE:'Soup spoon',
  LARGE:'Big', LASER:'Light beam', LATCH:'Door fastener', LATER:'After a while',
  LAUGH:'Show amusement', LAYER:'One thickness', LEARN:'Gain knowledge', LEASE:'Rental agreement',
  LEAST:'Smallest', LEAVE:'Go away', LEDGE:'Narrow shelf', LEGAL:'Lawful',
  LEMON:'Sour fruit', LEVEL:'Flat surface', LEVER:'Lifting bar', LIGHT:'Illumination',
  LIMIT:'Boundary', LINEN:'Fabric type', LINER:'Ship or lining', LIVER:'Body organ',
  LOCAL:'Nearby', LOFTY:'Very tall', LOGIC:'Sound reasoning', LOOSE:'Not tight',
  LOVER:'Romantic partner', LOWER:'Reduce', LOYAL:'Faithful', LUCKY:'Fortunate',
  LUNCH:'Midday meal', LYRIC:'Song words', MAGIC:'Sorcery', MAJOR:'Important',
  MAKER:'Creator', MAPLE:'Syrup tree', MARCH:'Walk in step', MARSH:'Wetland',
  MASON:'Stone worker', MATCH:'Go together', MAYOR:'City leader', MEDAL:'Award disk',
  MEDIA:'News outlets', MELON:'Large fruit', MERGE:'Combine', MERCY:'Forgiveness',
  MERIT:'Deserving', METAL:'Iron or steel', METER:'Measuring unit', MIDST:'Middle of',
  MIGHT:'Power', MINER:'Underground worker', MINOR:'Not major', MINUS:'Subtract',
  MISER:'Greedy person', MIXED:'Blended', MODEL:'Example', MONEY:'Currency',
  MONTH:'Calendar period', MOOSE:'Large deer', MORAL:'Ethical', MOTOR:'Engine',
  MOUNT:'Climb up', MOUSE:'Small rodent', MOUTH:'Face opening', MOVIE:'Film',
  MURAL:'Wall painting', MUSIC:'Melodic art', NAIVE:'Innocent', NERVE:'Body fiber',
  NEVER:'Not ever', NIGHT:'Dark hours', NOBLE:'High status', NOISE:'Loud sound',
  NORTH:'Compass direction', NOTED:'Famous', NOVEL:'Fictional book', NURSE:'Medical helper',
  OASIS:'Desert spring', OCCUR:'Happen', OCEAN:'Vast water body', OFFER:'Present',
  OFTEN:'Frequently', OLIVE:'Green fruit', ONSET:'Beginning', OPERA:'Musical drama',
  ORBIT:'Space path', ORDER:'Arrangement', OTHER:'Different', OUGHT:'Should',
  OUTER:'External', OTTER:'Water mammal', OWNER:'Possessor', OZONE:'Atmosphere layer',
  PAINT:'Color coating', PANEL:'Flat section', PANIC:'Sudden fear', PAPER:'Writing sheet',
  PARTY:'Celebration', PASTA:'Italian food', PASTE:'Sticky mixture', PATCH:'Repair piece',
  PAUSE:'Brief stop', PEACE:'No conflict', PEARL:'Oyster gem', PENAL:'About punishment',
  PENNY:'One cent', PETAL:'Flower piece', PHASE:'Stage', PHONE:'Calling device',
  PHOTO:'Picture', PIANO:'Musical keyboard', PIECE:'Part', PILOT:'Plane driver',
  PINCH:'Squeeze', PITCH:'Throw', PIXEL:'Screen dot', PIZZA:'Italian pie',
  PLACE:'Location', PLAID:'Checkered pattern', PLAIN:'Simple', PLANE:'Aircraft',
  PLANK:'Wooden board', PLANT:'Living greenery', PLATE:'Dinner dish', PLAZA:'Open square',
  PLEAD:'Beg', PLUMB:'Exactly vertical', PLUME:'Fancy feather', POINT:'Sharp tip',
  POKER:'Card game', POLAR:'At the poles', PORCH:'Front entrance', POUND:'Weight unit',
  POWER:'Strength', PRESS:'Push down', PRICE:'Cost', PRIDE:'Self-respect',
  PRIME:'First quality', PRINT:'Put on paper', PRIOR:'Before', PRISM:'Light splitter',
  PRIZE:'Award', PROBE:'Investigate', PROOF:'Evidence', PROUD:'Self-satisfied',
  PROVE:'Show to be true', PRUNE:'Dried plum', PUNCH:'Hit with fist', PUPIL:'Student',
  PUPPY:'Young dog', QUEEN:'Female ruler', QUEST:'Search', QUICK:'Fast',
  QUIET:'Silent', QUILT:'Warm blanket', QUOTE:'Repeat words', RADAR:'Detection system',
  RADIO:'Wireless broadcast', RAISE:'Lift up', RALLY:'Come together', RANCH:'Cattle farm',
  RANGE:'Stretch', RAPID:'Very fast', RATIO:'Proportion', RAVEN:'Black bird',
  REACH:'Extend to', REACT:'Respond', READY:'Prepared', REALM:'Kingdom',
  REBEL:'Resist authority', REFER:'Direct to', REIGN:'Rule', RELAX:'Rest',
  RELAY:'Pass along', REPLY:'Answer back', RIDER:'One who rides', RIDGE:'Mountain top',
  RIFLE:'Long gun', RIGHT:'Correct', RIGID:'Stiff', RINSE:'Wash lightly',
  RIPEN:'Become mature', RIVAL:'Competitor', RIVER:'Water flow', ROBIN:'Red-breasted bird',
  ROBOT:'Mechanical worker', ROCKY:'Full of stones', ROUGH:'Not smooth', ROUND:'Circular',
  ROUTE:'Path to travel', ROVER:'Wanderer', ROYAL:'Kingly', RUGBY:'Ball sport',
  RUINS:'Old remains', RULER:'Measuring stick', RURAL:'Countryside', SAINT:'Holy person',
  SALAD:'Green dish', SALSA:'Spicy sauce', SATIN:'Smooth fabric', SAUCE:'Liquid topping',
  SAUNA:'Steam room', SAVOR:'Enjoy slowly', SCALE:'Size measure', SCARE:'Frighten',
  SCARF:'Neck wrap', SCENE:'View', SCENT:'Pleasant smell', SCONE:'Breakfast bread',
  SCOPE:'Range', SCORE:'Points earned', SCOUT:'Explorer', SCREW:'Metal fastener',
  SENSE:'Feeling', SERVE:'Help', SEVEN:'After six', SHADE:'Partial darkness',
  SHALL:'Will do', SHAME:'Disgrace', SHAPE:'Form', SHARE:'Give part',
  SHARK:'Ocean predator', SHARP:'Keen edge', SHAWL:'Shoulder wrap', SHEEP:'Woolly animal',
  SHEER:'Very steep', SHEET:'Bed covering', SHELF:'Storage ledge', SHELL:'Hard outer layer',
  SHIFT:'Move position', SHINE:'Give light', SHIRT:'Upper garment', SHOCK:'Sudden surprise',
  SHOOT:'Fire a gun', SHORT:'Not long', SHOUT:'Yell', SIGHT:'Vision',
  SILLY:'Foolish', SINCE:'From then on', SIREN:'Warning sound', SIXTH:'After fifth',
  SIXTY:'Six tens', SKILL:'Learned ability', SKULL:'Head bone', SLASH:'Cut sharply',
  SLAVE:'Forced worker', SLEEK:'Smooth and glossy', SLEEP:'Rest at night', SLICE:'Cut piece',
  SLIDE:'Slip down', SLOPE:'Hillside', SMART:'Clever', SMELL:'Detect odor',
  SMILE:'Happy expression', SMOKE:'Fire cloud', SNACK:'Light bite', SNAKE:'Slithering reptile',
  SNARE:'Trap', SNORE:'Sleep sound', SNOUT:'Animal nose', SOLAR:'Sun-powered',
  SOLID:'Firm', SOLVE:'Find answer', SORRY:'Feeling regret', SOUND:'Noise',
  SOUTH:'Compass direction', SPACE:'Outer void', SPARE:'Extra', SPEAK:'Talk',
  SPEAR:'Pointed weapon', SPEED:'Velocity', SPELL:'Write out', SPEND:'Use money',
  SPENT:'Used up', SPICE:'Food flavoring', SPIKE:'Sharp point', SPINE:'Backbone',
  SPOKE:'Said', SPORE:'Plant seed', SPORT:'Athletic game', SPRAY:'Fine mist',
  SQUAD:'Small team', STACK:'Pile up', STAFF:'Workers group', STAGE:'Performance area',
  STAIN:'Discoloration', STAIR:'Step', STAKE:'Pointed post', STALE:'No longer fresh',
  STALL:'Delay', STAMP:'Mail marking', STAND:'Be upright', STARE:'Look fixedly',
  START:'Begin', STATE:'Condition', STEAK:'Beef cut', STEAL:'Take wrongly',
  STEAM:'Water vapor', STEEL:'Strong metal', STEEP:'Very inclined', STEER:'Direct course',
  STICK:'Thin branch', STIFF:'Not flexible', STILL:'Not moving', STOCK:'Supply',
  STOMP:'Stamp feet', STONE:'Rock', STOOD:'Past of stand', STOOL:'Backless seat',
  STORE:'Shop', STORK:'Tall bird', STORM:'Bad weather', STORY:'Narrative',
  STOUT:'Thick and strong', STOVE:'Cooking device', STRIP:'Narrow piece', STUCK:'Unable to move',
  STUDY:'Examine', STUFF:'Things', STYLE:'Fashion', STUMP:'Tree base',
  SUGAR:'Sweet crystals', SUITE:'Room set', SUNNY:'Bright day', SUPER:'Excellent',
  SURGE:'Sudden increase', SWAMP:'Wet area', SWEAR:'Promise', SWEAT:'Body moisture',
  SWEET:'Sugary taste', SWEPT:'Cleaned floor', SWIFT:'Very fast', SWING:'Move back and forth',
  SWIRL:'Spin around', SWORD:'Fighting blade', SWORE:'Past of swear', SWUNG:'Past of swing',
  TABLE:'Dining surface', TANGO:'Argentine dance', TASTE:'Flavor sense', TEACH:'Instruct',
  TEASE:'Make fun of', TEETH:'Mouth bones', TEMPO:'Music speed', THANK:'Express gratitude',
  THEFT:'Stealing', THEIR:'Belonging to them', THEME:'Main topic', THERE:'That place',
  THICK:'Not thin', THIEF:'Robber', THING:'Object', THINK:'Use the mind',
  THIRD:'After second', THORN:'Rose prickle', THOSE:'Plural of that', THREE:'After two',
  THREW:'Past of throw', THROW:'Toss', THUMB:'Hand digit', THYME:'Cooking herb',
  TIDAL:'Of the tides', TIGER:'Striped big cat', TIGHT:'Closely fitting', TIMER:'Time keeper',
  TIRED:'Needing rest', TITLE:'Name of work', TOAST:'Browned bread', TODAY:'This day',
  TOKEN:'Small symbol', TOPIC:'Subject', TORCH:'Burning light', TOTAL:'Complete sum',
  TOUCH:'Feel with hands', TOUGH:'Strong and hard', TOWER:'Tall structure', TOXIC:'Poisonous',
  TRACE:'Follow a trail', TRACK:'Path', TRADE:'Exchange', TRAIL:'Nature path',
  TRAIN:'Rail vehicle', TRAIT:'Characteristic', TRASH:'Garbage', TREAT:'Special pleasure',
  TREND:'Popular direction', TRIAL:'Court hearing', TRIBE:'People group', TRICK:'Clever act',
  TRIED:'Attempted', TROOP:'Soldier group', TROUT:'Freshwater fish', TRUCE:'Peace agreement',
  TRUCK:'Large vehicle', TRULY:'In truth', TRUNK:'Tree base', TRUST:'Have faith in',
  TRUTH:'What is real', TULIP:'Spring flower', TUTOR:'Private teacher', TWIST:'Turn around',
  ULTRA:'Extreme', UNCLE:'Parent brother', UNDER:'Below', UNION:'Joined group',
  UNITE:'Join together', UNITY:'Togetherness', UNTIL:'Up to', UPPER:'Higher part',
  UPSET:'Disturbed', URBAN:'City-related', USAGE:'How something is used', USUAL:'Normal',
  UTTER:'Complete', VALID:'Correct', VALUE:'Worth', VALOR:'Bravery',
  VAPOR:'Gas form', VAULT:'Safe room', VENUE:'Event place', VERSE:'Poetry line',
  VIDEO:'Moving pictures', VIGOR:'Energy', VINYL:'Record material', VIPER:'Poisonous snake',
  VIRAL:'Spreading fast', VIRUS:'Disease agent', VISIT:'Go to see', VITAL:'Essential',
  VIVID:'Bright colors', VOCAL:'About voice', VOICE:'Speaking sound', VOTER:'One who votes',
  WAGER:'Place a bet', WAIST:'Body middle', WALTZ:'Ballroom dance', WASTE:'Throw away',
  WATCH:'Look at', WATER:'H2O', WEAVE:'Make fabric', WEDGE:'Tapered piece',
  WEIGH:'Measure mass', WEIRD:'Strange', WHEAT:'Grain crop', WHEEL:'Round turner',
  WHERE:'What place', WHICH:'What one', WHILE:'During', WHIRL:'Spin fast',
  WHITE:'Lightest color', WHOLE:'Complete', WHOSE:'Belonging to whom', WIDER:'More broad',
  WITCH:'Magic woman', WOMAN:'Adult female', WORLD:'The earth', WORRY:'Feel anxious',
  WORSE:'Less good', WORST:'Least good', WORTH:'Value', WOULD:'Past of will',
  WOUND:'Injury', WRECK:'Destroyed vehicle', WRIST:'Hand joint', WRITE:'Put words down',
  WRONG:'Not right', WROTE:'Past of write', WRATH:'Intense anger', YACHT:'Luxury boat',
  YIELD:'Give way', YOUNG:'Not old', YOUTH:'Young age',
};

// Only use words that have clues
const goodWords = allWords.filter(w => clueBank[w]);
console.log(`${goodWords.length} usable words with clues`);

// ------- Index by letter at position -------
const byLetterAt = {};
for (const w of goodWords) {
  for (let i = 0; i < 5; i++) {
    const key = `${i}:${w[i]}`;
    if (!byLetterAt[key]) byLetterAt[key] = [];
    byLetterAt[key].push(w);
  }
}

function wordsAt(pos, letter) {
  return byLetterAt[`${pos}:${letter}`] || [];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePuzzle(usedWords) {
  const pool = shuffle(goodWords.filter(w => !usedWords.has(w)));
  
  for (const d1 of pool) {
    for (const d2 of pool) {
      if (d2 === d1) continue;
      
      // Quick check: can any across words exist with D1+D2 intersections?
      const a1p = wordsAt(0, d1[0]).filter(w => w[2] === d2[0]);
      if (!a1p.length) continue;
      const a4p = wordsAt(0, d1[2]).filter(w => w[2] === d2[2]);
      if (!a4p.length) continue;
      const a5p = wordsAt(0, d1[4]).filter(w => w[2] === d2[4]);
      if (!a5p.length) continue;
      
      for (const d3 of pool) {
        if (d3 === d1 || d3 === d2) continue;
        
        const used = new Set([...usedWords, d1, d2, d3]);
        
        const a1opts = a1p.filter(w => w[4] === d3[0] && !used.has(w));
        if (!a1opts.length) continue;
        
        const a4opts = a4p.filter(w => w[4] === d3[2] && !used.has(w));
        if (!a4opts.length) continue;
        
        const a5opts = a5p.filter(w => w[4] === d3[4] && !used.has(w));
        if (!a5opts.length) continue;
        
        const a1 = a1opts[Math.floor(Math.random() * a1opts.length)];
        const a4 = a4opts.filter(w => w !== a1)[0];
        if (!a4) continue;
        const a5 = a5opts.filter(w => w !== a1 && w !== a4)[0];
        if (!a5) continue;
        
        return {
          grid: [
            [a1[0], a1[1], a1[2], a1[3], a1[4]],
            [d1[1], '',    d2[1], '',    d3[1]],
            [a4[0], a4[1], a4[2], a4[3], a4[4]],
            [d1[3], '',    d2[3], '',    d3[3]],
            [a5[0], a5[1], a5[2], a5[3], a5[4]],
          ],
          across: { '1': a1, '4': a4, '5': a5 },
          down:   { '1': d1, '2': d2, '3': d3 },
          words: [a1, a4, a5, d1, d2, d3],
        };
      }
    }
  }
  return null;
}

// ------- Generate all 28 puzzles -------
const puzzles = {};
const used = new Set();
let ok = 0;

for (let day = 1; day <= 28; day++) {
  const date = `2026-02-${String(day).padStart(2, '0')}`;
  const result = generatePuzzle(used);
  
  if (!result) {
    console.error(`FAIL ${date}`);
    continue;
  }
  
  result.words.forEach(w => used.add(w));
  
  puzzles[date] = {
    grid: result.grid,
    across: {
      '1': clueBank[result.across['1']],
      '4': clueBank[result.across['4']],
      '5': clueBank[result.across['5']],
    },
    down: {
      '1': clueBank[result.down['1']],
      '2': clueBank[result.down['2']],
      '3': clueBank[result.down['3']],
    },
    solution: {
      across: result.across,
      down: result.down,
    },
  };
  
  ok++;
  console.log(`✓ ${date}  A=[${result.across['1']}, ${result.across['4']}, ${result.across['5']}]  D=[${result.down['1']}, ${result.down['2']}, ${result.down['3']}]`);
}

fs.writeFileSync(
  './src/data/all-data/month-02/crossword.json',
  JSON.stringify(puzzles, null, 2) + '\n'
);
console.log(`\nDone: ${ok}/28 puzzles written.`);

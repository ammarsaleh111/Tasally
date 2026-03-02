#!/usr/bin/env node
/**
 * Generate valid Waffle puzzles for February 2026 (28 days).
 * 
 * A valid waffle puzzle needs:
 * - 6 five-letter words (3 rows + 3 columns) 
 * - Words must share letters at intersection points:
 *   Row0[0]=Col0[0], Row0[2]=Col2[0], Row0[4]=Col4[0]
 *   Row2[0]=Col0[2], Row2[2]=Col2[2], Row2[4]=Col4[2]
 *   Row4[0]=Col0[4], Row4[2]=Col2[4], Row4[4]=Col4[4]
 * - A scrambled grid that can be solved via letter swaps
 */

const fs = require('fs');

// Common 5-letter words (curated for quality puzzles)
const COMMON_WORDS = [
  'about','above','abuse','actor','acute','admit','adopt','adult','after','again',
  'agent','agree','ahead','alarm','album','alien','align','alive','allow','alone',
  'along','alter','among','angel','anger','angle','angry','anime','apart','apple',
  'apply','arena','argue','arise','armor','arose','array','aside','asset','atlas',
  'audio','audit','avoid','awake','award','aware','badly','baker','based','basic',
  'batch','beach','beard','beast','begun','being','below','bench','berry','birth',
  'black','blade','blame','bland','blank','blast','blaze','bleed','blend','bless',
  'blind','block','blood','bloom','blown','board','bonus','boost','booth','bound',
  'brain','brand','brave','bread','break','breed','brick','bride','brief','bring',
  'broad','broke','brown','brush','buddy','build','bunch','burst','buyer','cabin',
  'cable','candy','cargo','carry','catch','cause','cease','chain','chair','charm',
  'chase','cheap','check','cheek','cheer','chess','chest','chief','child','china',
  'chunk','civic','civil','claim','clash','class','clean','clear','clerk','click',
  'cliff','climb','cling','clock','clone','close','cloth','cloud','coach','coast',
  'color','comet','comic','coral','could','count','court','cover','crack','craft',
  'crane','crash','crazy','cream','crime','crisp','cross','crowd','cruel','crush',
  'curve','cycle','daily','dance','debug','delay','dense','depot','depth','derby',
  'devil','diary','dirty','donor','doubt','dough','draft','drain','drake','drama',
  'drank','drawn','dream','dress','dried','drift','drill','drink','drive','drone',
  'drove','drums','drunk','dryer','dusty','dwell','dying','eager','eagle','early',
  'earth','eight','elder','elect','elite','email','empty','enemy','enjoy','enter',
  'entry','equal','error','essay','event','every','exact','exams','exile','exist',
  'extra','fable','faced','faith','false','fancy','fatal','fault','feast','fence',
  'fewer','fiber','field','fight','filed','final','first','fixed','flame','flash',
  'flesh','fleet','flies','float','flood','floor','flour','fluid','flush','flute',
  'focal','force','forge','forth','forum','found','frame','frank','fraud','fresh',
  'front','froze','fruit','fully','funds','funny','ghost','giant','given','given',
  'glare','glass','gleam','globe','gloom','glory','gloss','glyph','going','grace',
  'grade','grain','grand','grant','graph','grasp','grass','grave','great','green',
  'greet','grief','grill','grind','grimy','groan','gross','group','grove','grown',
  'guard','guest','guide','guild','guilt','torch','habit','happy','harsh','hasn',
  'haven','heart','hedge','hence','hobby','honey','honor','horse','hotel','hours',
  'house','human','humor','hurry','ideal','image','imply','inbox','index','indie',
  'inner','input','issue','ivory','jewel','joint','judge','juice','knock','known',
  'label','large','laser','later','laugh','layer','learn','lease','legal','lemon',
  'level','light','limit','linen','liver','local','logic','login','loose','lover',
  'lower','lucky','lunch','lyric','magic','major','maker','manor','maple','march',
  'match','mayor','media','mercy','merge','merit','metal','meter','midst','might',
  'minor','minus','mixer','model','money','month','moral','mount','mouse','mouth',
  'movie','music','naive','nerve','never','night','noble','noise','north','noted',
  'novel','nurse','occur','ocean','offer','often','olive','onset','opera','orbit',
  'order','organ','other','outer','owner','oxide','paint','panel','panic','party',
  'paste','patch','pause','peace','peach','pearl','penny','phase','phone','photo',
  'piano','piece','pilot','pinch','pitch','pixel','pizza','place','plain','plane',
  'plant','plate','plaza','plead','plumb','plume','plump','plunge','poach','point',
  'polar','pound','power','press','price','pride','prime','print','prior','prize',
  'prone','proof','proud','prove','psalm','pulse','punch','pupil','purse','queen',
  'quest','queue','quick','quiet','quite','quota','quote','radar','radio','raise',
  'rally','ranch','range','rapid','rated','ratio','reach','react','ready','realm',
  'rebel','refer','reign','relax','reply','rifle','rigid','risky','rival','river',
  'robin','robot','rocky','rough','round','route','royal','rugby','ruler','rural',
  'saint','salad','sauce','scale','scare','scene','scent','scope','score','scout',
  'screw','seize','sense','serve','setup','seven','shade','shake','shame','shape',
  'share','shark','sharp','shelf','shell','shift','shine','shirt','shock','shoot',
  'shore','short','shout','sight','sigma','since','sixty','skill','skull','slate',
  'slave','sleep','slice','slide','slope','small','smart','smell','smile','smoke',
  'snake','solar','solid','solve','sorry','sound','south','space','spare','speak',
  'speed','spend','spent','spice','spine','spite','split','spoke','spray','squad',
  'stack','staff','stage','stake','stale','stall','stamp','stand','stare','start',
  'state','stark','steal','steam','steel','steep','steer','stern','stick','stiff',
  'still','stock','stone','stool','store','storm','story','stove','straw','strip',
  'stuck','study','stuff','style','sugar','suite','sunny','super','surge','swamp',
  'swear','sweat','sweep','sweet','swept','swift','swing','sword','sworn','syrup',
  'table','teeth','tempo','tense','theme','there','thick','thing','think','third',
  'those','three','threw','throw','thumb','tiger','tight','timer','title','toast',
  'token','topic','total','touch','tough','tower','toxic','trace','track','trade',
  'trail','train','trait','trash','treat','trend','trial','tribe','trick','tried',
  'troop','truck','truly','trump','trunk','trust','truth','tumor','tuner','twice',
  'twist','ultra','uncle','under','union','unite','unity','until','upper','upset',
  'urban','usage','usual','utter','valid','value','vault','venue','verse','video',
  'vigor','viral','virus','vital','vivid','vocal','voice','voter','wagon','waste',
  'watch','water','weave','whale','wheat','wheel','where','which','while','white',
  'whole','whose','widow','width','witch','woman','world','worry','worse','worst',
  'worth','would','wound','wrath','write','wrong','wrote','yield','young','yours',
  'youth',
];

// Deduplicate
const WORDS = [...new Set(COMMON_WORDS)].filter(w => w.length === 5);

// Index words by letter at each position
const byPos = Array.from({ length: 5 }, () => ({}));
WORDS.forEach(w => {
  for (let i = 0; i < 5; i++) {
    const ch = w[i];
    if (!byPos[i][ch]) byPos[i][ch] = [];
    byPos[i][ch].push(w);
  }
});

/**
 * Find 6 words that form a valid waffle solution grid.
 * rows = [word0, word1, word2] for rows 0, 2, 4
 * cols = [word0, word1, word2] for cols 0, 2, 4
 * 
 * Intersections:
 * row0[0]=col0[0], row0[2]=col2[0], row0[4]=col4[0]
 * row2[0]=col0[2], row2[2]=col2[2], row2[4]=col4[2]  
 * row4[0]=col0[4], row4[2]=col2[4], row4[4]=col4[4]
 */
function findPuzzle(usedSets = new Set(), maxAttempts = 5000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Pick row0
    const row0 = WORDS[Math.floor(Math.random() * WORDS.length)];
    if (usedSets.has(row0)) continue;

    // col0 must start with row0[0]
    const col0Candidates = (byPos[0][row0[0]] || []).filter(w => w !== row0 && !usedSets.has(w));
    if (!col0Candidates.length) continue;
    const col0 = col0Candidates[Math.floor(Math.random() * col0Candidates.length)];

    // col2 must start with row0[2]
    const col2Candidates = (byPos[0][row0[2]] || []).filter(w => w !== row0 && w !== col0 && !usedSets.has(w));
    if (!col2Candidates.length) continue;
    const col2 = col2Candidates[Math.floor(Math.random() * col2Candidates.length)];

    // col4 must start with row0[4]
    const col4Candidates = (byPos[0][row0[4]] || []).filter(w => w !== row0 && w !== col0 && w !== col2 && !usedSets.has(w));
    if (!col4Candidates.length) continue;
    const col4 = col4Candidates[Math.floor(Math.random() * col4Candidates.length)];

    // row2 must have: row2[0]=col0[2], row2[2]=col2[2], row2[4]=col4[2]
    const r2_0 = col0[2], r2_2 = col2[2], r2_4 = col4[2];
    const row2Candidates = WORDS.filter(w =>
      w[0] === r2_0 && w[2] === r2_2 && w[4] === r2_4 &&
      w !== row0 && w !== col0 && w !== col2 && w !== col4 && !usedSets.has(w)
    );
    if (!row2Candidates.length) continue;
    const row2 = row2Candidates[Math.floor(Math.random() * row2Candidates.length)];

    // row4 must have: row4[0]=col0[4], row4[2]=col2[4], row4[4]=col4[4]
    const r4_0 = col0[4], r4_2 = col2[4], r4_4 = col4[4];
    const row4Candidates = WORDS.filter(w =>
      w[0] === r4_0 && w[2] === r4_2 && w[4] === r4_4 &&
      w !== row0 && w !== col0 && w !== col2 && w !== col4 && w !== row2 && !usedSets.has(w)
    );
    if (!row4Candidates.length) continue;
    const row4 = row4Candidates[Math.floor(Math.random() * row4Candidates.length)];

    return { row0, row2, row4, col0, col2, col4 };
  }
  return null;
}

/**
 * Build solution grid from 6 words 
 */
function buildSolution(words) {
  const { row0, row2, row4, col0, col2, col4 } = words;
  return [
    [...row0],
    [col0[1], '', col2[1], '', col4[1]],
    [...row2],
    [col0[3], '', col2[3], '', col4[3]],
    [...row4],
  ];
}

/**
 * Scramble the solution grid to create a starting grid.
 * Keeps some letters correct, swaps others.
 * Returns { grid, misplacedCount }
 */
function scrambleGrid(solution) {
  const pattern = [
    [true, true, true, true, true],
    [true, false, true, false, true],
    [true, true, true, true, true],
    [true, false, true, false, true],
    [true, true, true, true, true],
  ];

  // Collect all letter cells
  const cells = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (pattern[r][c]) {
        cells.push({ r, c, letter: solution[r][c] });
      }
    }
  }

  // We want to misplace about 8-12 letters (4-6 swaps needed)
  const targetMisplaced = 6 + Math.floor(Math.random() * 5); // 6-10
  
  const grid = solution.map(row => [...row]);
  const attempts = targetMisplaced * 3;
  let swapsDone = 0;

  for (let i = 0; i < attempts && swapsDone < Math.ceil(targetMisplaced / 2); i++) {
    // Pick two random letter cells that have different letters
    const a = cells[Math.floor(Math.random() * cells.length)];
    const b = cells[Math.floor(Math.random() * cells.length)];
    if (a.r === b.r && a.c === b.c) continue;
    
    const letterA = grid[a.r][a.c];
    const letterB = grid[b.r][b.c];
    if (letterA === letterB) continue;
    
    // Don't swap if both are already correct (would make two wrong from two right)
    // Only swap if at least one is already in its correct position
    const aCorrect = grid[a.r][a.c] === solution[a.r][a.c];
    const bCorrect = grid[b.r][b.c] === solution[b.r][b.c];
    if (!aCorrect && !bCorrect) continue; // Both already wrong, skip
    
    grid[a.r][a.c] = letterB;
    grid[b.r][b.c] = letterA;
    swapsDone++;
  }

  // Count actual misplaced
  let misplacedCount = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (pattern[r][c] && grid[r][c] !== solution[r][c]) {
        misplacedCount++;
      }
    }
  }

  return { grid, misplacedCount };
}

// Generate 28 puzzles for February 2026
function generateFebruary() {
  const result = {};
  const usedWords = new Set();

  for (let day = 1; day <= 28; day++) {
    const dateStr = `2026-02-${String(day).padStart(2, '0')}`;
    let puzzle = null;

    for (let retry = 0; retry < 50; retry++) {
      const words = findPuzzle(usedWords);
      if (!words) continue;

      const solution = buildSolution(words);
      const { grid, misplacedCount } = scrambleGrid(solution);

      if (misplacedCount < 4) continue; // Too easy, try again

      const minSwaps = Math.ceil(misplacedCount / 2);
      // Give player ~1.5-2x the minimum moves
      const maxMoves = Math.max(minSwaps + 2, Math.ceil(minSwaps * 1.7));

      puzzle = { grid, solution, maxMoves };

      // Track used words to avoid repetition
      [words.row0, words.row2, words.row4, words.col0, words.col2, words.col4].forEach(w => usedWords.add(w));
      break;
    }

    if (!puzzle) {
      console.error(`Failed to generate puzzle for ${dateStr}`);
      process.exit(1);
    }

    result[dateStr] = puzzle;
    
    // Verify
    const sol = puzzle.solution;
    const r0 = sol[0].join(''), r2 = sol[2].join(''), r4 = sol[4].join('');
    const c0 = [sol[0][0],sol[1][0],sol[2][0],sol[3][0],sol[4][0]].join('');
    const c2 = [sol[0][2],sol[1][2],sol[2][2],sol[3][2],sol[4][2]].join('');
    const c4 = [sol[0][4],sol[1][4],sol[2][4],sol[3][4],sol[4][4]].join('');
    
    const mispl = (() => {
      let count = 0;
      const pattern = [[1,1,1,1,1],[1,0,1,0,1],[1,1,1,1,1],[1,0,1,0,1],[1,1,1,1,1]];
      for(let r=0;r<5;r++) for(let c=0;c<5;c++) if(pattern[r][c] && puzzle.grid[r][c] !== sol[r][c]) count++;
      return count;
    })();
    const minS = Math.ceil(mispl / 2);
    
    console.log(`${dateStr} | ${r0} ${r2} ${r4} | ${c0} ${c2} ${c4} | max:${puzzle.maxMoves} mispl:${mispl} min:${minS}`);
  }

  return result;
}

const data = generateFebruary();
const outPath = './src/data/all-data/month-02/waffle.json';
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
console.log(`\nWrote ${Object.keys(data).length} puzzles to ${outPath}`);

export type FaqItem = {
  question: string;
  answer: string;
};

export type GameFaqKey =
  | "wordle"
  | "connections"
  | "crossword"
  | "numbers"
  | "trivia"
  | "strands"
  | "spelling"
  | "waffle"
  | "combinations";

export type FaqSection = {
  id: string;
  title: string;
  lang: "en" | "ar";
  description?: string;
  items: FaqItem[];
};

export const homeFaqs: FaqItem[] = [
  {
    question: "What is Tasally (تسالي)?",
    answer:
      "Tasally is a premium daily puzzle platform with nine games across word, logic, numbers, and trivia.",
  },
  {
    question: "Which daily games can I play on Tasally?",
    answer:
      "You can play Wordle-style, Connections-style, Mini Crossword, Numbers, Trivia, Strands, Spelling Bee, Waffle, and Combinations.",
  },
  {
    question: "Is Tasally free to play?",
    answer:
      "Yes. Core gameplay is free in your browser, with no app download required.",
  },
  {
    question: "Does Tasally support Arabic and English players?",
    answer:
      "Yes. Tasally supports bilingual discovery and content for both English and Arabic audiences.",
  },
];

export const gameFaqs: Record<GameFaqKey, FaqItem[]> = {
  wordle: [
    {
      question: "How many guesses do I get in Wordle on Tasally?",
      answer: "You get six guesses, with color feedback after every attempt.",
    },
    {
      question: "Can I practice after the daily Wordle?",
      answer: "Yes. Tasally Wordle supports practice mode in addition to the daily puzzle.",
    },
    {
      question: "What is a strong Wordle strategy?",
      answer:
        "Start with balanced letters, lock confirmed positions early, and avoid repeating eliminated letters.",
    },
    {
      question: "Does Wordle progress affect my profile stats?",
      answer: "Yes. Daily results contribute to your long-term stats and streak tracking.",
    },
  ],
  connections: [
    {
      question: "What is the goal in Connections?",
      answer: "Group 16 words into 4 correct categories before running out of mistakes.",
    },
    {
      question: "How do I avoid early mistakes?",
      answer:
        "Scan all words first, test theme overlaps mentally, then submit only when your set is consistent.",
    },
    {
      question: "Is Connections a daily challenge?",
      answer: "Yes. The main mode is a fresh daily puzzle loop.",
    },
    {
      question: "Can I track Connections performance over time?",
      answer: "Yes. Tasally stores your outcomes, streaks, and progress trends.",
    },
  ],
  crossword: [
    {
      question: "What crossword format does Tasally use?",
      answer: "Tasally uses a compact mini crossword format designed for quick daily sessions.",
    },
    {
      question: "How should I start a Mini Crossword?",
      answer:
        "Begin with easier short clues, then use crossing letters to unlock harder entries.",
    },
    {
      question: "Is there a new mini crossword every day?",
      answer: "Yes. A new puzzle is available daily.",
    },
    {
      question: "Can beginners play Mini Crossword comfortably?",
      answer: "Yes. The format is built to stay approachable while still challenging regular solvers.",
    },
  ],
  numbers: [
    {
      question: "What is the Numbers objective?",
      answer: "Use six numbers and operators to reach the exact target value.",
    },
    {
      question: "Does Numbers include practice mode?",
      answer: "Yes. You can play daily mode or practice rounds.",
    },
    {
      question: "Which operations are available?",
      answer: "You can use addition, subtraction, multiplication, and division.",
    },
    {
      question: "How do I improve at Numbers?",
      answer:
        "Plan two steps ahead and favor operations that preserve flexibility for later moves.",
    },
  ],
  trivia: [
    {
      question: "How many questions are in daily Trivia?",
      answer: "Each daily set includes 10 questions across mixed topics.",
    },
    {
      question: "Can I replay Trivia after the daily set?",
      answer: "Yes. Practice rounds are available to keep improving.",
    },
    {
      question: "What matters most in Trivia scoring?",
      answer: "Accuracy first, then speed and consistency over time.",
    },
    {
      question: "Does Trivia affect profile progression?",
      answer: "Yes. Daily outcomes are reflected in your stats and streak data.",
    },
  ],
  strands: [
    {
      question: "What is Strands on Tasally?",
      answer: "A themed word-search style puzzle where you discover hidden words and a spangram.",
    },
    {
      question: "How do I solve Strands faster?",
      answer: "Use the theme hint first, find short anchors, then connect longer words.",
    },
    {
      question: "Is there a daily Strands puzzle?",
      answer: "Yes. Strands updates every day.",
    },
    {
      question: "Is Strands beginner-friendly?",
      answer: "Yes. It starts accessible and rewards pattern recognition over time.",
    },
  ],
  spelling: [
    {
      question: "How does Spelling Bee work?",
      answer: "Create valid words from the honeycomb letters while always using the center letter.",
    },
    {
      question: "Does Spelling Bee refresh daily?",
      answer: "Yes. A new letter set is published daily.",
    },
    {
      question: "How do I score higher quickly?",
      answer: "Build around roots and extend with common prefixes and suffixes.",
    },
    {
      question: "What is a key Spelling Bee habit?",
      answer: "Start with short words for momentum, then hunt longer high-value entries.",
    },
  ],
  waffle: [
    {
      question: "What is Waffle’s goal?",
      answer: "Swap letters to complete all intersecting words within limited moves.",
    },
    {
      question: "What is the best Waffle strategy?",
      answer: "Prioritize swaps that improve both a row and a column at the same time.",
    },
    {
      question: "Does Waffle have daily puzzles?",
      answer: "Yes. Waffle refreshes with a daily challenge.",
    },
    {
      question: "Can I improve move efficiency?",
      answer: "Yes. Track fixed letters first and avoid one-off swaps that break other lines.",
    },
  ],
  combinations: [
    {
      question: "What do I do in Combinations?",
      answer: "Merge fragments into valid words and maximize your score.",
    },
    {
      question: "Is Combinations daily?",
      answer: "Yes. The core mode is a fresh daily puzzle.",
    },
    {
      question: "How can I score better in Combinations?",
      answer: "Target longer words first and reuse discovered roots to unlock more answers.",
    },
    {
      question: "Who is Combinations best for?",
      answer: "Players who enjoy vocabulary construction and pattern-matching challenges.",
    },
  ],
};

export const fullFaqSections: FaqSection[] = [
  {
    id: "tasally-brand",
    title: "Tasally / تسالي — Brand FAQ",
    lang: "en",
    description: "Core platform, account, language, and progression questions.",
    items: [
      ...homeFaqs,
      {
        question: "Do I need an account to start playing?",
        answer: "No. You can start quickly as a guest, then sign in later to sync progress.",
      },
      {
        question: "How does Tasally keep daily play engaging?",
        answer:
          "Each game has a fresh daily loop, plus practice and progression systems like streaks and achievements.",
      },
    ],
  },
  {
    id: "wordle",
    title: "Wordle-like FAQ",
    lang: "en",
    description: "Daily word guessing, strategy, and progression guidance.",
    items: gameFaqs.wordle,
  },
  {
    id: "connections",
    title: "Connections FAQ",
    lang: "en",
    description: "Category grouping strategy and common mistakes.",
    items: gameFaqs.connections,
  },
  {
    id: "crossword",
    title: "Mini Crossword FAQ",
    lang: "en",
    description: "Clue-solving flow and daily crossword habits.",
    items: gameFaqs.crossword,
  },
  {
    id: "numbers",
    title: "Numbers FAQ",
    lang: "en",
    description: "Target-solving tactics and arithmetic puzzle flow.",
    items: gameFaqs.numbers,
  },
  {
    id: "trivia",
    title: "Trivia FAQ",
    lang: "en",
    description: "Daily quiz rules, scoring, and improvement tips.",
    items: gameFaqs.trivia,
  },
  {
    id: "tasally-ar",
    title: "الأسئلة الشائعة عن تسالي",
    lang: "ar",
    description: "قسم عربي مختصر عن المنصة وطريقة اللعب اليومية.",
    items: [
      {
        question: "ما هي منصة تسالي؟",
        answer: "تسالي منصة ألعاب وألغاز يومية تضم ألعاب كلمات ومنطق وأرقام وتحديات معلومات.",
      },
      {
        question: "هل يمكن اللعب مجانًا؟",
        answer: "نعم، اللعب الأساسي مجاني بالكامل عبر المتصفح.",
      },
      {
        question: "هل تدعم تسالي اللغة العربية؟",
        answer: "نعم، يوجد محتوى وصفحات مناسبة للمستخدم العربي والإنجليزي.",
      },
      {
        question: "كيف أحافظ على عادة اللعب اليومية؟",
        answer: "ابدأ بلعبة سريعة يوميًا ثم نوّع بين الكلمات والمنطق والأرقام لتحسين مستمر.",
      },
    ],
  },
  {
    id: "games-ar",
    title: "أسئلة الألعاب الأساسية",
    lang: "ar",
    description: "ملخص عربي سريع لألعاب Wordle وConnections وMini Crossword وNumbers وTrivia.",
    items: [
      {
        question: "Wordle: كم محاولة متاحة؟",
        answer: "ست محاولات مع ألوان توضّح الحروف الصحيحة ومواقعها.",
      },
      {
        question: "Connections: ما الهدف؟",
        answer: "تجميع 16 كلمة في 4 مجموعات صحيحة قبل نفاد الأخطاء.",
      },
      {
        question: "Mini Crossword: هل يتجدد يوميًا؟",
        answer: "نعم، هناك لغز جديد كل يوم.",
      },
      {
        question: "Numbers: ما المطلوب؟",
        answer: "استخدام الأرقام والعمليات للوصول إلى الرقم الهدف.",
      },
      {
        question: "Trivia: كم عدد الأسئلة اليومية؟",
        answer: "10 أسئلة يومية في موضوعات متنوعة.",
      },
    ],
  },
];

export const fullFaqItems: FaqItem[] = fullFaqSections.flatMap((section) => section.items);

export function resolveGameFaqKey(title?: string): GameFaqKey | null {
  if (!title) return null;
  const value = title.toLowerCase();
  if (value.includes("wordle")) return "wordle";
  if (value.includes("connections")) return "connections";
  if (value.includes("crossword")) return "crossword";
  if (value.includes("numbers")) return "numbers";
  if (value.includes("trivia")) return "trivia";
  if (value.includes("strands")) return "strands";
  if (value.includes("spelling")) return "spelling";
  if (value.includes("waffle")) return "waffle";
  if (value.includes("combinations")) return "combinations";
  return null;
}

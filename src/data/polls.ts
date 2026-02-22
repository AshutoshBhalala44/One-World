export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface CountryBreakdown {
  country: string;
  flag: string;
  results: Record<string, number>; // optionId -> percentage
}

export interface Poll {
  id: string;
  question: string;
  category: string;
  totalVotes: number;
  options: PollOption[];
  countryBreakdowns: CountryBreakdown[];
  createdAt: string;
  trending: boolean;
}

export const categories = [
  { id: "all", label: "All Topics", icon: "🌍" },
  { id: "politics", label: "Politics", icon: "🏛️" },
  { id: "economy", label: "Economy", icon: "📊" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "technology", label: "Technology", icon: "💻" },
  { id: "environment", label: "Environment", icon: "🌱" },
  { id: "culture", label: "Culture", icon: "🎭" },
];

export const polls: Poll[] = [
  {
    id: "1",
    question: "Should AI development be regulated by an international governing body?",
    category: "technology",
    totalVotes: 284731,
    trending: true,
    options: [
      { id: "1a", label: "Yes, strict regulation is needed", votes: 119587 },
      { id: "1b", label: "Yes, but with light oversight", votes: 79724 },
      { id: "1c", label: "No, the market should self-regulate", votes: 56946 },
      { id: "1d", label: "Unsure / Need more information", votes: 28474 },
    ],
    countryBreakdowns: [
      { country: "United States", flag: "🇺🇸", results: { "1a": 35, "1b": 30, "1c": 25, "1d": 10 } },
      { country: "Germany", flag: "🇩🇪", results: { "1a": 48, "1b": 28, "1c": 14, "1d": 10 } },
      { country: "Japan", flag: "🇯🇵", results: { "1a": 38, "1b": 32, "1c": 18, "1d": 12 } },
      { country: "Brazil", flag: "🇧🇷", results: { "1a": 42, "1b": 26, "1c": 22, "1d": 10 } },
      { country: "India", flag: "🇮🇳", results: { "1a": 44, "1b": 28, "1c": 20, "1d": 8 } },
      { country: "Nigeria", flag: "🇳🇬", results: { "1a": 40, "1b": 30, "1c": 18, "1d": 12 } },
    ],
    createdAt: "2026-02-20",
  },
  {
    id: "2",
    question: "Is the global economy heading toward a recession in 2026?",
    category: "economy",
    totalVotes: 198452,
    trending: true,
    options: [
      { id: "2a", label: "Yes, a major recession", votes: 55567 },
      { id: "2b", label: "Yes, a mild slowdown", votes: 69458 },
      { id: "2c", label: "No, the economy will stabilize", votes: 51597 },
      { id: "2d", label: "No, growth will accelerate", votes: 21830 },
    ],
    countryBreakdowns: [
      { country: "United States", flag: "🇺🇸", results: { "2a": 25, "2b": 38, "2c": 27, "2d": 10 } },
      { country: "United Kingdom", flag: "🇬🇧", results: { "2a": 30, "2b": 35, "2c": 25, "2d": 10 } },
      { country: "China", flag: "🇨🇳", results: { "2a": 20, "2b": 30, "2c": 30, "2d": 20 } },
      { country: "Australia", flag: "🇦🇺", results: { "2a": 28, "2b": 34, "2c": 28, "2d": 10 } },
      { country: "Mexico", flag: "🇲🇽", results: { "2a": 32, "2b": 36, "2c": 22, "2d": 10 } },
    ],
    createdAt: "2026-02-19",
  },
  {
    id: "3",
    question: "Should countries accept more climate refugees?",
    category: "environment",
    totalVotes: 156893,
    trending: false,
    options: [
      { id: "3a", label: "Yes, it's a moral obligation", votes: 56482 },
      { id: "3b", label: "Yes, but with limits", votes: 51774 },
      { id: "3c", label: "No, focus on domestic solutions", votes: 37654 },
      { id: "3d", label: "No opinion", votes: 10983 },
    ],
    countryBreakdowns: [
      { country: "Sweden", flag: "🇸🇪", results: { "3a": 45, "3b": 30, "3c": 18, "3d": 7 } },
      { country: "United States", flag: "🇺🇸", results: { "3a": 28, "3b": 32, "3c": 32, "3d": 8 } },
      { country: "France", flag: "🇫🇷", results: { "3a": 38, "3b": 34, "3c": 22, "3d": 6 } },
      { country: "South Korea", flag: "🇰🇷", results: { "3a": 30, "3b": 35, "3c": 28, "3d": 7 } },
    ],
    createdAt: "2026-02-18",
  },
  {
    id: "4",
    question: "Who will win the 2026 FIFA World Cup?",
    category: "sports",
    totalVotes: 342109,
    trending: true,
    options: [
      { id: "4a", label: "Brazil", votes: 95790 },
      { id: "4b", label: "Argentina", votes: 82106 },
      { id: "4c", label: "France", votes: 68422 },
      { id: "4d", label: "Other", votes: 95791 },
    ],
    countryBreakdowns: [
      { country: "Brazil", flag: "🇧🇷", results: { "4a": 55, "4b": 15, "4c": 10, "4d": 20 } },
      { country: "Argentina", flag: "🇦🇷", results: { "4a": 10, "4b": 60, "4c": 12, "4d": 18 } },
      { country: "France", flag: "🇫🇷", results: { "4a": 15, "4b": 18, "4c": 45, "4d": 22 } },
      { country: "United States", flag: "🇺🇸", results: { "4a": 28, "4b": 24, "4c": 20, "4d": 28 } },
      { country: "Germany", flag: "🇩🇪", results: { "4a": 22, "4b": 20, "4c": 18, "4d": 40 } },
    ],
    createdAt: "2026-02-21",
  },
  {
    id: "5",
    question: "Should social media platforms be held liable for misinformation?",
    category: "politics",
    totalVotes: 221340,
    trending: false,
    options: [
      { id: "5a", label: "Yes, full accountability", votes: 88536 },
      { id: "5b", label: "Partial responsibility with regulation", votes: 75256 },
      { id: "5c", label: "No, free speech must be protected", votes: 46081 },
      { id: "5d", label: "Unsure", votes: 11467 },
    ],
    countryBreakdowns: [
      { country: "United States", flag: "🇺🇸", results: { "5a": 32, "5b": 28, "5c": 30, "5d": 10 } },
      { country: "Germany", flag: "🇩🇪", results: { "5a": 45, "5b": 35, "5c": 14, "5d": 6 } },
      { country: "India", flag: "🇮🇳", results: { "5a": 42, "5b": 32, "5c": 20, "5d": 6 } },
      { country: "Canada", flag: "🇨🇦", results: { "5a": 38, "5b": 36, "5c": 20, "5d": 6 } },
    ],
    createdAt: "2026-02-17",
  },
  {
    id: "6",
    question: "Is remote work better for productivity than in-office work?",
    category: "culture",
    totalVotes: 178562,
    trending: false,
    options: [
      { id: "6a", label: "Yes, significantly better", votes: 60511 },
      { id: "6b", label: "About the same", votes: 44640 },
      { id: "6c", label: "No, in-office is better", votes: 37498 },
      { id: "6d", label: "Hybrid is the best option", votes: 35913 },
    ],
    countryBreakdowns: [
      { country: "United States", flag: "🇺🇸", results: { "6a": 38, "6b": 22, "6c": 18, "6d": 22 } },
      { country: "Japan", flag: "🇯🇵", results: { "6a": 22, "6b": 28, "6c": 30, "6d": 20 } },
      { country: "Netherlands", flag: "🇳🇱", results: { "6a": 42, "6b": 25, "6c": 13, "6d": 20 } },
      { country: "South Korea", flag: "🇰🇷", results: { "6a": 25, "6b": 30, "6c": 25, "6d": 20 } },
    ],
    createdAt: "2026-02-16",
  },
];

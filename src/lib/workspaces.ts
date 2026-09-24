import { BookOpen, Bot, Briefcase, IdCard, MapPin, Network, Radar, Workflow, type LucideIcon } from "lucide-react";
import nyanzviLogo from "@/assets/nyanzvi-logo.png";

export type WorkspaceId = "tutor" | "simulations" | "passport" | "intelligence" | "network" | "opportunities" | "learning" | "hubs";

export type WorkspaceConfig = {
  id: WorkspaceId;
  label: string;
  agent: string;
  tagline: string;
  capabilities: string[];
  logo?: string;
  icon: LucideIcon;
  welcomeTitle: string;
  welcomeBody: string;
  chipQuestion: string;
  chips: string[];
  prompts: string[];
  placeholder: string;
  classic: string;
  classicLabel: string;
  modes: string[];
  cards: CardKind[];
};

export type CardKind = "skills" | "sims" | "trends" | "courses" | "people" | "jobs" | "hubs";
export const CARD_LABELS: Record<CardKind, string> = { skills: "My skills", sims: "Scenario library", trends: "Industry trends", courses: "Learning courses", people: "People to meet", jobs: "Open opportunities", hubs: "Field hubs" };

export const WORKSPACES: Record<WorkspaceId, WorkspaceConfig> = {
  tutor: {
    id: "tutor",
    label: "AI Tutor",
    agent: "Nyanzvi",
    tagline: "Your expert in every shift.",
    capabilities: ["Explains concepts in plain language","Quizzes you and gives instant feedback","Builds study plans around your Skills Passport"],
    logo: nyanzviLogo,
    icon: Bot,
    welcomeTitle: "Your personal hospitality tutor",
    welcomeBody: "Ask anything, practise answers and get feedback shaped around your goal and Skills Passport.",
    chipQuestion: "Which area should we focus on?",
    chips: ["Hotel Operations", "Culinary Arts", "Event Management"],
    prompts: ["Explain a concept simply", "Quiz me with 3 questions", "Coach me for an interview", "Build me a 2-week study plan"],
    placeholder: "Ask your tutor anything…",
    classic: "/app/tutor",
    classicLabel: "Guided tutor",
    modes: ["Explain", "Quiz me", "Interview coach", "Study plan", "Feedback on my answer"],
    cards: ["skills", "courses"],
  },
  simulations: {
    id: "simulations",
    label: "Simulations",
    agent: "Nyanzvi Sim",
    tagline: "Rehearse the moments that matter.",
    capabilities: ["Plays guests, managers and partners in character","Scores every response against service standards","Debriefs what to do differently next time"],
    icon: Workflow,
    welcomeTitle: "Live role-play simulations",
    welcomeBody: "The AI plays guests, managers and partners. Respond as you would on shift and get scored feedback.",
    chipQuestion: "Pick a setting to practise in",
    chips: ["Front Desk", "Safari Lodge", "Restaurant Service"],
    prompts: ["Start a complaint scenario", "Give me an overbooking crisis", "Role-play a VIP arrival", "Score my last response"],
    placeholder: "Respond to the scenario…",
    classic: "/app/simulations",
    classicLabel: "Scenario library",
    modes: ["Role-play", "Score my response", "Debrief"],
    cards: ["sims", "skills"],
  },
  passport: {
    id: "passport",
    label: "Skills Passport",
    agent: "Nyanzvi Passport",
    tagline: "Turn evidence into opportunity.",
    capabilities: ["Reads your verified skills and evidence","Finds the gap that matters most","Writes CV lines employers trust"],
    icon: IdCard,
    welcomeTitle: "Talk through your Skills Passport",
    welcomeBody: "Understand your evidence, spot gaps and turn your verified skills into a strong CV story.",
    chipQuestion: "What do you want from your passport?",
    chips: ["Close skill gaps", "Prepare my CV", "Plan verification"],
    prompts: ["Summarise my strongest skills", "What should I verify next?", "Write a CV profile from my passport", "Which roles fit my skills?"],
    placeholder: "Ask about your skills and evidence…",
    classic: "/app/passport",
    classicLabel: "Passport view",
    modes: ["Gap analysis", "CV writer", "Verification plan"],
    cards: ["skills", "courses"],
  },
  intelligence: {
    id: "intelligence",
    label: "Industry Intelligence",
    agent: "Nyanzvi Insight",
    tagline: "See where tourism is heading.",
    capabilities: ["Briefs you on trends shaping Zimbabwe","Shows which skills are rising","Connects signals to your career"],
    icon: Radar,
    welcomeTitle: "Tourism industry briefings on demand",
    welcomeBody: "Explore trends shaping Zimbabwe's tourism workforce and what they mean for your career.",
    chipQuestion: "Which lens interests you most?",
    chips: ["Sustainable Tourism", "Digital & AI in Hospitality", "Regional Travel Demand"],
    prompts: ["Brief me on this week's trends", "Which skills are rising in demand?", "What's changing at Victoria Falls?", "How will AI change hotel jobs?"],
    placeholder: "Ask about tourism trends…",
    classic: "/app/intelligence",
    classicLabel: "Trend dashboard",
    modes: ["Briefing", "Skills demand", "Career impact"],
    cards: ["trends", "courses"],
  },
  network: {
    id: "network",
    label: "Network",
    agent: "Nyanzvi Connect",
    tagline: "Your professional circle, curated.",
    capabilities: ["Finds mentors and peers who fit your goal", "Drafts warm, professional introductions", "Suggests posts that showcase your progress"],
    icon: Network,
    welcomeTitle: "Grow your tourism network",
    welcomeBody: "Meet mentors, peers and employers, write introductions and share your wins, all through conversation.",
    chipQuestion: "Who do you want to connect with?",
    chips: ["Mentors", "Employers & recruiters", "Peers & classmates"],
    prompts: ["Who should I connect with first?", "Write a connection request", "Draft a post about my progress", "Prepare me for a coffee chat"],
    placeholder: "Ask about people, introductions or posts…",
    classic: "/app/network",
    classicLabel: "Network feed",
    modes: ["Find people", "Write introduction", "Create post"],
    cards: ["people", "skills"],
  },
  opportunities: {
    id: "opportunities",
    label: "Opportunities",
    agent: "Nyanzvi Careers",
    tagline: "The right role, at the right moment.",
    capabilities: ["Matches openings to your verified skills", "Tailors applications and cover letters", "Runs mock interviews for each role"],
    icon: Briefcase,
    welcomeTitle: "Find and win your next opportunity",
    welcomeBody: "Discover internships, placements and jobs, and prepare applications with an AI career partner.",
    chipQuestion: "What are you looking for?",
    chips: ["Internships", "Full-time roles", "Mentorship & events"],
    prompts: ["Which openings fit me best?", "Write my cover letter", "Mock interview for this role", "What's missing from my profile?"],
    placeholder: "Ask about roles and applications…",
    classic: "/app/opportunities",
    classicLabel: "Opportunity board",
    modes: ["Match me", "Application writer", "Mock interview"],
    cards: ["jobs", "skills"],
  },
  learning: {
    id: "learning",
    label: "Learning",
    agent: "Nyanzvi Learn",
    tagline: "Lessons that fit between shifts.",
    capabilities: ["Teaches course lessons conversationally", "Checks understanding with quick questions", "Keeps your learning path on track"],
    icon: BookOpen,
    welcomeTitle: "Learn one lesson at a time",
    welcomeBody: "Work through courses in bite-sized conversations, with questions and examples from real Zimbabwean properties.",
    chipQuestion: "Pick your learning track",
    chips: ["Hospitality Operations", "Digital & AI Skills", "Management"],
    prompts: ["Continue my course", "Teach me today's lesson", "Give me a quick quiz", "Summarise what I've learned"],
    placeholder: "Ask to learn something…",
    classic: "/app/learning",
    classicLabel: "Course catalogue",
    modes: ["Lesson", "Quiz", "Summary"],
    cards: ["courses", "skills"],
  },
  hubs: {
    id: "hubs",
    label: "Field & Innovation Hubs",
    agent: "Nyanzvi Field",
    tagline: "Learning where tourism happens.",
    capabilities: ["Recommends field programmes near you", "Prepares you for community projects", "Helps you reflect on field experience"],
    icon: MapPin,
    welcomeTitle: "Explore field & innovation hubs",
    welcomeBody: "Find hands-on programmes across Zimbabwe's destinations and prepare to make an impact on the ground.",
    chipQuestion: "Where would you like to go?",
    chips: ["Victoria Falls & Hwange", "Kariba & Mutoko", "Eastern Highlands"],
    prompts: ["Which hub suits me?", "Prepare me for a field week", "Ideas for a community project", "Help me write a field reflection"],
    placeholder: "Ask about hubs and field programmes…",
    classic: "/app/hubs",
    classicLabel: "Hub directory",
    modes: ["Explore", "Prepare", "Reflect"],
    cards: ["hubs", "people"],
  },
};

export const isWorkspaceId = (v: string): v is WorkspaceId => v in WORKSPACES;

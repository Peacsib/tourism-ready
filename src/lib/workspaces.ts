import { Bot, IdCard, Radar, Workflow, type LucideIcon } from "lucide-react";

export type WorkspaceId = "tutor" | "simulations" | "passport" | "intelligence";

export type WorkspaceConfig = {
  id: WorkspaceId;
  label: string;
  icon: LucideIcon;
  welcomeTitle: string;
  welcomeBody: string;
  chipQuestion: string;
  chips: string[];
  prompts: string[];
  placeholder: string;
  classic: "/app/tutor" | "/app/simulations" | "/app/passport" | "/app/intelligence";
  classicLabel: string;
  modes: string[];
  cards: CardKind[];
};

export type CardKind = "skills" | "sims" | "trends" | "courses";
export const CARD_LABELS: Record<CardKind, string> = { skills: "My skills", sims: "Scenario library", trends: "Industry trends", courses: "Learning courses" };

export const WORKSPACES: Record<WorkspaceId, WorkspaceConfig> = {
  tutor: {
    id: "tutor",
    label: "AI Tutor",
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
};

export const isWorkspaceId = (v: string): v is WorkspaceId => v in WORKSPACES;

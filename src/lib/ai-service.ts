// AIService — the tutor always answers. When a live AI provider is connected it can be swapped in here;
// the curated demo layer below guarantees a reliable, domain-specific experience with no failure states.

export type TutorMode = "Ask" | "Learn" | "Practise" | "Review" | "Prepare";

export type TutorReply = {
  text: string;
  pathway?: string[];
  action?: { label: string; to: string };
  resources?: string[];
};

type Rule = { match: RegExp; reply: (mode: TutorMode) => TutorReply };

const RULES: Rule[] = [
  {
    match: /front.?office|reception|front desk/i,
    reply: () => ({
      text: "Great goal. Front-office work is where guests form their first and last impression — and it's where employers see the biggest practical gap in graduates. Here's a pathway built around your current Skills Passport:",
      pathway: ["Reservation fundamentals", "Guest communication", "Booking systems", "Handling cancellations", "Service recovery"],
      action: { label: "Begin practical challenge", to: "/app/simulations/reservation-desk" },
      resources: ["Hotel Operations Fundamentals · Module 5", "Reservation Systems in Practice"],
    }),
  },
  {
    match: /overbook/i,
    reply: () => ({
      text: "Overbooking is a revenue decision that becomes a service-recovery moment. The industry standard is to 'walk' the guest: arrange an equal-or-better room at a partner property, cover transport and the first night, and personally follow up. Tone matters more than the offer — acknowledge, apologise, act.",
      pathway: ["Acknowledge without blaming", "Offer the walk package", "Arrange transport", "Log & follow up"],
      action: { label: "Practise an overbooking scenario", to: "/app/simulations/overbooking" },
    }),
  },
  {
    match: /cancel/i,
    reply: () => ({
      text: "Cancellation policies protect revenue while giving guests confidence. Flexible rates usually cost more but allow free cancellation up to a cut-off (often 24–48 hours before arrival). Non-refundable rates are cheaper but lock in payment. Always confirm the policy in writing at booking.",
      action: { label: "Apply this in the Reservation Desk", to: "/app/simulations/reservation-desk" },
    }),
  },
  {
    match: /upsell|premium|upgrade/i,
    reply: () => ({
      text: "Good upselling is guest-centred: link the upgrade to something the guest actually said they value. 'Since you mentioned you need to work, the premium room has a desk and faster Wi-Fi' works far better than simply quoting a higher price. Never pressure — offer, explain, and let them decide.",
      action: { label: "Try it in a simulation", to: "/app/simulations/reservation-desk" },
    }),
  },
  {
    match: /ai|artificial|chatgpt|automation/i,
    reply: () => ({
      text: "AI in 2031 hospitality mostly assists: drafting guest replies, suggesting rates, summarising reviews. The skill employers want is supervision — checking accuracy, adjusting tone, and knowing when a human must take over. Treat AI output as a first draft, never a final answer.",
      resources: ["AI for Hospitality Professionals", "Brief: AI concierge tools in Southern Africa"],
      action: { label: "Explore AI trend signals", to: "/app/intelligence" },
    }),
  },
  {
    match: /ticket|flight|airline|travel agen|itinerar/i,
    reply: () => ({
      text: "Ticket booking combines system accuracy with customer judgement: correct passenger names (as on passport), fare rules, baggage and change conditions. For Zimbabwe routes, check connections through Harare and Victoria Falls carefully and always read back the itinerary to the customer.",
      pathway: ["Fare classes & rules", "Passenger data accuracy", "Changes & refunds", "Itinerary read-back"],
      action: { label: "Open the Ticketing course", to: "/app/learning" },
    }),
  },
  {
    match: /complain|angry|upset|recovery/i,
    reply: () => ({
      text: "Use the LEARN model for service recovery: Listen, Empathise, Apologise, Resolve, Notify. Resolve means a concrete action with a time — 'I'll have maintenance in your room within 15 minutes' — then follow up personally.",
      action: { label: "Practise service recovery", to: "/app/simulations/overbooking" },
    }),
  },
  {
    match: /interview|job|career|prepare|role/i,
    reply: () => ({
      text: "For a front-office or reservations interview, employers in Zimbabwe typically test three things: systems confidence, guest communication, and calm decision-making. Your Skills Passport already shows verified guest communication — adding a demonstrated reservation simulation will strengthen your profile significantly.",
      pathway: ["Complete Reservation Desk simulation", "Add results to Skills Passport", "Review matching opportunities", "Request a mentor session"],
      action: { label: "See matching opportunities", to: "/app/opportunities" },
    }),
  },
  {
    match: /sustain|community|eco|conservation/i,
    reply: () => ({
      text: "Sustainable tourism balances visitor experience with community benefit and conservation. In Zimbabwe, community-based tourism in places like Mutoko and CAMPFIRE-linked wildlife areas shows how local ownership creates longer-lasting value.",
      action: { label: "View Field & Innovation Hubs", to: "/app/hubs" },
    }),
  },
];

const MODE_FALLBACK: Record<TutorMode, TutorReply> = {
  Ask: {
    text: "Here's how I'd think about that in a tourism and hospitality context: start with the guest's need, check the operational constraint (availability, policy, system), then communicate a clear option. If you tell me which department you're thinking about — front office, travel desk, F&B or management — I can be much more specific.",
    resources: ["Hotel Operations Fundamentals"],
  },
  Learn: {
    text: "Let's break it down. Every hospitality operation rests on three layers: the guest experience (what they feel), the process (what staff do), and the system (what gets recorded). Mastering a topic means understanding all three. Which layer would you like to explore first?",
  },
  Practise: {
    text: "Here's a scenario for you: A family of four arrives at 23:00 with a booking made through an online agent, but your system shows only one double room reserved. The night manager is unavailable. What are your first three actions? Reply with your answer and I'll review it — or jump into a full simulation.",
    action: { label: "Open full simulation", to: "/app/simulations/reservation-desk" },
  },
  Review: {
    text: "Reviewing your recent results: your guest communication is consistently strong. The recurring gap is policy explanation — you tend to offer options before confirming the cancellation terms. Next time, confirm the policy first, then present the room options.",
    action: { label: "Retry with this focus", to: "/app/simulations/reservation-desk" },
  },
  Prepare: {
    text: "Tell me the role you're preparing for and I'll build a readiness plan. The most requested roles this season are Reservations Agent, Front Office Associate and Guest Experience Officer.",
    pathway: ["Pick a target role", "Map skills vs. Passport", "Practise gap simulations", "Apply with verified proof"],
  },
};

export const AIService = {
  async respond(message: string, mode: TutorMode): Promise<TutorReply> {
    // Simulated latency so the response feels considered, never blocking.
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));
    const rule = RULES.find((r) => r.match.test(message));
    return rule ? rule.reply(mode) : MODE_FALLBACK[mode];
  },
  suggestions: {
    Ask: ["What is a flexible cancellation policy?", "How do I upsell a room without pressure?"],
    Learn: ["Explain how overbooking works", "Teach me ticket booking basics"],
    Practise: ["Give me a front desk scenario", "Generate a complaint scenario"],
    Review: ["Review my last simulation", "Where do I keep losing points?"],
    Prepare: ["Prepare me for a reservations interview", "What does a front-office role need?"],
  } as Record<TutorMode, string[]>,
};

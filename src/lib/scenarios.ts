// Simulation scenario definitions. Each decision option carries weighted impact on four performance dimensions.

export type Dim = "comm" | "ops" | "decision" | "digital";
export const DIM_LABELS: Record<Dim, string> = {
  comm: "Customer Communication",
  ops: "Operational Accuracy",
  decision: "Decision Making",
  digital: "Digital Competence",
};

export type Option = { id: string; label: string; detail?: string; meta?: string[]; disabled?: boolean; impact: Partial<Record<Dim, number>>; good?: string; bad?: string };
export type Decision = { id: string; title: string; kind: "table" | "choice" | "checks"; columns?: string[]; options: Option[] };

export type Scenario = {
  id: string;
  app: string;
  brief: string;
  guest: { name: string; detail: [string, string][] };
  policies: string[];
  inbound: string;
  decisions: Decision[];
  replies: Option[];
  reasoning: string;
  competencies: string[];
  next: { title: string; id: string };
};

export const SCENARIOS: Record<string, Scenario> = {
  "reservation-desk": {
    id: "reservation-desk",
    app: "Hotel Reservation Desk",
    brief: "A guest needs a room for three nights. Standard rooms are unavailable, but a premium room is available. The guest has requested flexible cancellation.",
    guest: {
      name: "Mrs. Ruvimbo Chikwanha",
      detail: [["Stay", "12 – 15 Oct 2031 · 3 nights"], ["Guests", "1 adult"], ["Channel", "Direct · WhatsApp"], ["Loyalty", "Returning guest (2 stays)"], ["Note", "Travelling for a conference; needs a desk"]],
    },
    policies: [
      "Flexible rate: free cancellation until 48h before arrival.",
      "Non-refundable rate: 15% cheaper, no changes or refunds.",
      "Confirm all rate conditions to the guest in writing.",
      "Returning guests may receive late checkout, subject to availability.",
    ],
    inbound: "Hi, I need a room from the 12th to the 15th for a conference. My plans might change, so I need to be able to cancel. What do you have?",
    decisions: [
      {
        id: "room",
        title: "Room availability",
        kind: "table",
        columns: ["Room type", "Available", "Rate / night"],
        options: [
          { id: "std", label: "Standard Double", meta: ["0", "$120"], disabled: true, impact: {} },
          { id: "twin", label: "Deluxe Twin", meta: ["0", "$140"], disabled: true, impact: {} },
          { id: "prem", label: "Premium King · work desk", meta: ["2", "$185"], impact: { ops: 30, decision: 30, comm: 10 }, good: "You chose the available room that matches the guest's stated need for a desk." },
          { id: "suite", label: "Executive Suite", meta: ["1", "$320"], impact: { ops: 18, decision: 8 }, bad: "The suite is available but nearly double the price with no link to the guest's needs — offer the Premium King first." },
        ],
      },
      {
        id: "rate",
        title: "Rate plan",
        kind: "choice",
        options: [
          { id: "flex", label: "Flexible rate", detail: "Free cancellation until 48h before arrival", impact: { ops: 30, decision: 25, comm: 5 }, good: "You applied the flexible rate the guest explicitly requested." },
          { id: "nonref", label: "Non-refundable rate", detail: "15% cheaper · no changes", impact: { ops: 5, decision: 0 }, bad: "The guest asked for flexible cancellation — a non-refundable rate creates a dispute risk." },
        ],
      },
      {
        id: "checks",
        title: "Booking actions",
        kind: "checks",
        options: [
          { id: "policy", label: "Confirm cancellation policy in writing", impact: { comm: 10, ops: 15 }, good: "You documented the cancellation terms — the industry standard that protects both guest and hotel.", bad: "Cancellation terms were not confirmed in writing." },
          { id: "note", label: "Record 'needs desk · conference' on profile", impact: { ops: 10, digital: 25 }, good: "You captured the guest's preference in the system for the front desk team.", bad: "Guest preferences were not recorded in the property system." },
          { id: "late", label: "Offer late checkout (returning guest)", impact: { comm: 10, decision: 15 }, good: "You recognised a returning guest with a relevant benefit." },
          { id: "confirm", label: "Send booking confirmation", impact: { digital: 30, ops: 10 }, good: "You issued a digital confirmation.", bad: "No confirmation was sent — the guest has no record of the booking." },
          { id: "discount", label: "Apply 20% corporate discount", impact: { ops: -15, decision: -10 }, bad: "A corporate discount was applied without any corporate agreement on file." },
        ],
      },
    ],
    replies: [
      { id: "r1", label: "Explain & recommend", detail: "\"Thank you, Mrs. Chikwanha. Our standard rooms are fully booked for those dates, but I can offer our Premium King at $185 per night on a flexible rate — free cancellation until 48 hours before arrival. It includes a work desk, ideal for your conference. Shall I confirm it for you?\"", impact: { comm: 45, decision: 10, digital: 20 }, good: "Your reply acknowledged availability honestly, connected the upgrade to her needs and stated the policy clearly." },
      { id: "r2", label: "Short answer", detail: "\"Only premium rooms left, $185. Want it?\"", impact: { comm: 12, digital: 10 }, bad: "Your reply was too brief — no policy explanation and no link to the guest's needs." },
      { id: "r3", label: "Upsell hard", detail: "\"Standard is gone. I strongly recommend the Executive Suite at $320 — it's our best room and it may sell out soon.\"", impact: { comm: 5, decision: -5 }, bad: "Pressure-selling a room she didn't need risks trust and the relationship." },
    ],
    reasoning: "In hospitality, a good upsell solves a guest problem rather than increasing a bill. When the requested category is sold out, the professional standard is to offer the nearest suitable alternative, explain why it fits, confirm rate conditions in writing, and record preferences so the next team member can deliver on them.",
    competencies: ["Reservation Management", "Customer Service", "Operational Decision Making", "Digital Systems"],
    next: { title: "Handle an overbooking situation.", id: "overbooking" },
  },
  overbooking: {
    id: "overbooking",
    app: "Front Office · Arrivals",
    brief: "It's 21:40. A guest with a confirmed, prepaid booking arrives, but the hotel is overbooked by one room. No rooms are free tonight.",
    guest: {
      name: "Mr. Themba Ndlovu",
      detail: [["Booking", "Confirmed · prepaid · 2 nights"], ["Arrived", "21:40 after a 6-hour drive"], ["Channel", "Online travel agent"], ["Mood", "Tired, becoming frustrated"], ["Tomorrow", "1 room frees at 11:00"]],
    },
    policies: [
      "Overbooked guests are 'walked' to a partner hotel of equal or higher standard.",
      "Hotel covers first night at partner hotel and transport both ways.",
      "Duty manager must be informed of any walked guest.",
      "Guest returns the next day with a room guaranteed.",
    ],
    inbound: "I booked and paid for this weeks ago. What do you mean there's no room?",
    decisions: [
      {
        id: "plan",
        title: "Recovery plan",
        kind: "choice",
        options: [
          { id: "walk", label: "Walk to partner hotel", detail: "Equal standard · first night & transport covered", impact: { ops: 35, decision: 35 }, good: "You applied the standard 'walk' procedure — the fair, recognised solution." },
          { id: "wait", label: "Ask guest to wait in lobby", detail: "Hope a cancellation comes through", impact: { ops: 0, decision: 0 }, bad: "Asking a tired guest to wait on uncertainty damages trust." },
          { id: "downgrade", label: "Offer staff room", detail: "Unsold staff quarters", impact: { ops: 5, decision: 5 }, bad: "Offering a non-guest room breaches service standards." },
        ],
      },
      {
        id: "checks",
        title: "Operational actions",
        kind: "checks",
        options: [
          { id: "manager", label: "Inform duty manager", impact: { ops: 20, decision: 10 }, good: "You escalated correctly to the duty manager.", bad: "The duty manager was not informed." },
          { id: "transport", label: "Book transport both ways", impact: { ops: 15, comm: 5 }, good: "You arranged transport, removing effort from the guest." },
          { id: "guarantee", label: "Guarantee room tomorrow & log in PMS", impact: { digital: 40, ops: 10 }, good: "You secured and recorded tomorrow's room in the system.", bad: "Tomorrow's room was not secured in the system." },
          { id: "gesture", label: "Add welcome-back amenity", impact: { comm: 15, decision: 10 }, good: "A thoughtful gesture helps recover the relationship." },
        ],
      },
    ],
    replies: [
      { id: "r1", label: "Acknowledge · apologise · act", detail: "\"Mr. Ndlovu, I'm truly sorry — you did everything right and this is our error. I've reserved a room at our partner hotel five minutes away, fully covered tonight, with a car waiting. Your room here is guaranteed from tomorrow at 11:00.\"", impact: { comm: 55, decision: 10, digital: 10 }, good: "You took ownership, apologised sincerely and gave a concrete, time-bound solution." },
      { id: "r2", label: "Policy first", detail: "\"Unfortunately overbooking is standard industry practice. We have a policy for this.\"", impact: { comm: 10 }, bad: "Leading with policy rather than empathy escalates frustration." },
      { id: "r3", label: "Blame the agent", detail: "\"The online agent must have made a mistake — you'll need to take it up with them.\"", impact: { comm: 0, decision: -10 }, bad: "Shifting blame to a partner channel is unprofessional and doesn't solve the problem." },
    ],
    reasoning: "Service recovery research shows guests often become more loyal after a well-handled failure. The winning pattern is ownership, a sincere apology and a concrete solution that removes effort from the guest — backed by accurate system records so the promise is kept.",
    competencies: ["Service Recovery", "Operational Decision Making", "Guest Communication", "Digital Systems"],
    next: { title: "Handle a high-volume hotel reservation scenario.", id: "reservation-desk" },
  },
};

// Seeded demo data for Tourism Workforce 2031.
// Shapes mirror the relational entities in the product spec so a real backend can replace this layer.

export type RoleId = "student" | "professional" | "employer" | "educator" | "entrepreneur";
export type CompetencyState = "Developing" | "Practising" | "Demonstrated" | "Verified";
export type CompetencyCategory =
  | "Operations"
  | "Customer Experience"
  | "Digital Skills"
  | "AI Readiness"
  | "Management"
  | "Tourism Knowledge";

export const ROLES: { id: RoleId; label: string; blurb: string }[] = [
  { id: "student", label: "Student / Learner", blurb: "Build practical capability before you enter the workplace." },
  { id: "professional", label: "Tourism Professional", blurb: "Upskill, stay current and grow your career." },
  { id: "employer", label: "Employer / Manager", blurb: "Discover talent and close workforce skills gaps." },
  { id: "educator", label: "Educator", blurb: "Track learner readiness and align teaching with industry." },
  { id: "entrepreneur", label: "Entrepreneur", blurb: "Grow a digital-first tourism business." },
];

export type Persona = {
  id: string;
  name: string;
  firstName: string;
  role: RoleId;
  title: string;
  organisation: string;
  location: string;
  initials: string;
  statement: string;
  goal: string;
};

export const PERSONAS: Persona[] = [
  {
    id: "alex",
    name: "Alex Moyo",
    firstName: "Alex",
    role: "student",
    title: "Tourism & Hospitality Learner",
    organisation: "Midlands State University",
    location: "Gweru, Zimbabwe",
    initials: "AM",
    statement: "Final-year hospitality student focused on front-office operations and digital guest experience.",
    goal: "Become front-office ready for a Victoria Falls resort placement",
  },
  {
    id: "tariro",
    name: "Tariro Ncube",
    firstName: "Tariro",
    role: "professional",
    title: "Guest Relations Officer",
    organisation: "Rainbow Towers Hotel",
    location: "Harare, Zimbabwe",
    initials: "TN",
    statement: "Five years in guest relations. Currently upskilling in revenue management and AI-assisted service.",
    goal: "Move into a revenue & reservations supervisor role",
  },
  {
    id: "linda",
    name: "Linda Dube",
    firstName: "Linda",
    role: "educator",
    title: "Lecturer, Tourism Management",
    organisation: "Chinhoyi University of Technology",
    location: "Chinhoyi, Zimbabwe",
    initials: "LD",
    statement: "Teaching tourism operations for 12 years. Aligning curriculum with industry technology.",
    goal: "Close the practical systems gap across my second-year cohort",
  },
  {
    id: "tendai",
    name: "Tendai Chirwa",
    firstName: "Tendai",
    role: "employer",
    title: "General Manager",
    organisation: "Kingdom Hotel, Victoria Falls",
    location: "Victoria Falls, Zimbabwe",
    initials: "TC",
    statement: "Leading a 140-person hotel team. Hiring for digital-ready front office and guest experience staff.",
    goal: "Recruit six reservation-ready graduates this season",
  },
  {
    id: "rudo",
    name: "Rudo Mhlanga",
    firstName: "Rudo",
    role: "entrepreneur",
    title: "Founder, Kariba Shoreline Tours",
    organisation: "Kariba Shoreline Tours",
    location: "Kariba, Zimbabwe",
    initials: "RM",
    statement: "Running a small boat-safari business and moving bookings online.",
    goal: "Launch direct online booking and AI-assisted marketing",
  },
];

export type Competency = {
  id: string;
  name: string;
  category: CompetencyCategory;
  level: number; // 0-100
  state: CompetencyState;
  links: string[];
};

export const COMPETENCIES: Competency[] = [
  { id: "res", name: "Reservation Management", category: "Operations", level: 62, state: "Practising", links: ["pms", "comm", "rev"] },
  { id: "fo", name: "Front Office Operations", category: "Operations", level: 70, state: "Demonstrated", links: ["res", "checkin"] },
  { id: "checkin", name: "Guest Check-in", category: "Operations", level: 78, state: "Verified", links: ["fo", "comm"] },
  { id: "comm", name: "Guest Communication", category: "Customer Experience", level: 82, state: "Verified", links: ["recovery", "checkin"] },
  { id: "recovery", name: "Service Recovery", category: "Customer Experience", level: 48, state: "Developing", links: ["comm", "decision"] },
  { id: "pms", name: "Property Management Systems", category: "Digital Skills", level: 55, state: "Practising", links: ["res", "gds"] },
  { id: "gds", name: "Ticket Booking Systems", category: "Digital Skills", level: 38, state: "Developing", links: ["pms", "itin"] },
  { id: "aiprompt", name: "AI-assisted Service", category: "AI Readiness", level: 44, state: "Developing", links: ["pms", "mkt"] },
  { id: "mkt", name: "Digital Tourism Marketing", category: "AI Readiness", level: 35, state: "Developing", links: ["aiprompt"] },
  { id: "decision", name: "Operational Decision Making", category: "Management", level: 52, state: "Practising", links: ["recovery", "rev"] },
  { id: "rev", name: "Revenue Awareness", category: "Management", level: 40, state: "Developing", links: ["res", "decision"] },
  { id: "itin", name: "Itinerary Planning", category: "Tourism Knowledge", level: 58, state: "Practising", links: ["gds", "dest"] },
  { id: "dest", name: "Zimbabwe Destination Knowledge", category: "Tourism Knowledge", level: 74, state: "Demonstrated", links: ["itin"] },
];

export type SimCategory = "Hotel Operations" | "Travel Operations" | "Digital Tourism" | "Management";
export type Simulation = {
  id: string;
  title: string;
  category: SimCategory;
  summary: string;
  duration: string;
  difficulty: "Foundation" | "Intermediate" | "Advanced";
  skills: string[];
  available: boolean;
};

export const SIMULATIONS: Simulation[] = [
  { id: "reservation-desk", title: "Hotel Reservation Desk", category: "Hotel Operations", summary: "Handle a three-night booking when standard rooms are sold out and the guest needs flexible cancellation.", duration: "12 min", difficulty: "Intermediate", skills: ["Reservation Management", "Customer Service", "Digital Systems"], available: true },
  { id: "overbooking", title: "Overbooking Situation", category: "Hotel Operations", summary: "A confirmed guest arrives to a fully booked property. Recover the stay without losing the relationship.", duration: "15 min", difficulty: "Advanced", skills: ["Service Recovery", "Operational Decision Making"], available: true },
  { id: "check-in", title: "Peak-hour Guest Check-in", category: "Hotel Operations", summary: "Process arriving tour-group guests during a Friday evening rush.", duration: "10 min", difficulty: "Foundation", skills: ["Guest Check-in", "Front Office"], available: false },
  { id: "complaint", title: "Guest Complaint Resolution", category: "Hotel Operations", summary: "A guest reports a noisy room and a missed airport transfer.", duration: "10 min", difficulty: "Intermediate", skills: ["Service Recovery", "Guest Communication"], available: false },
  { id: "room-allocation", title: "Room Allocation Board", category: "Hotel Operations", summary: "Allocate rooms for a conference block with mixed requirements.", duration: "14 min", difficulty: "Intermediate", skills: ["Operations", "PMS"], available: false },
  { id: "revenue", title: "Weekend Revenue Scenario", category: "Hotel Operations", summary: "Set rates for a long weekend with a local festival in town.", duration: "18 min", difficulty: "Advanced", skills: ["Revenue Awareness"], available: false },
  { id: "ticket-booking", title: "Air & Rail Ticket Booking", category: "Travel Operations", summary: "Book a Harare–Victoria Falls journey for a family on a fixed budget.", duration: "12 min", difficulty: "Foundation", skills: ["Ticket Booking Systems"], available: false },
  { id: "itinerary", title: "Five-day Itinerary Build", category: "Travel Operations", summary: "Design a Hwange and Victoria Falls itinerary for international visitors.", duration: "20 min", difficulty: "Intermediate", skills: ["Itinerary Planning"], available: false },
  { id: "travel-service", title: "Travel Desk Customer Service", category: "Travel Operations", summary: "Handle a delayed-flight rebooking call.", duration: "10 min", difficulty: "Foundation", skills: ["Guest Communication"], available: false },
  { id: "ai-marketing", title: "AI-assisted Campaign", category: "Digital Tourism", summary: "Use AI to draft a low-season campaign for a lodge in Kariba.", duration: "15 min", difficulty: "Intermediate", skills: ["Digital Tourism Marketing", "AI-assisted Service"], available: false },
  { id: "cx-journey", title: "Digital Guest Journey", category: "Digital Tourism", summary: "Map and improve a guest's pre-arrival digital experience.", duration: "14 min", difficulty: "Intermediate", skills: ["Customer Experience"], available: false },
  { id: "transformation", title: "Digital Transformation Plan", category: "Digital Tourism", summary: "Prioritise technology investments for a mid-size hotel.", duration: "20 min", difficulty: "Advanced", skills: ["Digital Skills", "Management"], available: false },
  { id: "staff", title: "Staff Allocation Shift", category: "Management", summary: "Roster front office and housekeeping for a sudden occupancy spike.", duration: "15 min", difficulty: "Advanced", skills: ["Operational Decision Making"], available: false },
  { id: "ops-decision", title: "Operations Decision Room", category: "Management", summary: "Balance cost, service and staffing after a power outage.", duration: "18 min", difficulty: "Advanced", skills: ["Management"], available: false },
];

export type Article = {
  id: string;
  title: string;
  category: string;
  source: string;
  date: string;
  summary: string;
  why: string;
  kind: "brief" | "research";
  readTime: string;
};

export const TRENDS = [
  { id: "ai", skills: ["aiprompt","comm","pms"], name: "AI in hospitality", momentum: 92, change: "+18%", note: "Chat-based guest service and AI-assisted reservations are becoming standard in regional hotel groups.", impact: "Front-office staff increasingly supervise AI tools rather than replace them." },
  { id: "dcx", skills: ["comm","aiprompt","mkt"], name: "Digital customer experience", momentum: 84, change: "+11%", note: "Mobile check-in, WhatsApp concierge and digital payments now shape first impressions.", impact: "Guest communication skills now extend to digital channels." },
  { id: "auto", skills: ["pms","res"], name: "Automation", momentum: 71, change: "+7%", note: "Channel managers and automated rate updates reduce manual reservation work.", impact: "Accuracy shifts from data entry to system oversight." },
  { id: "sus", skills: ["dest","itin"], name: "Sustainable tourism", momentum: 78, change: "+9%", note: "Visitors and operators prioritise community benefit, conservation and low-impact travel.", impact: "Guides and managers need to communicate sustainability credibly." },
  { id: "emerging", skills: ["mkt","aiprompt"], name: "Emerging tourism tech", momentum: 63, change: "+14%", note: "Virtual previews, smart-room controls and data-driven destination marketing are emerging.", impact: "Early exposure creates a clear competitive advantage for graduates." },
];

export const ARTICLES: Article[] = [
  { id: "a1", title: "How AI concierge tools are reshaping front-office work in Southern Africa", category: "AI in hospitality", source: "TW2031 Intelligence Desk", date: "18 Sep 2031", summary: "Hotels piloting AI concierge tools report faster response times, but staff still resolve the complex requests that matter most to guests.", why: "Front-office roles now require confidence supervising and correcting AI outputs.", kind: "brief", readTime: "4 min" },
  { id: "a2", title: "Victoria Falls occupancy outlook for the peak season", category: "Industry outlook", source: "Tourism Sector Briefing", date: "12 Sep 2031", summary: "Strong regional demand and new flight routes point to a busy season, with reservation accuracy becoming a differentiator.", why: "High volume rewards staff who can manage bookings accurately under pressure.", kind: "brief", readTime: "3 min" },
  { id: "a3", title: "WhatsApp is now the front desk: digital guest communication", category: "Digital customer experience", source: "Hospitality Practice Notes", date: "05 Sep 2031", summary: "Most pre-arrival guest questions now arrive through messaging, changing tone, speed and documentation expectations.", why: "Written guest communication is becoming as important as face-to-face service.", kind: "brief", readTime: "5 min" },
  { id: "a4", title: "Community-based tourism in Mutoko and the Eastern Highlands", category: "Sustainable tourism", source: "Field & Innovation Hubs", date: "28 Aug 2031", summary: "Community operators are using simple digital booking tools to reach international visitors directly.", why: "Entrepreneurs with digital skills are opening new tourism routes.", kind: "brief", readTime: "4 min" },
  { id: "r1", title: "Bridging the gap: academic preparation and industry practice in Zimbabwean hospitality", category: "Workforce research", source: "Tourism Workforce Research Programme", date: "Aug 2031", summary: "Graduates show strong theoretical grounding but limited exposure to reservation and ticket booking systems used in industry.", why: "This platform's simulations directly target the practical gaps identified.", kind: "research", readTime: "22 min" },
  { id: "r2", title: "AI readiness among tourism and hospitality employees", category: "Workforce research", source: "Regional Hospitality Skills Study", date: "Jun 2031", summary: "Employees express interest in AI tools but most have had no structured training in using them at work.", why: "Continuous digital skills development is now a workforce priority.", kind: "research", readTime: "18 min" },
  { id: "r3", title: "Mobile innovation hubs as a model for remote destination training", category: "Sector insight", source: "Tourism Skills Consortium", date: "Apr 2031", summary: "Taking training to destinations like Kariba increases participation among working staff and community operators.", why: "Learning reaches people who cannot leave their workplaces for campus programmes.", kind: "research", readTime: "15 min" },
];

export const CHANGING = [
  { year: "2029", tech: "Cloud property management", skill: "System navigation & data accuracy" },
  { year: "2030", tech: "Messaging-first guest service", skill: "Written digital communication" },
  { year: "2031", tech: "AI concierge & reservation assistants", skill: "AI supervision & prompt judgement" },
  { year: "2032", tech: "Dynamic pricing automation", skill: "Revenue awareness" },
  { year: "2033", tech: "Personalised guest data platforms", skill: "Data ethics & personalisation" },
];

export type Person = {
  id: string;
  name: string;
  initials: string;
  type: string;
  role: string;
  organisation: string;
  location: string;
  skills: string[];
  experience: string;
  interests: string[];
  statement: string;
};

export const PEOPLE: Person[] = [
  { id: "p1", name: "Farai Mutasa", initials: "FM", type: "Hotel Manager", role: "Front Office Manager", organisation: "Victoria Falls Safari Lodge", location: "Victoria Falls", skills: ["Front Office", "Revenue", "Team Leadership"], experience: "11 years", interests: ["AI in hospitality", "Mentorship"], statement: "I mentor graduates moving into front-office roles and care deeply about reservation accuracy." },
  { id: "p2", name: "Nyasha Gumbo", initials: "NG", type: "Travel Agent", role: "Senior Travel Consultant", organisation: "Harare Travel Centre", location: "Harare", skills: ["Ticket Booking", "Itinerary Planning", "GDS"], experience: "8 years", interests: ["Regional air routes", "Digital CX"], statement: "Specialist in regional itineraries and group travel across SADC." },
  { id: "p3", name: "Dr. Chipo Sibanda", initials: "CS", type: "Educator", role: "Senior Lecturer, Hospitality", organisation: "University of Zimbabwe", location: "Harare", skills: ["Curriculum Design", "Research", "Hospitality Ops"], experience: "15 years", interests: ["Workforce research", "Sustainable tourism"], statement: "Researching how universities can close the practical exposure gap." },
  { id: "p4", name: "Tatenda Moyo", initials: "TM", type: "Graduate", role: "Reservations Agent", organisation: "Meikles Hotel", location: "Harare", skills: ["Reservations", "PMS", "Guest Communication"], experience: "1 year", interests: ["Career growth", "Revenue"], statement: "Recent graduate who got placed through a simulation-verified Skills Passport." },
  { id: "p5", name: "Kudzai Marufu", initials: "KM", type: "Entrepreneur", role: "Founder", organisation: "Mutoko Heritage Trails", location: "Mutoko", skills: ["Community Tourism", "Digital Marketing"], experience: "6 years", interests: ["Sustainable tourism", "Online booking"], statement: "Building community-led heritage experiences in Mashonaland East." },
  { id: "p6", name: "Zimbabwe Tourism Skills Council", initials: "ZT", type: "Industry Organisation", role: "Sector Skills Body", organisation: "Industry Organisation", location: "National", skills: ["Standards", "Accreditation"], experience: "Est. 2027", interests: ["Workforce readiness", "Verification"], statement: "Setting practical competency standards for the tourism workforce." },
  { id: "p7", name: "Blessing Chikore", initials: "BC", type: "Student", role: "Tourism Student", organisation: "Chinhoyi University of Technology", location: "Chinhoyi", skills: ["Destination Knowledge", "Customer Service"], experience: "Year 3", interests: ["Safari operations", "Internships"], statement: "Passionate about wildlife tourism and guiding." },
  { id: "p8", name: "Ruvimbo Nhari", initials: "RN", type: "Tourism Professional", role: "Guest Experience Lead", organisation: "Amanzi Lodge", location: "Harare", skills: ["Guest Experience", "Service Recovery", "AI Tools"], experience: "9 years", interests: ["AI in hospitality", "Digital CX"], statement: "Designing guest journeys that blend warm service and smart tools." },
];

export type Post = {
  id: string;
  authorId: string;
  label: string;
  time: string;
  body: string;
  reactions: number;
  comments: { author: string; text: string }[];
};

export const POSTS: Post[] = [
  { id: "post1", authorId: "p8", label: "Industry Update", time: "2h", body: "How AI is changing guest experience operations: at our lodge, AI now drafts first responses to guest messages — but every reply is reviewed by a person. The skill we hire for is judgement, not typing speed.", reactions: 48, comments: [{ author: "Farai Mutasa", text: "Exactly our experience at the front desk too." }] },
  { id: "post2", authorId: "p1", label: "Mentorship", time: "5h", body: "We're opening four mentorship slots for final-year students interested in front office. A verified reservation simulation on your Skills Passport is a strong signal for us.", reactions: 91, comments: [] },
  { id: "post3", authorId: "p3", label: "Research", time: "1d", body: "New publication: our study on practical exposure gaps found that booking systems experience is the single biggest predictor of graduate confidence in their first placement.", reactions: 63, comments: [{ author: "Nyasha Gumbo", text: "Would love to see this discussed with travel agencies too." }] },
];

export type Opportunity = {
  id: string;
  title: string;
  org: string;
  location: string;
  type: "Internship" | "Industry placement" | "Practical training" | "Mentorship" | "Industry event" | "Career" | "Professional development";
  experience: "Entry" | "Mid" | "Senior";
  skills: string[];
  deadline: string;
  match: number;
  description: string;
};

export const OPPORTUNITIES: Opportunity[] = [
  { id: "o1", title: "Front Office Internship", org: "Kingdom Hotel", location: "Victoria Falls", type: "Internship", experience: "Entry", skills: ["Reservation Management", "Guest Communication"], deadline: "15 Oct 2031", match: 91, description: "Six-month rotation across reservations, reception and guest relations." },
  { id: "o2", title: "Reservations Agent", org: "Meikles Hotel", location: "Harare", type: "Career", experience: "Entry", skills: ["Reservation Management", "Property Management Systems"], deadline: "30 Oct 2031", match: 84, description: "Full-time role managing direct and online-channel bookings." },
  { id: "o3", title: "Safari Lodge Placement", org: "Hwange Safari Lodge", location: "Hwange", type: "Industry placement", experience: "Entry", skills: ["Guest Check-in", "Destination Knowledge"], deadline: "01 Nov 2031", match: 78, description: "Three-month placement in lodge operations and guest experience." },
  { id: "o4", title: "Ticketing Systems Bootcamp", org: "Harare Travel Centre", location: "Harare", type: "Practical training", experience: "Entry", skills: ["Ticket Booking Systems"], deadline: "20 Oct 2031", match: 88, description: "Two-week hands-on training on airline and rail booking systems." },
  { id: "o5", title: "Front Office Mentorship", org: "Farai Mutasa · VF Safari Lodge", location: "Remote", type: "Mentorship", experience: "Entry", skills: ["Front Office Operations"], deadline: "Rolling", match: 93, description: "Monthly mentorship sessions with an experienced front office manager." },
  { id: "o6", title: "Sanganai / Hlanganani Tourism Expo", org: "Tourism Sector", location: "Bulawayo", type: "Industry event", experience: "Mid", skills: ["Destination Knowledge"], deadline: "08 Nov 2031", match: 70, description: "Zimbabwe's flagship tourism expo — networking and buyer meetings." },
  { id: "o7", title: "Revenue Management Certificate", org: "TW2031 Academy", location: "Online", type: "Professional development", experience: "Mid", skills: ["Revenue Awareness"], deadline: "Rolling", match: 76, description: "Eight-week professional certificate with simulation-based assessment." },
  { id: "o8", title: "Guest Experience Supervisor", org: "Rainbow Towers Hotel", location: "Harare", type: "Career", experience: "Mid", skills: ["Service Recovery", "Team Leadership"], deadline: "12 Nov 2031", match: 72, description: "Lead a team of six guest relations officers." },
  { id: "o9", title: "Kariba Houseboat Operations Placement", org: "Kariba Shoreline Tours", location: "Kariba", type: "Industry placement", experience: "Entry", skills: ["Itinerary Planning", "Customer Service"], deadline: "25 Oct 2031", match: 69, description: "Seasonal placement in bookings and guest coordination on Lake Kariba." },
];

export type Course = {
  id: string;
  title: string;
  category: string;
  modules: number;
  duration: string;
  difficulty: "Foundation" | "Intermediate" | "Advanced";
  skills: string[];
  relevance: string;
  progress: number;
};

export const LEARNING_CATEGORIES = [
  "Tourism Operations",
  "Hospitality Operations",
  "Digital Skills",
  "Artificial Intelligence",
  "Customer Experience",
  "Management",
  "Entrepreneurship",
  "Sustainable Tourism",
];

export const COURSES: Course[] = [
  { id: "c1", title: "Hotel Operations Fundamentals", category: "Hospitality Operations", modules: 6, duration: "4h 30m", difficulty: "Foundation", skills: ["Front Office", "Reservations", "Customer Experience"], relevance: "Required by 9 of 10 hotel employers", progress: 67 },
  { id: "c2", title: "Reservation Systems in Practice", category: "Digital Skills", modules: 5, duration: "3h 45m", difficulty: "Intermediate", skills: ["Property Management Systems", "Reservation Management"], relevance: "Directly addresses the systems exposure gap", progress: 40 },
  { id: "c3", title: "AI for Hospitality Professionals", category: "Artificial Intelligence", modules: 4, duration: "2h 50m", difficulty: "Foundation", skills: ["AI-assisted Service", "Prompt Judgement"], relevance: "Fastest-growing skill in 2031 job adverts", progress: 15 },
  { id: "c4", title: "Service Recovery & Guest Complaints", category: "Customer Experience", modules: 5, duration: "3h", difficulty: "Intermediate", skills: ["Service Recovery", "Guest Communication"], relevance: "Top competency for guest-facing roles", progress: 0 },
  { id: "c5", title: "Ticketing & Travel Distribution", category: "Tourism Operations", modules: 6, duration: "4h", difficulty: "Intermediate", skills: ["Ticket Booking Systems", "Itinerary Planning"], relevance: "Core for travel agency roles", progress: 0 },
  { id: "c6", title: "Leading Hospitality Teams", category: "Management", modules: 7, duration: "5h", difficulty: "Advanced", skills: ["Staff Allocation", "Decision Making"], relevance: "Pathway to supervisor roles", progress: 0 },
  { id: "c7", title: "Starting a Digital Tourism Business", category: "Entrepreneurship", modules: 6, duration: "4h 15m", difficulty: "Foundation", skills: ["Digital Marketing", "Online Booking"], relevance: "For operators moving bookings online", progress: 0 },
  { id: "c8", title: "Sustainable & Community Tourism", category: "Sustainable Tourism", modules: 4, duration: "2h 40m", difficulty: "Foundation", skills: ["Sustainability", "Community Engagement"], relevance: "Growing visitor expectation", progress: 25 },
];

export const HUBS = [
  { id: "h1", destination: "Kariba", programme: "Lakeside Hospitality Skills Week", focus: "Houseboat guest service & digital bookings", next: "14 Oct 2031", participants: 46, status: "Enrolling", project: "Online booking set-up for 8 community operators" },
  { id: "h2", destination: "Mutoko", programme: "Community Heritage Tourism Lab", focus: "Guiding, storytelling & sustainable tourism", next: "21 Oct 2031", participants: 32, status: "Enrolling", project: "Heritage trail digital map with local guides" },
  { id: "h3", destination: "Victoria Falls", programme: "Front Office Readiness Clinic", focus: "Reservation systems & peak-season operations", next: "04 Nov 2031", participants: 58, status: "Upcoming", project: "Graduate placement pipeline with 5 hotels" },
  { id: "h4", destination: "Nyanga", programme: "Eastern Highlands Lodge Skills", focus: "Small lodge operations & AI-assisted marketing", next: "18 Nov 2031", participants: 24, status: "Upcoming", project: "Shared digital marketing toolkit" },
  { id: "h5", destination: "Masvingo", programme: "Great Zimbabwe Visitor Experience", focus: "Heritage interpretation & digital CX", next: "02 Dec 2031", participants: 38, status: "Planning", project: "Visitor feedback system for heritage site" },
];

export const BADGES = [
  { id: "b1", name: "Front Office Ready", tier: "Verified", date: "Jul 2031", issuer: "TW2031 Simulator" },
  { id: "b2", name: "Guest Communication", tier: "Verified", date: "Jun 2031", issuer: "TW2031 Simulator" },
  { id: "b3", name: "Destination Specialist: Victoria Falls", tier: "Demonstrated", date: "May 2031", issuer: "Learning Hub" },
  { id: "b4", name: "AI Foundations", tier: "Developing", date: "In progress", issuer: "Learning Hub" },
];

export const TIMELINE_SEED = [
  { id: "t1", type: "Simulation", title: "Guest Check-in Simulation", detail: "Verified · Guest Check-in, Guest Communication", date: "Jul 2031" },
  { id: "t2", type: "Learning", title: "Hotel Operations Fundamentals · Modules 1–4", detail: "Front Office, Reservations", date: "Jun 2031" },
  { id: "t3", type: "Industry exposure", title: "Job shadow: Rainbow Towers front desk", detail: "2 days · Harare", date: "May 2031" },
  { id: "t4", type: "Professional development", title: "Field Hub: Victoria Falls Readiness Clinic", detail: "Workshop attendance", date: "Apr 2031" },
];

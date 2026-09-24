import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "@/components/tw/profile-view";
import { BADGES } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Your Profile — Tourism Workforce 2031" }, { name: "description", content: "Your professional profile and verified capability." }] }),
  component: Profile,
});

function Profile() {
  const { persona, competencies, timeline, attempts, connections } = useApp();
  return (
    <ProfileView
      own
      p={{
        initials: persona.initials,
        name: persona.name,
        role: persona.title,
        organisation: persona.organisation,
        location: persona.location,
        statement: persona.statement,
        competencies: competencies.filter((c) => c.state !== "Developing"),
        experience: timeline.filter((t) => t.type !== "Simulation").map((t) => ({ title: t.title, detail: t.detail, date: t.date })),
        simulations: ["Guest Check-in · Verified", ...attempts.map((a) => `${a.title} · ${a.addedToPassport ? "On passport" : "Completed"}`)],
        development: ["Field Hub: Victoria Falls Readiness Clinic", "Hotel Operations Fundamentals (67%)"],
        interests: ["AI in hospitality", "Front office", "Sustainable tourism"],
        connections: connections.length + 38,
        achievements: BADGES.map((b) => `${b.name} · ${b.tier}`),
      }}
    />
  );
}

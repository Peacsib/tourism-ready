import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileView } from "@/components/tw/profile-view";
import { MessageDialog } from "@/components/tw/message-dialog";
import { ConnectButton } from "./app.network";
import { PEOPLE } from "@/lib/data";

export const Route = createFileRoute("/app/people/$id")({
  loader: ({ params }) => {
    const person = PEOPLE.find((p) => p.id === params.id);
    if (!person) throw notFound();
    return { person };
  },
  head: ({ loaderData }) => ({ meta: [{ title: loaderData ? `${loaderData.person.name} — Tourism Network` : "Profile unavailable" }, { name: "description", content: "Professional profile on the Tourism Network." }] }),
  notFoundComponent: () => (
    <div className="py-20 text-center"><h1 className="text-2xl font-semibold">Profile not found</h1><Button asChild className="mt-6"><Link to="/app/network">Back to network</Link></Button></div>
  ),
  component: PersonPage,
});

function PersonPage() {
  const { person: p } = Route.useLoaderData();
  const [msg, setMsg] = useState(false);
  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 text-muted-foreground"><Link to="/app/network"><ArrowLeft className="mr-1 h-4 w-4" /> Network</Link></Button>
      <ProfileView
        p={{
          initials: p.initials, name: p.name, role: p.role, organisation: p.organisation, location: p.location, statement: p.statement,
          competencies: p.skills.map((s, i) => ({ id: s, name: s, state: i === 0 ? "Verified" : i === 1 ? "Demonstrated" : "Practising" })),
          experience: [{ title: `${p.role}, ${p.organisation}`, detail: p.location, date: p.experience }],
          simulations: p.type === "Industry Organisation" ? ["Publishes competency standards"] : ["Reservation Desk · Demonstrated", "Service Recovery · Practised"],
          development: ["Industry mentorship programme", "AI for Hospitality Professionals"],
          interests: p.interests,
          connections: 120 + p.name.length * 7,
          achievements: [`${p.skills[0]} · Verified`, "Network contributor"],
        }}
        actions={<><ConnectButton person={p} size="default" /><Button variant="outline" onClick={() => setMsg(true)}><MessageSquare className="mr-1 h-4 w-4" /> Message</Button></>}
      />
      <MessageDialog person={msg ? p : null} onClose={() => setMsg(false)} />
    </div>
  );
}

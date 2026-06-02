import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Twitter, Instagram, Linkedin } from "lucide-react";

const teamMembers = [
  {
    name: "Rafer, Jhon Brayn",
    role: "Full Stack Developer",
    avatar: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar/avatar1.webp",
  },
  {
    name: "Arevalo, Patrick",
    role: "Frontend Developer",
    avatar: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar/avatar2.webp",
  },
  {
    name: "Manuebo, John Andrew",
    role: "Backend Support",
    avatar: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar/avatar3.webp",
  },
  {
    name: "Tamayo, Mac Larrie",
    role: "Quality Assurance",
    avatar: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar/avatar4.webp",
  },
  {
    name: "Santiago, Roiven",
    role: "Quality Assurance",
    avatar: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar/avatar5.webp",
  },
  {
    name: "Fork Force",
    role: "Team Name",
    avatar: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar/avatar6.webp",
  },
];

const socialLinks = [
  { icon: Twitter, label: "Twitter" },
  { icon: Instagram, label: "Instagram" },
  { icon: Linkedin, label: "LinkedIn" },
];

function TeamMemberCard({ member }) {
  return (
    <Card className="bg-background border-border/50 bg-card/50 p-6 backdrop-blur-sm ring-1 ring-foreground/10 overflow-hidden group/card">
      <div className="grid grid-cols-2 items-start gap-4">
        {/* Left: Info + Socials */}
        <div className="flex flex-col justify-between gap-6">
          <div>
            <h3 className="font-medium text-foreground">{member.name}</h3>
            <p className="text-xs text-muted-foreground">{member.role}</p>
          </div>
          <div className="flex gap-2">
            {socialLinks.map(({ icon: Icon, label }) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                aria-label={label}
                className="h-8 w-8 p-0 border-border/50 bg-background/50 hover:bg-muted hover:text-foreground transition-all duration-200"
              >
                <Icon className="h-3 w-3" />
              </Button>
            ))}
          </div>
        </div>

        {/* Right: Avatar */}
        <div className="h-full">
          <img
            alt={member.name}
            src={member.avatar}
            className="h-full w-full rounded-lg object-cover"
          />
        </div>
      </div>
    </Card>
  );
}

export default function TeamSection() {
  return (
    <section className="py-20 px-4 min-h-screen w-full bg-background">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Users className="h-4 w-4 text-foreground" aria-hidden="true" />
            <p className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
              Meet Our Creators
            </p>
          </div>
          <h2 className="mb-4 text-4xl md:text-5xl lg:text-6xl">
            <span className="font-semibold text-foreground">Building the Future</span>{" "}
            <span className="font-medium text-muted-foreground italic">Together</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Our diverse team of innovators, designers, and engineers work together to create
            exceptional digital experiences that make a difference.
          </p>
        </div>

        {/* Grid */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <TeamMemberCard key={member.name} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
}
import Link from "next/link";

const SECTIONS = [
  {
    href: "/now",
    title: "Now",
    description: "The live board — urgent signals, top opportunities and restocks happening right now.",
  },
  {
    href: "/earn",
    title: "Earn",
    description: "Open client requests: source the item, deliver it and get paid.",
  },
  {
    href: "/calendar",
    title: "Calendar",
    description: "Upcoming release dates and announced drops in one schedule.",
  },
  {
    href: "/sources",
    title: "Sources",
    description: "Every watcher and feed Alertyy follows, with live health status.",
  },
  {
    href: "/playbook",
    title: "Playbook",
    description: "The speculator's playbook — how a raw signal becomes a profitable flip.",
  },
  {
    href: "/requests/new",
    title: "New request",
    description: "Post a new client request for an item you want sourced for you.",
  },
  {
    href: "/notifications",
    title: "Notifications",
    description: "Push alerts for urgent signals, restocks and releases you follow.",
  },
];

export default function MenuPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-rr-text">Menu</h1>
        <p className="mt-1 text-sm text-rr-text-dim">Every section of Alertyy in one place.</p>
      </header>

      <nav className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="block rounded-2xl border border-rr-frame bg-rr-surface p-5 transition-colors hover:border-rr-accent/40"
          >
            <div className="font-medium text-rr-text">
              {section.title} <span className="text-rr-accent">→</span>
            </div>
            <p className="mt-1 text-sm text-rr-text-dim">{section.description}</p>
          </Link>
        ))}
      </nav>
    </div>
  );
}

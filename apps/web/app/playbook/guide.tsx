import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Speculator's Playbook — Alertyy",
  description:
    "How experienced resellers play a drop: raffles and queues explained, account preparation, checklists, and the exit.",
};

type Block = { h?: string; p?: string; list?: string[]; check?: boolean };
type GuideSection = { title: string; blocks: Block[] };

const SECTIONS: GuideSection[] = [
  {
    title: "How drops actually work",
    blocks: [
      {
        h: "Raffles & draws",
        p: "The store collects entries during a set window, then picks winners at random. Speed does not help you — a correct entry does: right size, right account, and a saved payment method that will go through, because most draws charge the card automatically when you win. Enter once, then wait for the result.",
      },
      {
        h: "First-come queues",
        p: "Stock opens at an announced time and buyers are let through in order. Being early matters, but so does staying put: once you are in the queue, leaving the page or hammering refresh can cost you your place. When your turn comes you usually get a short window to check out, so the size and payment decisions must already be made.",
      },
      {
        h: "Instant sellouts",
        p: "Some releases skip draws and queues entirely — the product page just goes live, and popular sizes can be gone in under a minute. There is no reaction-time trick here. The only edge is preparation: signed in, default address and card saved, product page open before the time.",
      },
    ],
  },
  {
    title: "Queues, explained",
    blocks: [
      {
        h: "SNKRS Draw (Nike)",
        p: "Limited Nike launches run as a Draw inside the SNKRS app. You enter during the entry window — one entry per account — and winners are picked after it closes and notified in the app. Your account must have a verified phone number, and a win charges your saved card automatically, so both have to be correct before you enter.",
      },
      {
        h: "adidas Confirmed",
        p: "adidas runs its limited launches as draws in the Confirmed app. Enter before the deadline, keep notifications on, and when you win, confirm in the app — the saved card is charged on the win. Miss the confirmation window and the pair goes to someone else.",
      },
      {
        h: "Queue-it waiting rooms",
        p: "Many stores put a waiting room (often run by Queue-it) in front of a hot product page. Join before the start and you are placed in the pre-queue; when the sale opens, buyers are admitted in batches. Stay on the page and let it refresh itself. When you reach the front you get a limited time to complete checkout.",
      },
      {
        h: "Kith draws",
        p: "Kith runs limited launches as draws on kith.com and in its stores. Enter once with the exact size. In-store draws are tied to you personally: if you win, bring the ID that matches the entry when you pick up.",
      },
    ],
  },
  {
    title: "Prepare your accounts",
    blocks: [
      {
        list: [
          "Email and phone verified on every store account you plan to use — draws and queues both break on an unverified account.",
          "Shipping address saved and set as default, spelled the way the courier needs it; the name on the account should match your ID and your card.",
          "Payment card saved as default. Check the expiry date and the bank daily limit before a big drop — a declined charge at the moment you win is the most common unforced error.",
          "One account per store, in your own name, with your own details. That is the correct way to do it: it keeps wins from being cancelled and accounts from being banned.",
          "Notifications on for the apps that run draws, so a win does not expire while you are looking the other way.",
        ],
      },
    ],
  },
  {
    title: "The 24-hour and 10-minute checklists",
    blocks: [
      {
        h: "24 hours before",
        check: true,
        list: [
          "Confirm the drop time and convert it to your own time zone",
          "Log in to the store and check the account is verified",
          "Check the saved card: expiry, daily limit, billing address",
          "Decide the exact size — and the second choice if your size sells out",
          "Set your ceiling: the most you will pay, from completed-sales research",
          "Decide the exit: where you would sell, and at what price it is worth it",
        ],
      },
      {
        h: "10 minutes before",
        check: true,
        list: [
          "Be online, signed in, on the product page",
          "Phone next to you for verification codes",
          "Stable connection; close anything competing for bandwidth or attention",
          "Join the waiting room or queue as soon as it opens",
          "Then nothing clever: one entry, one queue, no refresh spam",
        ],
      },
    ],
  },
  {
    title: "The exit",
    blocks: [
      {
        p: "Research completed sales, not asking prices. Asks are what sellers hope for; completed sales are what buyers actually paid. Value what you hold from completed sales — never from the lowest ask.",
      },
      {
        p: "Count the fees before you count the profit. The big marketplaces typically take around 13% in platform and payment fees combined — check the exact fee table of the marketplace you use, then subtract shipping, packaging and returns risk. What is left is the real margin.",
      },
      {
        h: "When to sell",
        p: "Demand is usually strongest in the days right after a release, while resale supply is still thin — and a restock announcement can cut prices the same day. Decide your sell window before you buy, and do not turn a planned flip into an accidental collection.",
      },
      {
        h: "Shipping and packaging",
        p: "Ship fast, and pack like the buyer paid full price — because they did: box in a box for shoes, protection for the corners, and keep the tracking number and a photo of the packed item until the money clears.",
      },
    ],
  },
  {
    title: "Rules of the house",
    blocks: [
      {
        list: [
          "Never buy without a sold-price reference. If you cannot point to completed sales, you do not have a play — you have a guess.",
          "One clear action per drop. Before the window opens you should know whether yours is buy, enter the draw, or skip. Drops punish improvisation.",
          "Position sizing. Only put money into a drop that you can afford to have sitting in inventory, and size the buy to your budget, not to the hype. If the margin disappears once fees and a small price dip are counted, the correct play is to skip — there is always another drop.",
        ],
      },
    ],
  },
];

function BlockView({ block }: { block: Block }) {
  return (
    <div>
      {block.h && (
        <h3 className="mb-1 text-[14px] font-semibold text-[#1a1a1a]">{block.h}</h3>
      )}
      {block.p && <p>{block.p}</p>}
      {block.list && (
        <ul className={block.check ? "space-y-1.5" : "list-disc space-y-1.5 pl-5"}>
          {block.list.map((item) => (
            <li key={item} className={block.check ? "flex items-start gap-2" : undefined}>
              {block.check && (
                <span aria-hidden="true" className="mt-[1px] text-[#9ca3af]">☐</span>
              )}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PlaybookPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        <Link href="/now" className="inline-flex items-center gap-1 text-[13px] text-[#6b7280] hover:text-[#1a1a1a]">
          <ArrowLeft size={14} /> Back to feed
        </Link>

        <div className="pt-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#16a34a]">
            Alertyy guide
          </div>
          <h1 className="mt-1 text-[28px] font-bold leading-tight text-[#1a1a1a]">
            {"Speculator's Playbook"}
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#374151]">
            How experienced resellers actually play a drop: the mechanics of draws and queues,
            the preparation that decides most outcomes before the window opens, and the exit that
            turns a win into profit. Everything here is public, rule-abiding know-how — no bots,
            no multi-account tricks.
          </p>
        </div>

        {SECTIONS.map((s) => (
          <section key={s.title} className="rounded-[16px] border border-[#e5e7eb] bg-white p-5">
            <h2 className="mb-3 text-[16px] font-semibold text-[#1a1a1a]">{s.title}</h2>
            <div className="space-y-4 text-[14px] leading-relaxed text-[#374151]">
              {s.blocks.map((b, i) => (
                <BlockView key={i} block={b} />
              ))}
            </div>
          </section>
        ))}

        <p className="px-1 pb-6 text-[12px] leading-relaxed text-[#9ca3af]">
          Retailers set their own rules for every launch, and the rules on the product page always
          win over any guide. Read them first.
        </p>
      </main>
    </div>
  );
}

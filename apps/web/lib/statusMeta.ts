export interface StatusMeta {
  label: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  dotClass: string;
}

const META: Record<string, StatusMeta> = {
  BUY_NOW:         { label: "BUY NOW",         textClass: "text-red-400",    bgClass: "bg-red-500/10",    borderClass: "border-red-500/40",    dotClass: "bg-red-500" },
  SOURCE_NOW:      { label: "SOURCE NOW",      textClass: "text-red-400",    bgClass: "bg-red-500/10",    borderClass: "border-red-500/40",    dotClass: "bg-red-500" },
  APPLY_NOW:       { label: "APPLY NOW",       textClass: "text-purple-400", bgClass: "bg-purple-500/10", borderClass: "border-purple-500/40", dotClass: "bg-purple-500" },
  APPLY_RESERVE:   { label: "APPLY / RESERVE", textClass: "text-purple-400", bgClass: "bg-purple-500/10", borderClass: "border-purple-500/40", dotClass: "bg-purple-500" },
  PREPARE:         { label: "PREPARE",         textClass: "text-amber-400",  bgClass: "bg-amber-500/10",  borderClass: "border-amber-500/40",  dotClass: "bg-amber-500" },
  RESERVE_PICKUP:  { label: "RESERVE PICKUP",  textClass: "text-amber-400",  bgClass: "bg-amber-500/10",  borderClass: "border-amber-500/40",  dotClass: "bg-amber-500" },
  CLIENT_FIRST:    { label: "CLIENT FIRST",    textClass: "text-blue-400",   bgClass: "bg-blue-500/10",   borderClass: "border-blue-500/40",   dotClass: "bg-blue-500" },
  CONTACT_DEALER:  { label: "CONTACT DEALER",  textClass: "text-blue-400",   bgClass: "bg-blue-500/10",   borderClass: "border-blue-500/40",   dotClass: "bg-blue-500" },
  VERIFY:          { label: "VERIFY",          textClass: "text-orange-400", bgClass: "bg-orange-500/10", borderClass: "border-orange-500/40", dotClass: "bg-orange-500" },
  VERIFY_IN_STORE: { label: "VERIFY IN STORE", textClass: "text-orange-400", bgClass: "bg-orange-500/10", borderClass: "border-orange-500/40", dotClass: "bg-orange-500" },
  WATCH:           { label: "WATCH",           textClass: "text-zinc-400",   bgClass: "bg-zinc-500/10",   borderClass: "border-zinc-500/40",   dotClass: "bg-zinc-500" },
  WATCH_RESTOCK:   { label: "WATCH RESTOCK",   textClass: "text-zinc-400",   bgClass: "bg-zinc-500/10",   borderClass: "border-zinc-500/40",   dotClass: "bg-zinc-500" },
  SKIP:            { label: "SKIP",            textClass: "text-zinc-600",  bgClass: "bg-zinc-700/10",   borderClass: "border-zinc-700/40",   dotClass: "bg-zinc-600" },
};

export function getStatusMeta(status: string): StatusMeta {
  return META[status] ?? META.WATCH;
}

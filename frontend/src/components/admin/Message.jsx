import { useState, useCallback } from "react";
import {
  CheckCircle, AlertCircle, Info, XCircle,
  Search, CheckCheck, Inbox, Bell, ArrowLeft, SlidersHorizontal, X,
} from "lucide-react";
import { useNotifications, formatTimestamp } from "@/context/NotificationContext";
import { useAuth } from "@/auth/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ─── Config ─────────────────────────────────────────────────────────────── */
const TYPE_CONFIG = {
  success: { Icon: CheckCircle, dot: "bg-emerald-400", pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800" },
  error:   { Icon: XCircle,     dot: "bg-rose-400",    pill: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"                 },
  warning: { Icon: AlertCircle, dot: "bg-amber-400",   pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"           },
  info:    { Icon: Info,        dot: "bg-sky-400",     pill: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800"                       },
};
const PAGE_SIZE    = 10;
const TYPE_FILTERS = ["all", "success", "info", "warning", "error"];

/* ─── Sender Avatar ──────────────────────────────────────────────────────── */
function SenderAvatar({ from, type, size = "md" }) {
  const initials = from.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  return (
    <div className="relative shrink-0">
      <Avatar className={size === "lg" ? "w-11 h-11" : "w-9 h-9"}>
        <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground tracking-wide">
          {initials || "?"}
        </AvatarFallback>
      </Avatar>
      <span className={cn(
        "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background",
        size === "lg" ? "w-3.5 h-3.5" : "w-2.5 h-2.5",
        cfg.dot
      )} />
    </div>
  );
}

/* ─── Type Badge ─────────────────────────────────────────────────────────── */
function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const { Icon } = cfg;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize tracking-wide shrink-0",
      cfg.pill
    )}>
      <Icon className="w-2.5 h-2.5" />
      {type}
    </span>
  );
}

/* ─── Message Row ────────────────────────────────────────────────────────── */
function MessageRow({ n, selected, onClick }) {
  const read = n.mark_read;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 flex gap-3 items-start transition-all duration-150",
        "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "bg-muted border-l-2 border-foreground" : "border-l-2 border-transparent",
        !read && !selected && "border-l-2 border-primary/50"
      )}
    >
      <SenderAvatar  from={n.content.from} type={n.content.type} />
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn("text-sm truncate capitalize", !read ? "font-semibold text-foreground" : "font-normal text-muted-foreground")}>
            {n.content.from}
          </span>
          <time className="text-[11px] text-muted-foreground/70 whitespace-nowrap shrink-0 tabular-nums">
            {formatTimestamp(n.timestamp)}
          </time>
        </div>
        <p className={cn("text-[13px] truncate leading-snug", !read ? "font-medium text-foreground" : "font-normal text-muted-foreground/80")}>
          {n.content.title}
        </p>
        <p className="text-[11px] text-muted-foreground/60 truncate leading-snug">
          {n.content.message}
        </p>
      </div>
      {!read && <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
    </button>
  );
}

/* ─── Empty State ────────────────────────────────────────────────────────── */
function EmptyState({ message }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center gap-3 text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
        <Inbox className="w-5 h-5 text-muted-foreground/50" />
      </div>
      <p className="text-xs text-muted-foreground max-w-[180px] leading-relaxed">{message}</p>
    </div>
  );
}

/* ─── Mobile Filter Drawer ───────────────────────────────────────────────── */
function FilterDrawer({ open, onClose, tab, setTab, typeFilter, setTypeFilter, unreadCount, setPage }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-t-2xl px-5 pt-4 pb-8 flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-foreground">Filters</span>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Show</p>
          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            {["all", "unread"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setPage(1); onClose(); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg transition-all capitalize",
                  tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {t}
                {t === "unread" && unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 leading-4">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Type</p>
          <div className="flex gap-2 flex-wrap">
            {TYPE_FILTERS.map((t) => {
              const cfg = TYPE_CONFIG[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTypeFilter(t); setPage(1); onClose(); }}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all capitalize",
                    typeFilter === t
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border/60"
                  )}
                >
                  {cfg && <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />}
                  {t === "all" ? "All types" : t}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail Pane ────────────────────────────────────────────────────────── */
function DetailPane({ n, onBack }) {
  if (!n) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center gap-4 bg-muted/20">
        <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center">
          <Bell className="w-7 h-7 text-muted-foreground/30" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-muted-foreground/60">No message selected</p>
          <p className="text-xs text-muted-foreground/40">Choose a notification from the list</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Mobile back nav */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 md:hidden shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to inbox
        </button>
      </div>

      {/* Header */}
      <div className="px-5 py-5 sm:px-8 sm:py-6 border-b border-border/60 shrink-0">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground leading-tight tracking-tight">
            {n.content.title}
          </h2>
          <TypeBadge type={n.content.type} />
        </div>
        <div className="flex items-center gap-3">
          <SenderAvatar from={n.content.from} type={n.content.type} size="lg" />
          <div>
            <p className="text-sm font-medium text-foreground capitalize">{n.content.from}</p>
            <time className="text-xs text-muted-foreground tabular-nums">{formatTimestamp(n.timestamp)}</time>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-border/0 via-border to-border/0 mx-6 sm:mx-8" />

      {/* Body */}
      <ScrollArea className="flex-1">
        <div className="px-5 py-6 sm:px-8 sm:py-8">
         <p className="w-full max-w-full break-all whitespace-pre-line text-sm text-foreground/80 leading-relaxed">
  {n.content.message}
</p>
        </div>
      </ScrollArea>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function NotificationsPage() {
  // ── Context (single source of truth) ──
  const {
    notifications,
    unreadCount,
    markAsRead,
  } = useNotifications();

  const { user } = useAuth();

  // ── Local UI state only ──
  const [search, setSearch]         = useState("");
  const [tab, setTab]               = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage]             = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const showDetail    = selectedId !== null;
  const selectedNotif = notifications.find((n) => n.id === selectedId) ?? null;

  /* ── Mark all unread as read ── */
  const markAllRead = useCallback(() => {
    notifications
      .filter((n) => !n.mark_read)
      .forEach((n) => markAsRead(n.id));
  }, [notifications, markAsRead]);

  /* ── Select & auto-mark read ── */
  const handleSelect = (n) => {
    setSelectedId(n.id);
    if (!n.mark_read) {
      markAsRead(n.id);
    }
  };

  /* ── Filter ── */
  const filtered = notifications.filter((n) => {
    const q = search.toLowerCase();
    const matchSearch =
      n.content.title.toLowerCase().includes(q) ||
      n.content.message.toLowerCase().includes(q) ||
      n.content.from.toLowerCase().includes(q);
    const matchTab  = tab === "all" || (tab === "unread" && !n.mark_read);
    const matchType = typeFilter === "all" || n.content.type === typeFilter;
    return matchSearch && matchTab && matchType;
  });

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const paginated   = filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/70 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-background" />
          </div>
          <h1 className="text-sm font-semibold text-foreground tracking-tight">Inbox</h1>
          {unreadCount > 0 && (
            <Badge className="h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full tabular-nums">
              {unreadCount}
            </Badge>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5"
            onClick={markAllRead}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mark all read</span>
          </Button>
        )}
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">

        {/* ── List panel ── */}
        <aside className={cn(
          "flex flex-col min-h-0 border-r border-border/60 bg-muted/10",
          "absolute inset-0 md:relative md:inset-auto",
          "w-full md:w-[280px] lg:w-[300px] xl:w-[320px] md:shrink-0",
          showDetail ? "hidden md:flex" : "flex"
        )}>

          {/* ── Search row ── */}
          <div className="px-3 pt-3 pb-0 shrink-0 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search…"
                className="pl-8 h-8 text-xs bg-background border-border/60 focus-visible:ring-1 placeholder:text-muted-foreground/50"
              />
            </div>
            {/* Filter icon — mobile only */}
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className={cn(
                "sm:hidden w-8 h-8 flex items-center justify-center rounded-md border bg-background text-muted-foreground hover:text-foreground transition-colors shrink-0",
                (tab !== "all" || typeFilter !== "all") ? "border-foreground text-foreground" : "border-border/60"
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── Desktop filters ── */}
          <div className="hidden sm:flex flex-col gap-2 px-3 pt-2 pb-0 shrink-0">
            <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
              {["all", "unread"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTab(t); setPage(1); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1 rounded-md transition-all capitalize",
                    tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t}
                  {t === "unread" && unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-[9px] font-bold rounded-full px-1.5 leading-4">{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-1 flex-wrap pb-1">
              {TYPE_FILTERS.map((t) => {
                const cfg = TYPE_CONFIG[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTypeFilter(t); setPage(1); }}
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all capitalize",
                      typeFilter === t
                        ? "bg-foreground text-background border-foreground"
                        : "bg-transparent text-muted-foreground border-border/60 hover:border-muted-foreground/40 hover:text-foreground"
                    )}
                  >
                    {cfg && <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />}
                    {t === "all" ? "All" : t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Mobile active-filter chips ── */}
          {(tab !== "all" || typeFilter !== "all") && (
            <div className="flex sm:hidden gap-1.5 flex-wrap px-3 pt-2 shrink-0">
              {tab === "unread" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-foreground text-background px-2 py-0.5 rounded-full">
                  Unread
                  <button type="button" onClick={() => setTab("all")}><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {typeFilter !== "all" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-foreground text-background px-2 py-0.5 rounded-full capitalize">
                  {typeFilter}
                  <button type="button" onClick={() => setTypeFilter("all")}><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
            </div>
          )}

          {/* ── Count ── */}
          {filtered.length > 0 && (
            <p className="px-4 py-1.5 text-[10px] text-muted-foreground/50 shrink-0">
              {filtered.length} {filtered.length === 1 ? "message" : "messages"}
            </p>
          )}

          <div className="h-px bg-border/60 mx-0 shrink-0" />

          {/* ── Message list ── */}
          <ScrollArea className="flex-1">
            {notifications.length === 0 ? (
              <EmptyState message="You're all caught up. No notifications yet." />
            ) : paginated.length === 0 ? (
              <EmptyState message="Nothing matches your current filters." />
            ) : (
              <div className="py-1">
                {paginated.map((n, i) => (
                  <div key={n.id}>
                    <MessageRow
                      n={n}
                      selected={selectedId === n.id}
                      onClick={() => handleSelect(n)}
                    />
                    {i < paginated.length - 1 && <div className="mx-4 h-px bg-border/40" />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="px-4 py-2.5 flex items-center justify-between border-t border-border/60 shrink-0">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {clampedPage} / {totalPages}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" disabled={clampedPage === 1} onClick={() => setPage((p) => p - 1)}>
                  ← Prev
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" disabled={clampedPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next →
                </Button>
              </div>
            </div>
          )}
        </aside>

        {/* ── Detail panel ── */}
        <main className={cn(
          "flex flex-col min-h-0 overflow-hidden",
          "absolute inset-0 md:relative md:inset-auto md:flex-1",
          showDetail ? "flex" : "hidden md:flex"
        )}>
          <DetailPane n={selectedNotif} onBack={() => setSelectedId(null)} />
        </main>
      </div>

      {/* ── Mobile filter drawer ── */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        tab={tab}
        setTab={setTab}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        unreadCount={unreadCount}
        setPage={setPage}
      />
    </div>
  );
}
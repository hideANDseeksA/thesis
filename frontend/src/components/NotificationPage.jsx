import { useState, useCallback } from "react";
import { Mail, ArrowLeft, Search, Inbox } from "lucide-react";
import { useNotifications, formatTimestamp } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {api} from "@/lib/axios";

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-indigo-500",
];

function capitalizeWords(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name = "") {
  return String(name)
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const PAGE_SIZE = 10;

function DetailPane({ notification, onBack }) {
  if (!notification) {
    return (
      <div className="flex min-h-[400px] flex-1 select-none flex-col items-center justify-center gap-3 bg-muted/10 px-4 text-center text-muted-foreground">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40">
          <Mail className="h-7 w-7 opacity-30" />
        </div>
        <p className="text-sm font-medium">No Message Selected</p>
        <p className="text-xs text-muted-foreground/60">
          Choose A Message From The List
        </p>
      </div>
    );
  }

  const { content, timestamp } = notification;
  const color = avatarColor(content.from);

  return (
    <div className="flex flex-1 flex-col bg-background md:overflow-hidden">
      <button
        onClick={onBack}
        className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 md:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Back To Inbox
      </button>

      <div className="flex-1 overflow-visible md:overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:gap-4">
            <div
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold tracking-wide text-white shadow-sm ${color}`}
            >
              {initials(content.from)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="break-words text-[15px] font-semibold leading-snug text-foreground">
                {capitalizeWords(content.from)}
              </p>

              <p className="mt-0.5 break-words text-sm font-medium text-muted-foreground">
                {capitalizeWords(content.title)}
              </p>

              {content.replyTo && (
                <p className="mt-1 break-words text-xs text-muted-foreground/50">
                  Reply-To:{" "}
                  <span className="text-muted-foreground/70">
                    {content.replyTo}
                  </span>
                </p>
              )}
            </div>

            <time className="flex-shrink-0 text-xs text-muted-foreground/60 sm:whitespace-nowrap sm:pt-0.5">
              {new Date(timestamp).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </time>
          </div>

          <div className="mb-6 h-px bg-border/60 sm:mb-7" />

          <p className="whitespace-pre-wrap break-words text-[13.5px] leading-[1.85] text-foreground/90">
            {capitalizeWords(content.message)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { notifications, setNotifications } = useNotifications();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [localRead, setLocalRead] = useState({});
  const [pendingRead, setPendingRead] = useState(new Set());
  const [selectedId, setSelectedId] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const isRead = (n) => localRead[n.id] ?? n.mark_read;

  const syncReadToBackend = useCallback(
    async (id) => {
      if (pendingRead.has(id)) return;

      setPendingRead((prev) => new Set(prev).add(id));

      try {
        await api.put(`/notifications/${id}`, { mark_read: true });

        setNotifications?.((prev) =>
          prev.map((n) => (n.id === id ? { ...n, mark_read: true } : n))
        );
      } catch (err) {
        console.error("Failed To Mark Notification As Read:", err);
      } finally {
        setPendingRead((prev) => {
          const s = new Set(prev);
          s.delete(id);
          return s;
        });
      }
    },
    [pendingRead, setNotifications]
  );

const markOneRead = (id) => {
  const notif = notifications.find((n) => n.id === id);
  const alreadyRead = localRead[id] ?? notif?.mark_read;
  if (alreadyRead) return;

  setLocalRead((prev) => ({ ...prev, [id]: true }));
  syncReadToBackend(id);
};
  const filtered = notifications.filter((n) => {
    const q = search.toLowerCase();

    const matchSearch =
      n.content.title.toLowerCase().includes(q) ||
      n.content.message.toLowerCase().includes(q) ||
      n.content.from.toLowerCase().includes(q);

    const matchStatus =
      statusFilter === "all" || (statusFilter === "unread" && !isRead(n));

    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);

  const paginated = filtered.slice(
    (clampedPage - 1) * PAGE_SIZE,
    clampedPage * PAGE_SIZE
  );

  const unreadCount = notifications.filter((n) => !isRead(n)).length;
  const selectedNotif = notifications.find((n) => n.id === selectedId) ?? null;

  const handleSelect = (id) => {
    setSelectedId(id);
    markOneRead(id);
    setShowDetail(true);
  };

  return (
    <div className="flex min-h-[calc(100svh-56px)] w-full flex-col overflow-visible border-t border-border bg-background sm:min-h-[calc(100svh-64px)] md:h-full md:min-h-0 md:flex-row md:overflow-hidden">
      <div
        className={`
          flex w-full flex-col bg-background
          md:w-[300px] md:flex-shrink-0 md:border-r md:border-border/70
          lg:w-[340px]
          ${showDetail ? "hidden md:flex" : "flex"}
        `}
      >
        <div className="flex flex-shrink-0 flex-col gap-3 border-b border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="text-[17px] font-bold tracking-tight text-foreground">
              Inbox
            </span>

            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex w-fit gap-1 rounded-lg bg-muted p-0.5">
            {[
              { label: "All Mail", value: "all" },
              { label: "Unread", value: "unread" },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1 text-[11px] font-semibold transition-all ${
                  statusFilter === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 border-b border-border/70 px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />

            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Messages..."
              className="h-9 rounded-lg border-transparent bg-muted/50 pl-9 text-[13px] transition-all placeholder:text-muted-foreground/50 focus-visible:border-border focus-visible:bg-background focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="flex-1 overflow-visible md:overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-20 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 opacity-20" />
              <p className="text-sm">No Messages Yet</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-20 text-center text-muted-foreground">
              <Search className="h-8 w-8 opacity-20" />
              <p className="text-sm">No Results Found</p>
            </div>
          ) : (
            paginated.map((n) => {
              const read = isRead(n);
              const sel = n.id === selectedId;
              const color = avatarColor(n.content.from);

              return (
                <div
                  key={n.id}
                  onClick={() => handleSelect(n.id)}
                  className={[
                    "group relative cursor-pointer border-b border-border/50 px-4 py-3.5 transition-all",
                    sel
                      ? "border-l-2 border-l-primary bg-primary/5"
                      : !read
                      ? "border-l-2 border-l-primary/30 hover:bg-muted/40"
                      : "border-l-2 border-l-transparent hover:bg-muted/30",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${color}`}
                    >
                      {initials(n.content.from)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center gap-2">
                        <span
                          className={`flex-1 truncate text-[12.5px] ${
                            read
                              ? "font-normal text-muted-foreground"
                              : "font-semibold text-foreground"
                          }`}
                        >
                          {capitalizeWords(n.content.from)}
                        </span>

                        {!read && (
                          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                        )}

                        <span className="flex-shrink-0 text-[10.5px] font-medium text-muted-foreground/50">
                          {formatTimestamp(n.timestamp)}
                        </span>
                      </div>

                      <p
                        className={`mb-1 truncate text-[12px] ${
                          read
                            ? "text-muted-foreground/70"
                            : "font-medium text-foreground/90"
                        }`}
                      >
                        {capitalizeWords(n.content.title)}
                      </p>

                      <p className="line-clamp-2 break-words text-[11.5px] leading-relaxed text-muted-foreground/60">
                        {capitalizeWords(n.content.message)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex flex-shrink-0 flex-col gap-2 border-t border-border/70 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[11px] text-muted-foreground/60">
              {(clampedPage - 1) * PAGE_SIZE + 1}–
              {Math.min(clampedPage * PAGE_SIZE, filtered.length)} Of{" "}
              {filtered.length}
            </span>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-[11px]"
                disabled={clampedPage <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-[11px]"
                disabled={clampedPage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>

      <div
        className={`min-w-0 flex-1 flex-col overflow-visible md:overflow-hidden ${
          showDetail ? "flex" : "hidden md:flex"
        }`}
      >
        <DetailPane
          notification={selectedNotif}
          onBack={() => setShowDetail(false)}
        />
      </div>
    </div>
  );
}
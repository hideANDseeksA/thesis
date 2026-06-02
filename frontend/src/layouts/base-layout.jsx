import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutPanelLeft, LayoutDashboard, Mail, CheckSquare,
  MessageCircle, Calendar, Shield, AlertTriangle, Settings,
  HelpCircle, BookOpen, LayoutTemplate, Users, Stamp,
  ChevronRight, EllipsisVertical, LogOut, BellDot, CircleUser,
  CreditCard, Search, User, Bell, BellOff, Link2, Palette, Heart,
  Sun, Moon, Inbox, Archive, FileText, ClipboardList,
  Baby, Activity, FileBadge, CalendarClock, History,
  ShieldAlert, ScrollText, MessageSquareWarning, NotebookPen,
  FolderArchive, ReceiptText, Clock,
} from "lucide-react"


import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarGroup, SidebarGroupLabel, SidebarProvider, SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

import { useTheme }          from "@/context/ThemeProvider"
import { useAuth }           from "@/auth/AuthContext"
import { useNotifications }  from "@/context/NotificationContext"
import useSystemSettings from '@/hooks/useSystemSettings';


// ─── Internal helpers ─────────────────────────────────────────────────────────

function HelpDialog({ title, description }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Help for ${title}`}
        className="btn-primary inline-flex items-center justify-center h-[18px] w-[18px] rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 hover:bg-accent transition-colors shrink-0"
      >
        <HelpCircle size={12} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm mx-4 rounded-xl bg-background border border-border shadow-xl p-5"
            style={{ animation: "cmdDrop .15s cubic-bezier(.22,1,.36,1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                aria-label="Close"
              >
                <HelpCircle size={16} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setOpen(false)}
                className="text-sm px-4 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
          <style>{`
            @keyframes cmdDrop {
              from { opacity: 0; transform: translateY(-8px) scale(.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  )
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

// ─── Dark-mode toggle (toolbar) ───────────────────────────────────────────────

function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center justify-center rounded-md h-8 w-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}

// ─── Toolbar: Message / Inbox button ─────────────────────────────────────────

export function ToolbarMessageButton({ inboxUrl = "/inbox" }) {
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()

  return (
    <button
      onClick={() => navigate(inboxUrl)}
      aria-label={`Messages${unreadCount > 0 ? `, ${unreadCount > 99 ? "99+" : unreadCount} unread` : ""}`}
      className={[
        "relative inline-flex items-center justify-center",
        "h-9 w-9 sm:h-10 sm:w-10",
        "rounded-full border-none bg-transparent",
        "hover:bg-accent active:scale-95",
        "transition-all duration-150",
        "touch-manipulation",
      ].join(" ")}
    >
      <Mail size={20} className="text-foreground" />

      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className={[
            "absolute top-0.5 right-0.5",
            "flex items-center justify-center",
            "min-w-[18px] h-[18px]",
            "rounded-full px-1",
            "bg-destructive",
            "border-2 border-background",
            "text-[10px] font-semibold text-white leading-none tracking-tight",
          ].join(" ")}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  )
}

// ─── Toolbar: User profile dropdown ──────────────────────────────────────────

export function ToolbarUserProfileButton() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()
  const { resident_data, logout, isLoading } = useAuth()
  const { notificationsEnabled, handleToggleNotifications } = useNotifications()
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"


  const name = resident_data?.resident_name
  ? resident_data.resident_name
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  : "Guest User";

  const email = resident_data?.resident_email ?? "guest@example.com"
  const avatar = undefined

  const handleToggleDark = () => {
    setTheme(isDark ? "light" : "dark")
  }

  const handleLogout = async () => {
    setOpen(false)
    try { await logout(); navigate("/login", { replace: true }) }
    catch (err) { console.error("Logout failed:", err) }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="group relative flex h-9 w-9 items-center justify-center rounded-full outline-none transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="User profile"
        >
          <Avatar className="h-8 w-8 border-2 border-primary shadow-md transition-all duration-300 group-hover:border-primary/80">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 shadow-lg animate-in slide-in-from-top-2 fade-in-0 duration-200"
      >
        <div className="flex items-center gap-3 px-3 py-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-[11px] text-muted-foreground  max-w-[100px]">{email}</p>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5 py-0"
          >
            Online
          </Badge>
        </div>

        <DropdownMenuSeparator />


        

        <div
          role="menuitem"
          tabIndex={0}
          onClick={handleToggleDark}
          onKeyDown={(e) => e.key === "Enter" && handleToggleDark()}
          className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
            {isDark
              ? <Moon size={13} className="text-indigo-400" />
              : <Sun size={13} className="text-amber-500" />
            }
          </div>
          <span className="flex-1">Dark Mode</span>
          <span
            className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${
              isDark ? "bg-indigo-500" : "bg-input"
            }`}
          >
            <span
              className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                isDark ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </span>
        </div>

        <div
          role="menuitem"
          tabIndex={0}
          onClick={handleToggleNotifications}
          onKeyDown={(e) => e.key === "Enter" && handleToggleNotifications()}
          className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
            {notificationsEnabled
              ? <Bell size={13} className="text-primary" />
              : <BellOff size={13} className="text-muted-foreground" />
            }
          </div>
          <span className="flex-1">Notifications</span>
          <span
            className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${
              notificationsEnabled ? "bg-primary" : "bg-input"
            }`}
          >
            <span
              className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                notificationsEnabled ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </span>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer gap-2">
            <Link to="/settings/account">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
                <CircleUser size={13} />
              </div>
              <span className="text-sm">Account</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer gap-2">
            <Link to="/settings/billing">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
                <CreditCard size={13} />
              </div>
              <span className="text-sm">Billing</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer gap-2">
            <Link to="/settings/notifications">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
                <BellDot size={13} />
              </div>
              <span className="text-sm">Notification Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer gap-2 group/logout text-destructive focus:text-destructive focus:bg-destructive/10 transition-all duration-150"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-destructive/10 transition-colors duration-150 group-hover/logout:bg-destructive/20">
            <LogOut size={13} className="text-destructive" />
          </div>
          <span className="text-sm font-medium">
            {isLoading ? "Logging out…" : "Log out"}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Nav config ───────────────────────────────────────────────────────────────
export const NAV_GROUPS = [
  {
    label: "Dashboards",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Residents Management",
    items: [
      { title: "Resident List",      url: "/resident-list",      icon: Users },
      { title: "BDAC Records",       url: "/bdac-list",          icon: ClipboardList },
      { title: "Archived Residents", url: "/archive-resident",   icon: FolderArchive },
    ],
  },
  {
    label: "Health & Pregnant Monitoring",
    items: [
      { title: "Health Records",   url: "/health-records",   icon: Activity },
      { title: "Pregnant Records", url: "/pregnant-records", icon: Baby },
    ],
  },
  {
    label: "Certificates",
    items: [
      { title: "Certificate List", url: "/certificates/list", icon: FileBadge },
      {
        title: "Transactions", url: "#", icon: ReceiptText,
        items: [
          { title: "Appointments",    url: "/certificates/appointment" },
          { title: "Online Requests", url: "/certificates/online-request" },
        ],
      },
      { title: "Certificate History", url: "/certificates/history", icon: History },
    ],
  },
  {
    label: "Complaints & Blotters",
    items: [
      { title: "Complaints", url: "/complaints",           icon: MessageSquareWarning },
      { title: "Blotters",   url: "/blotter/blotter-list", icon: NotebookPen },
    ],
  },
  {
    label: "Others",
    items: [
           { title: "Documents", url: "/documents", icon: FileText },
      { title: "Messages",  url: "/messages",  icon: MessageCircle },
       { title: "Settings",  url: "/settings",  icon: Settings },
    ],
  },
]



// ─── Command search ───────────────────────────────────────────────────────────

export const SEARCH_ITEMS = [
  { title: "Dashboard",           url: "/dashboard",                         group: "Dashboards", icon: LayoutDashboard },
  { title: "Resident List",      url: "/resident-list",                 group: "Residents Management", icon: Users },
  { title: "BDAC Records",       url: "/bdac-list",                     group: "Residents Management", icon: ClipboardList },
  { title: "Archived Residents", url: "/archive-resident",               group: "Residents Management", icon: FolderArchive },
  { title: "Health Records",   url: "/health-records",                 group: "Health & Pregnant Monitoring", icon: Activity },
  { title: "Pregnant Records", url: "/pregnant-records",               group: "Health & Pregnant Monitoring", icon: Baby },
  { title: "Certificate List", url: "/certificates/list",              group: "Certificates", icon: FileBadge },
  { title: "Appointments",    url: "/certificates/appointment",      group: "Certificates", icon: CalendarClock },
  { title: "Online Requests", url: "/certificates/online-request", group: "Certificates", icon: Link2 },
  { title: "Certificate History", url: "/certificates/history",       group: "Certificates", icon: History },
  { title: "Complaints", url: "/complaints",                     group: "Complaints & Blotters", icon: MessageSquareWarning },
  { title: "Blotters",   url: "/blotter/blotter-list",           group: "Complaints & Blotters", icon: NotebookPen },
  { title: "Settings",  url: "/settings",                       group: "Others", icon: Settings },
  { title: "Messages",  url: "/messages",                       group: "Others", icon: MessageCircle },
  { title: "Documents", url: "/documents",                      group: "Others", icon: FileText },


]

export function CommandSearch({ open, onOpenChange }) {
  const navigate = useNavigate()
  const [query, setQuery] = React.useState("")
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    if (open) {
      setQuery("")
      setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [open])

  const grouped = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const source = q
      ? SEARCH_ITEMS.filter(
          (i) => i.title.toLowerCase().includes(q) || i.group.toLowerCase().includes(q)
        )
      : SEARCH_ITEMS
    return source.reduce((acc, item) => {
      ;(acc[item.group] ??= []).push(item)
      return acc
    }, {})
  }, [query])

  const handleSelect = (url) => {
    navigate(url)
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[12vh]"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-[640px] mx-4 rounded-xl overflow-hidden shadow-2xl border border-border bg-background"
        style={{ animation: "cmdDrop .15s cubic-bezier(.22,1,.36,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you need?"
            className="flex-1 h-12 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            onKeyDown={(e) => e.key === "Escape" && onOpenChange(false)}
          />
          <kbd className="hidden sm:flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto pb-2">
          {Object.keys(grouped).length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="px-2 pt-2">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group}
                </p>
                {items.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.url}
                      onClick={() => handleSelect(item.url)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer border-none bg-transparent"
                    >
                      <Icon size={14} className="text-muted-foreground shrink-0" />
                      <span>{item.title}</span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes cmdDrop {
          from { opacity: 0; transform: translateY(-10px) scale(.98); }
          to   { opacity: 1; transform: translateY(0)     scale(1);   }
        }
      `}</style>
    </div>
  )
}

export function SearchTrigger({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-input bg-background text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm relative w-full justify-start sm:pr-12 md:w-36 lg:w-56"
    >
      <Search size={13} className="shrink-0" />
      <span>Search...</span>
      <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden sm:flex items-center gap-1 h-5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  )
}

// ─── Nav main ─────────────────────────────────────────────────────────────────

// Active styles derived directly from CSS custom properties (mirrors .btn-primary)
const activeStyle = {
  backgroundColor: "hsl(var(--primary))",
  color:           "hsl(var(--primary-foreground))",
  outline:         "2px solid transparent",
  outlineOffset:   "2px",
  boxShadow:       "0 0 0 2px hsl(var(--ring))",
}

const parentActiveStyle = {
  backgroundColor: "hsl(var(--primary) / 0.12)",
  color:           "hsl(var(--primary))",
}

export function NavMain({ label, items }) {
  const location = useLocation()

  const shouldBeOpen = (item) =>
    item.isActive || item.items?.some((s) => location.pathname === s.url) || false

  const isParentActive = (item) =>
    item.items?.some((s) => location.pathname === s.url) || false

  return (
    <SidebarGroup >
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const parentActive = isParentActive(item)
          const leafActive   = !item.items?.length && location.pathname === item.url

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={shouldBeOpen(item)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className="cursor-pointer transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
                        style={parentActive ? parentActiveStyle : undefined}
                      >
                        {item.icon && (
                          <item.icon
                            style={parentActive
                              ? { color: "hsl(var(--primary))" }
                              : undefined}
                          />
                        )}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((sub) => {
                          const subActive = location.pathname === sub.url
                          return (
                            <SidebarMenuSubItem key={sub.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={subActive}
                                className="cursor-pointer transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
                                style={subActive ? activeStyle : undefined}
                              >
                                <Link
                                  to={sub.url}
                                  target={["Auth Pages", "Errors"].includes(item.title) ? "_blank" : undefined}
                                  rel={["Auth Pages", "Errors"].includes(item.title) ? "noopener noreferrer" : undefined}
                                >
                                  <span>{sub.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : (
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={leafActive}
                    className="cursor-pointer transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
                    style={leafActive ? activeStyle : undefined}
                  >
                    <Link to={item.url}>
                      {item.icon && (
                        <item.icon
                          style={leafActive
                            ? { color: "hsl(var(--primary-foreground))" }
                            : undefined}
                        />
                      )}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

// ─── Nav user (sidebar footer) ────────────────────────────────────────────────

export function NavUser({ user }) {
  const { isMobile } = useSidebar()
  const { resident_data, logout, isLoading } = useAuth()
  const { notificationsEnabled, handleToggleNotifications } = useNotifications()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const isDark = theme === "dark"

 const name = resident_data?.resident_name
  ? resident_data.resident_name
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  : "Guest User";

  const email = user?.email ?? resident_data?.resident_email ?? "guest@example.com"
  const initials = getInitials(name)

  const handleToggleDark = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.avatar} alt={name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs text-muted-foreground  max-w-[100px]">{email}</span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

       <DropdownMenuContent
  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
  side={isMobile ? "bottom" : "right"}
  align="end"
  sideOffset={4}
>
  <DropdownMenuLabel className="p-0 font-normal">
    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={user?.avatar} />
        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{name}</span>
        <span className="truncate text-xs text-muted-foreground">{email}</span>
      </div>
      <Badge
        variant="outline"
        className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5 py-0"
      >
        Online
      </Badge>
    </div>
  </DropdownMenuLabel>

  <DropdownMenuSeparator />

  {/* ✅ Dashboard shortcut for resident users */}
  <DropdownMenuItem
    className="cursor-pointer gap-2"
    onClick={() => navigate("/resident/dashboard")}
  >
    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
      <LayoutDashboard size={13} className="text-primary" />
    </div>
    <span className="text-sm font-medium">Profile Dahsboard</span>
  </DropdownMenuItem>

  <DropdownMenuSeparator />

  <div
    role="menuitem"
    tabIndex={0}
    onClick={handleToggleDark}
    onKeyDown={(e) => e.key === "Enter" && handleToggleDark()}
    className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
  >
    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
      {isDark
        ? <Moon size={13} className="text-indigo-400" />
        : <Sun size={13} className="text-amber-500" />
      }
    </div>
    <span className="flex-1">Dark Mode</span>
    <span className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${isDark ? "bg-indigo-500" : "bg-input"}`}>
      <span className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg transition-transform ${isDark ? "translate-x-4" : "translate-x-0"}`} />
    </span>
  </div>

  <div
    role="menuitem"
    tabIndex={0}
    onClick={handleToggleNotifications}
    onKeyDown={(e) => e.key === "Enter" && handleToggleNotifications()}
    className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
  >
    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
      {notificationsEnabled
        ? <Bell size={13} className="text-primary" />
        : <BellOff size={13} className="text-muted-foreground" />
      }
    </div>
    <span className="flex-1">Notifications</span>
    <span className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${notificationsEnabled ? "bg-primary" : "bg-input"}`}>
      <span className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg transition-transform ${notificationsEnabled ? "translate-x-4" : "translate-x-0"}`} />
    </span>
  </div>

  <DropdownMenuSeparator />

  <DropdownMenuItem
    className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
    onClick={async () => {
      try { await logout(); navigate("/login") }
      catch (err) { console.error("Logout failed:", err) }
    }}
  >
    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-destructive/10">
      <LogOut size={13} className="text-destructive" />
    </div>
    <span className="text-sm font-medium">
      {isLoading ? "Logging out…" : "Log out"}
    </span>
  </DropdownMenuItem>
</DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// ─── App sidebar ──────────────────────────────────────────────────────────────

export function AppSidebar({ nav = NAV_GROUPS, brand, ...props }) {
  const { resident_data } = useAuth()
  const settings = useSystemSettings();
  const avatarStyle = "identicon"
  const avatar = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${encodeURIComponent(resident_data?.resident_email ?? "guest")}`

  const navUser = {
    name:   resident_data?.resident_name  ?? brand?.name  ?? "User",
    email:  resident_data?.resident_email ?? brand?.email ?? "guest@example.com",
    avatar,
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={settings?.appName ?? "SmartBarangay"}>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                   <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-primary shrink-0">
            <img
              src={settings?.logoUrl || "/image/image.png"}
              alt="Logo"
              className="h-full w-full object-cover"
            />
          </div>

                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">
                    {settings?.appName ?? "SmartBarangay"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    { "Brgy. Lag-on " }
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {nav.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

// ─── Site header ──────────────────────────────────────────────────────────────

export function SiteHeader({ navLinks, inboxUrl = "/messages" }) {
  const [searchOpen, setSearchOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex w-full items-center gap-2 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1 cursor-pointer" />

          <Separator
            orientation="vertical"
            className="mx-1 h-4 data-[orientation=vertical]:h-4"
          />

          {/* Search: icon-only on mobile, full bar on md+ */}
          <div className="flex-1 max-w-sm hidden sm:block">
            <SearchTrigger onClick={() => setSearchOpen(true)} />
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="sm:hidden inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent transition-colors touch-manipulation"
          >
            <Search size={18} className="text-foreground" />
          </button>

          <div className="ml-auto flex items-center gap-1">
            {/* Inbox button with highlighted count badge */}
            <ToolbarMessageButton inboxUrl={inboxUrl} />
          </div>
        </div>
      </header>

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}

// ─── Site footer ──────────────────────────────────────────────────────────────

export function SiteFooter({ brand }) {
  return (
    <footer className="border-t border-border bg-background">
      <div className="px-4 py-6 lg:px-6">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            <span>by</span>
            
            <a      
              href="https://shadcnstore.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
                >
              {brand?.name ?? "Fork Force"} Team
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            {brand?.footerSub ??
              "Building better communities through technology. © 2026 All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Base layout ──────────────────────────────────────────────────────────────

function LayoutShell({ children, title,helpText, description, brand, navLinks, inboxUrl }) {
  const { state, isMobile } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <SidebarInset
      className="flex flex-1 flex-col min-w-0 overflow-hidden"
 style={
        isMobile
          ? { margin: 0 }
          : {
              marginLeft: collapsed
                ? 10
                : "var(--sidebar-width)",
               
              transition: "margin-left 200ms ease-linear",
            }
      }
    >
      <SiteHeader navLinks={navLinks} inboxUrl={inboxUrl} />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 px-4 py-4 md:px-6 md:gap-6 md:py-6">
        {(title || description) && (
    <div>
      {title && (
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {helpText && (
            <HelpDialog title={title} description={helpText} />
          )}
        </div>
      )}
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  )}
            {children}
          </div>
        </div>
      </div>

      <SiteFooter brand={brand} />
    </SidebarInset>
  )
}

export function BaseLayout({
  children,
  title,
  description,
   helpText, 
  nav = NAV_GROUPS,
  brand,
  navLinks,
  inboxUrl = "/messages",
}) {
  return (
    <SidebarProvider
      defaultOpen={true}
      style={{
        "--sidebar-width":      "14rem",
        "--sidebar-width-icon": "2.5rem",
        "--header-height":      "3rem",
       
      }}
    >
      <AppSidebar side="left" variant="inset" nav={nav} brand={brand} />
      <LayoutShell
        title={title}
        helpText={helpText}
        description={description}
        brand={brand}
        navLinks={navLinks}
        inboxUrl={inboxUrl}
      >
        {children}
      </LayoutShell>
    </SidebarProvider>
  )
}

export default BaseLayout
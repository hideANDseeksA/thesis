import React, { useEffect, useRef, useState } from 'react';
import { Bell, Search, Menu, X, LogOut, Sun, Moon, Mail, ScrollText, FileText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuGroup,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeProvider';
import useSystemSettings from '@/hooks/useSystemSettings';
import { capitalizeWords } from '@/lib/capitalizer';
import { clearStorage } from '@/utils/localStorageHelper';
import { useSearchContext } from '@/context/SearchContext';
import MaleProfile from '@/assets/image/boy.png';
import WomanProfile from '@/assets/image/woman.png';
import {
    useNotifications,
    getInitials,
    formatTimestamp,
} from '@/context/NotificationContext';
import { useAuth } from '@/auth/AuthContext';
import ComplaintFormDialog from './client/ComplaintForm';
import { IconGavel, IconFileTextAi } from '@tabler/icons-react';
import { clearAccessToken } from '@/lib/tokenService';
import WalkthroughOverlay from '@/context/WalkthroughOverlay'; // adjust path if needed

const DASHBOARD_WALKTHROUGH_KEY = 'dashboard_walkthrough_done'

const mainNavItems = [
    { name: 'Home', path: '/', end: true },
    { name: 'Service', path: '/#services' },
    { name: 'Community leaders', path: '/#officials' },
    { name: 'About Us', path: '/#about' },
    { name: 'Explore now', path: '/login', end: true },
];

const subNavItems = [
    { name: 'Dashboard', path: '/resident/dashboard' },
    { name: 'Certificates', path: '/resident/certificates' },
    { name: 'Documents', path: '/resident/documents' },
    { name: 'Transactions', path: '/resident/transactions' },
];

const NOTIF_PREVIEW_LIMIT = 5;

// ── Floating Action Button ────────────────────────────────────────────────────
function FloatingActionButton({ fabRef }) {
    const [isOpen, setIsOpen] = useState(false);
    const [openComplaint, setOpenComplaint] = useState(false);
    const navigate = useNavigate();

    const actions = [
        {
            id: 'complaint',
            label: 'File Complaint',
            icon: IconFileTextAi,
            color: 'text-rose-500',
            bg: 'bg-rose-50 dark:bg-rose-950/40',
            border: 'border-rose-200 dark:border-rose-800',
            onClick: () => { setOpenComplaint(true); setIsOpen(false); },
        },
        {
            id: 'certificates',
            label: 'Request Certificate',
            icon: ScrollText,
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-950/40',
            border: 'border-blue-200 dark:border-blue-800',
            onClick: () => { navigate('/resident/certificates'); setIsOpen(false); },
        },
        {
            id: 'documents',
            label: 'View Documents',
            icon: FileText,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-950/40',
            border: 'border-emerald-200 dark:border-emerald-800',
            onClick: () => { navigate('/resident/documents'); setIsOpen(false); },
        },
    ];

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
                {isOpen && (
                    <div className="flex flex-col items-end gap-2 mb-1">
                        {actions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.id}
                                    onClick={action.onClick}
                                    className={`
                                        flex items-center gap-2 pl-3 pr-4 py-2 rounded-full
                                        border shadow-md text-sm font-medium
                                        transition-all duration-150 cursor-pointer
                                        ${action.bg} ${action.border} ${action.color}
                                        hover:shadow-lg active:scale-95
                                    `}
                                >
                                    <Icon size={16} />
                                    <span>{action.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                <button
                    ref={fabRef}
                    onClick={() => setIsOpen(!isOpen)}
                    className="btn-primary flex items-center justify-center w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                >
                    {isOpen
                        ? <X className="w-5 h-5" />
                        : <Zap className="w-5 h-5" />
                    }
                </button>
            </div>

            {openComplaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-md lg:max-w-xl">
                        <ComplaintFormDialog
                            open={openComplaint}
                            onClose={() => setOpenComplaint(false)}
                            onSubmitSuccess={() => setOpenComplaint(false)}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

// ── Main Navbar ───────────────────────────────────────────────────────────────
const ModernNavbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const {
        resident_data,
        isLoggedIn,
        logout,
    } = useAuth();

    const handleLogout = async (e) => {
        e?.preventDefault();
        await logout();
        navigate('/login');
        clearStorage();
        clearAccessToken();
    };

    const [openComplaint, setOpenComplaint] = useState(false);
    const data = resident_data || {};

    const openComplaintModal = () => setOpenComplaint(true);
    const closeComplaintModal = () => setOpenComplaint(false);

    const { searchQuery, setSearchQuery } = useSearchContext();
    const navigate = useNavigate();
    const location = useLocation();

    const { theme, setTheme } = useTheme();
    const settings = useSystemSettings();
    const isDark = theme === 'dark';

    const isOnResidentPath = location.pathname.startsWith('/resident');
    const isOnDashboard = location.pathname === '/resident/dashboard';

    const {
        notifications,
        unreadCount,
        notificationsEnabled,
        handleToggleNotifications,
        dismissNotification,
    } = useNotifications();

    const previewNotifications = notifications.slice(0, NOTIF_PREVIEW_LIMIT);
    const hasMore = notifications.length > NOTIF_PREVIEW_LIMIT;

    // ── Walkthrough ─────────────────────────────────────────────────────────
    const [wtActive, setWtActive] = useState(false)
    const [wtStep,   setWtStep]   = useState(0)
    const [isMobile, setIsMobile] = useState(false)

    const subNavRef   = useRef(null)  // desktop sub-nav bar
    const menuBtnRef  = useRef(null)  // mobile hamburger button
    const notifBtnRef = useRef(null)  // messages bell
    const userMenuRef = useRef(null)  // avatar / user menu
    const fabRef      = useRef(null)  // floating action button

    // Track mobile breakpoint (matches Tailwind lg = 1024px)
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1023px)')
        setIsMobile(mq.matches)
        const handler = (e) => setIsMobile(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    // Show walkthrough once on dashboard
    useEffect(() => {
        if (!isLoggedIn || !isOnDashboard) return
        const done = localStorage.getItem(DASHBOARD_WALKTHROUGH_KEY)
        if (done) return
        const t = setTimeout(() => setWtActive(true), 700)
        return () => clearTimeout(t)
    }, [isLoggedIn, isOnDashboard])

    const wtFinish = () => {
        localStorage.setItem(DASHBOARD_WALKTHROUGH_KEY, 'true')
        setWtActive(false)
        setWtStep(0)
    }

    // Build steps depending on whether we're on mobile or desktop.
    // On mobile: sub-nav is hidden (max-lg:hidden), so we point to the
    // hamburger menu button instead. On desktop: point to the sub-nav bar.
    const walkthroughSteps = [
        {
            targetRef: { current: null }, // centered welcome card — no spotlight
            title: "Welcome to your Dashboard 👋",
            text: `Hi ${capitalizeWords(data?.resident_name) || 'there'}! This is your resident portal. Let's quickly show you around.`,
        },
        isMobile
            ? {
                targetRef: menuBtnRef,
                title: "Your navigation menu",
                text: "Tap this button to access all sections — Dashboard, Certificates, Documents, and Transactions.",
                placement: 'bottom',
              }
            : {
                targetRef: subNavRef,
                title: "Your main menu",
                text: "Use these tabs to navigate between your Dashboard, Certificates, Documents, and Transactions.",
                placement: 'bottom',
              },
        {
            targetRef: notifBtnRef,
            title: "Messages & notifications",
            text: "Check your messages and updates from the barangay here. A red dot means you have something new.",
            placement: 'bottom',
        },
        {
            targetRef: userMenuRef,
            title: "Your account",
            text: "Click your avatar to switch themes, manage notification settings, file a complaint, or log out.",
            placement: 'bottom',
        },
        {
            targetRef: fabRef,
            title: "Quick actions ⚡",
            text: "Tap this button anytime to quickly file a complaint, request a certificate, or view documents — without leaving the page.",
            placement: 'top',
        },
    ]
    // ────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (location.hash) {
            const id = location.hash.substring(1);
            setTimeout(() => {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else if (location.pathname === '/') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [location]);

    const handleSectionClick = (e, path) => {
        if (path === '/') {
            if (window.location.pathname !== '/') navigate('/');
            else window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        if (path.startsWith('/#')) {
            e.preventDefault();
            navigate(`/#${path.substring(2)}`);
        }
    };

    const isNavItemActive = (itemPath) => {
        if (itemPath === '/') return location.pathname === '/' && !location.hash;
        if (itemPath.startsWith('/#'))
            return location.pathname === '/' && location.hash === itemPath.substring(1);
        return location.pathname === itemPath;
    };

    return (
        <>
            {/* ── Dashboard walkthrough ─────────────────────────────────────── */}
            <WalkthroughOverlay
                active={wtActive}
                step={wtStep}
                steps={walkthroughSteps}
                onNext={() => setWtStep((s) => s + 1)}
                onSkip={wtFinish}
                onFinish={wtFinish}
            />

            <nav className="bg-background sticky top-0 z-50 h-14 sm:h-16 lg:h-[8vh] min-h-[56px] max-h-[72px]">

                {/* Top Navigation */}
                <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 lg:px-6">

                    {/* Logo */}
                    <a href="/" onClick={(e) => handleSectionClick(e, '/')}>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <img
                                src={settings?.logoUrl || "/image/image.png"}
                                alt="App Logo"
                                className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
                            />
                            <span className="text-lg sm:text-xl font-semibold max-sm:hidden">
                                {settings?.appName || 'SmartBarangay'}
                            </span>
                        </div>
                    </a>

                    {/* Desktop Main Navigation */}
                    <NavigationMenu className="group/navigation-menu relative flex max-w-max flex-1 items-center justify-center max-lg:hidden">
                        <NavigationMenuList className="group flex flex-1 list-none items-center justify-center gap-4 xl:gap-10">
                            {mainNavItems.map((item) => (
                                <NavigationMenuItem key={item.name}>
                                    <NavLink
                                        to={item.path}
                                        onClick={(e) => handleSectionClick(e, item.path)}
                                        className={`inline-flex h-9 w-max items-center justify-center rounded-md px-3 xl:px-4 py-2 text-sm font-medium transition-colors ${isNavItemActive(item.path)
                                            ? 'btn-primary text-primary-foreground'
                                            : 'hover:bg-accent hover:text-accent-foreground'
                                            }`}
                                    >
                                        {item.name}
                                    </NavLink>
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4">

                        {isLoggedIn && (
                            <>
                                {/* ── Messages dropdown ── */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            ref={notifBtnRef}
                                            variant="outline"
                                            size="icon"
                                            className="relative h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
                                        >
                                            <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                                            {unreadCount > 0 && (
                                                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-destructive" />
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end" className="p-0 w-[calc(100vw-2rem)] sm:w-[380px] md:w-[420px]">
                                        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3">
                                            <span className="text-xs sm:text-sm font-semibold uppercase text-muted-foreground">
                                                Messages
                                            </span>
                                            <Badge className="bg-primary/10 text-primary font-normal text-xs">
                                                {unreadCount} New
                                            </Badge>
                                        </div>
                                        <Separator />

                                        <div className="overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                    No messages yet
                                                </div>
                                            ) : (
                                                previewNotifications.map((notif, idx) => (
                                                    <React.Fragment key={notif.id ?? idx}>
                                                        <DropdownMenuItem
                                                            className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 focus:bg-accent cursor-pointer"
                                                            onClick={() => navigate(`/resident/notifications`)}
                                                        >
                                                            <Avatar className="size-8 sm:size-9 shrink-0">
                                                                <AvatarFallback>
                                                                    {getInitials(notif.content?.from)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-1 flex-col min-w-0 justify-center">
                                                                <span className="truncate text-xs sm:text-sm font-medium leading-tight">
                                                                    {notif.content?.title}
                                                                </span>
                                                                <span className="truncate text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                                                                    {notif.content?.message}
                                                                </span>
                                                                <div className="mt-0.5 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                                                    <span className="truncate">From: {notif.content?.from}</span>
                                                                    {notif.timestamp && (
                                                                        <>
                                                                            <span className="size-1 rounded-full bg-muted shrink-0" />
                                                                            <span className="whitespace-nowrap">
                                                                                {formatTimestamp(notif.timestamp)}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                                                {!notif.mark_read && (
                                                                    <span className="size-1.5 rounded-full bg-primary" />
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-6 hover:bg-accent/50"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        dismissNotification(notif.id, notif.mark_read);
                                                                    }}
                                                                >
                                                                    <X className="size-3 sm:size-3.5 text-muted-foreground" />
                                                                </Button>
                                                            </div>
                                                        </DropdownMenuItem>
                                                        {idx < previewNotifications.length - 1 && <Separator />}
                                                    </React.Fragment>
                                                ))
                                            )}
                                        </div>

                                        {hasMore && (
                                            <>
                                                <Separator />
                                                <button
                                                    className="w-full px-4 py-2.5 text-xs sm:text-sm text-center text-primary font-medium hover:bg-accent transition-colors"
                                                    onClick={() => navigate('/resident/notifications')}
                                                >
                                                    Show all {notifications.length} messages
                                                </button>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* ── User menu ── */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            ref={userMenuRef}
                                            variant="ghost"
                                            className="hover:bg-accent hover:text-accent-foreground h-8 w-8 sm:h-9 sm:w-9 md:h-full rounded-lg p-0"
                                        >
                                            <Avatar className="size-8 sm:size-9 md:size-9.5 rounded-lg">
                                                <AvatarImage
                                                    src={data?.resident_sex === 'male' ? MaleProfile : WomanProfile}
                                                    alt={data?.resident_name || 'Avatar'}
                                                />
                                                <AvatarFallback>JD</AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent className="w-[calc(100vw-2rem)] sm:w-[320px] md:w-80" align="end">
                                        <DropdownMenuLabel className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2 sm:py-2.5 font-normal">
                                            <Avatar className="size-9 sm:size-10 shrink-0">
                                                <AvatarImage
                                                    src={data?.resident_sex === 'male' ? MaleProfile : WomanProfile}
                                                    alt={data?.resident_name || 'Avatar'}
                                                />
                                                <AvatarFallback>JD</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-1 flex-col items-start min-w-0">
                                                <span className="text-foreground text-sm sm:text-base md:text-lg font-semibold truncate w-full">
                                                    {capitalizeWords(data?.resident_name)}
                                                </span>
                                                <span className="text-muted-foreground text-xs sm:text-sm md:text-base truncate w-full">
                                                    {data?.resident_email}
                                                </span>
                                            </div>
                                        </DropdownMenuLabel>

                                        <DropdownMenuSeparator />
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem
                                                className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base gap-2 cursor-pointer"
                                                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                                            >
                                                {isDark ? (
                                                    <><Sun className="size-4 sm:size-5 shrink-0" /><span>Light Mode</span></>
                                                ) : (
                                                    <><Moon className="size-4 sm:size-5 shrink-0" /><span>Dark Mode</span></>
                                                )}
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>

                                        <DropdownMenuGroup>
                                            <DropdownMenuItem
                                                className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base gap-2 cursor-pointer"
                                                onClick={handleToggleNotifications}
                                            >
                                                <Bell className="size-4 sm:size-5 shrink-0" />
                                                <span>{notificationsEnabled ? 'Disable Notification' : 'Enable Notification'}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                            variant="destructive"
                                            className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base gap-2 cursor-pointer"
                                            onClick={openComplaintModal}
                                        >
                                            <IconFileTextAi className="size-4 sm:size-5 shrink-0" />
                                            <span>Complaint</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            variant="destructive"
                                            className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base gap-2 cursor-pointer"
                                            onClick={handleLogout}
                                        >
                                            <LogOut className="size-4 sm:size-5 shrink-0" />
                                            <span>Logout</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        )}

                        {/* ── Mobile hamburger menu — ref for walkthrough on mobile ── */}
                        <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <DropdownMenuTrigger asChild className="lg:hidden">
                                <Button
                                    ref={menuBtnRef}
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 sm:h-9 sm:w-9"
                                >
                                    <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                                    <span className="sr-only">Menu</span>
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent className="w-56" align="end">
                                {mainNavItems.map((item, idx) => (
                                    <React.Fragment key={item.name}>
                                        <DropdownMenuItem asChild>
                                            <NavLink
                                                to={item.path}
                                                onClick={(e) => {
                                                    handleSectionClick(e, item.path);
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                {item.name}
                                            </NavLink>
                                        </DropdownMenuItem>
                                        {idx === 3 && <DropdownMenuSeparator />}
                                    </React.Fragment>
                                ))}

                                {isLoggedIn && (
                                    <>
                                        <DropdownMenuSeparator />
                                        {subNavItems.map((item) => (
                                            <DropdownMenuItem key={item.name} asChild>
                                                <NavLink
                                                    to={item.path}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="cursor-pointer"
                                                >
                                                    {item.name}
                                                </NavLink>
                                            </DropdownMenuItem>
                                        ))}
                                    </>
                                )}

                                {isLoggedIn && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <div className="px-3 py-2">
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                    <Search className="w-4 h-4" />
                                                </span>
                                                <Input
                                                    className="pl-9"
                                                    placeholder="Search..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Sub Navigation — desktop only, ref for walkthrough */}
                {isLoggedIn && isOnResidentPath && (
                    <>
                        <Separator className="max-lg:hidden" />
                        <div
                            ref={subNavRef}
                            className="mx-auto flex max-w-7xl items-center justify-between gap-4 xl:gap-8 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 max-lg:hidden bg-background overflow-x-auto"
                        >
                            <div className="flex items-center gap-4 xl:gap-10 font-medium flex-nowrap">
                                {subNavItems.map((item) => (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `inline-flex h-9 items-center rounded-md px-3 xl:px-4 text-sm font-medium transition-colors whitespace-nowrap ${isActive
                                                ? 'btn-primary'
                                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                            }`
                                        }
                                    >
                                        {item.name}
                                    </NavLink>
                                ))}
                            </div>

                            <div className="text-muted-foreground flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                <Input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-32 xl:w-auto"
                                />
                                <Button size="icon" className="btn-primary h-9 w-9 aspect-square p-0 flex-shrink-0">
                                    <Search className="h-4 w-4" />
                                    <span className="sr-only">Search</span>
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </nav>

            {isLoggedIn && isOnResidentPath && <FloatingActionButton fabRef={fabRef} />}

            {openComplaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-md lg:max-w-xl">
                        <ComplaintFormDialog
                            open={openComplaint}
                            onClose={closeComplaintModal}
                            onSubmitSuccess={() => console.log("done!")}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default ModernNavbar;
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  FileText,
  Users,
  Bell,
  Shield,
  Calendar,
  FileBadge,
  MessageSquareWarning,
  Clock,
  Smartphone,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import { useWebsiteStats } from '@/hooks/useWebsiteStats';
import { Link } from 'react-router-dom';

export default function SmartBarangayLanding() {
  const [api, setApi] = useState(null);
  const { data, loading, error } = useWebsiteStats();

  useEffect(() => {
    if (!api) return;
    const intervalId = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 3000);
    return () => clearInterval(intervalId);
  }, [api]);

  function formatVisitors(n) {
    if (n >= 1000) {
      return (n / 1000).toString().replace(/\.0$/, '') + 'K';
    }
    return n.toString();
  }

  const residentServices = [
    {
      icon: <FileText className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Public Documents",
      description: "View and download posted ordinances, barangay budgets, resolutions, and public notices anytime.",
      color: "from-blue-500 to-indigo-600",
      badge: "Open Access",
      href: "/resident/documents",
      cta: "Browse documents",
    },
    {
      icon: <FileBadge className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Certificate Requests",
      description: "Request barangay clearance, residency certificates, and indigency certificates online — no queuing required.",
      color: "from-emerald-500 to-teal-600",
      badge: "24-hr Processing",
      href: "/resident/certificates",
      cta: "Request a certificate",
    },
    {
      icon: <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Track Certificate Status",
      description: "Monitor the progress of your certificate request in real time — from submission to approval and ready for release.",
      color: "from-sky-500 to-cyan-600",
      badge: "Live Tracking",
      href: "/resident/transactions",
      cta: "Track my request",
    },
    {
      icon: <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Certificate Appointments",
      description: "Book an appointment to submit the required documents for your certificate request — so staff can verify and process them on your scheduled visit.",
      color: "from-amber-500 to-orange-600",
      badge: "Requirements Submission",
      href: "/resident/certificates",
      cta: "Book an appointment",
    },
    {
      icon: <MessageSquareWarning className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Submit Complaints",
      description: "File complaints or concerns directly to barangay officials and track the real-time status of your submission.",
      color: "from-rose-500 to-red-600",
      badge: "Track Status",
      href: "/resident/dashboard",
      cta: "File a complaint",
    },
    {
      icon: <Bell className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Real-time Notifications",
      description: "Get instant alerts when your complaint is reviewed or your certificate request is approved, ready, or needs follow-up.",
      color: "from-violet-500 to-purple-600",
      badge: "Instant Alerts",
      href: "/resident/notifications",
      cta: "View notifications",
    },
  ];

  const highlights = [
    {
      icon: <Clock className="w-5 h-5" />,
      title: "24/7 self-service access",
      description: "Request documents and book appointments any time of day — no need to visit the barangay hall during office hours.",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      title: "Track your requests",
      description: "Get status notifications as your certificate request or complaint moves through the review and approval process.",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Secure & private",
      description: "Your personal data is protected with industry-standard encryption. Only authorized barangay staff can access your records.",
      bg: "bg-violet-50 dark:bg-violet-950/30",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Community-first design",
      description: "Built for every resident — simple enough for seniors, accessible on low-end mobile devices, and available in Filipino.",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  const officials = [
    {
      name: "Hon. Maria Santos",
      position: "Barangay Captain",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    },
    {
      name: "Hon. Juan Dela Cruz",
      position: "Barangay Kagawad",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
    },
    {
      name: "Hon. Ana Reyes",
      position: "Barangay Kagawad",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
    },
    {
      name: "Hon. Pedro Garcia",
      position: "Barangay Treasurer",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    },
    {
      name: "Hon. Rosa Mendoza",
      position: "Barangay Secretary",
      image: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop",
    },
  ];

  if (loading) return null;
  if (error) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section id="home" className="pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <div className="inline-block">
                <span className="btn-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                  Digital Barangay Services
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent">
                  Connecting Communities,
                </span>
                <br />
                <span className="bg-gradient-to-r from-slate-900 to-blue-900 dark:from-slate-100 dark:to-blue-100 bg-clip-text text-transparent">
                  Empowering Lives
                </span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                SmartBarangay brings government services to your fingertips. Access documents,
                connect with officials, and stay informed about your community—all in one platform.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4">
                <Link
                  to="/signup"
                  className="btn-primary px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold text-base sm:text-lg hover:opacity-90 text-center"
                >
                  Create Account
                </Link>
                <Link
                  to="/announcements"
                  className="bg-background text-primary px-6 sm:px-8 py-3 sm:py-4 rounded-full border-2 border-primary hover:bg-accent transition-all duration-300 font-semibold text-base sm:text-lg text-center"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl blur-3xl opacity-20 dark:opacity-10 animate-pulse"></div>
              <div className="relative bg-card rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 border">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm sm:text-base truncate">Quick Document Request</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Processing in 24 hours</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 sm:p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm sm:text-base truncate">Real-time Notifications</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Stay updated instantly</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm sm:text-base truncate">Secure & Private</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Your data is protected</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator className="max-w-7xl mx-auto" />

      {/* Resident Services Section */}
      <section id="services" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-blue-100 dark:border-blue-900">
              <Users className="w-3.5 h-3.5" />
              Resident Portal
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-slate-900 to-blue-900 dark:from-slate-100 dark:to-blue-100 bg-clip-text text-transparent">
                Services for Residents
              </span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Everything you need to transact with your barangay government — available 24/7,
              right from your phone or computer.
            </p>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-10 sm:mb-14">
            {residentServices.map((service, index) => (
              <Link
                key={index}
                to={service.href}
                className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 border shadow-md overflow-hidden cursor-pointer">
                  <CardContent className="p-5 sm:p-6 flex flex-col h-full">
                    {/* Badge */}
                    <div className="mb-3 sm:mb-4">
                      <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {service.badge}
                      </span>
                    </div>
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${service.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md flex-shrink-0`}
                    >
                      <div className="text-white">{service.icon}</div>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed flex-1">
                      {service.description}
                    </p>
                    {/* CTA */}
                    <div className="mt-4 pt-4 border-t border-border flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all duration-200">
                      {service.cta}
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Highlights Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {highlights.map((item, index) => (
              <div
                key={index}
                className={`${item.bg} rounded-2xl p-4 sm:p-5 flex flex-col gap-2`}
              >
                <div className={`${item.iconColor} w-8 h-8 flex items-center justify-center rounded-lg bg-white/60 dark:bg-black/20`}>
                  {item.icon}
                </div>
                <h4 className="text-sm font-semibold text-foreground leading-snug">{item.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      <Separator className="max-w-7xl mx-auto" />

      {/* Officials Section */}
      <section id="officials" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-slate-900 to-blue-900 dark:from-slate-100 dark:to-blue-100 bg-clip-text text-transparent">
                Barangay Officials
              </span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Meet the dedicated leaders serving our community with integrity and commitment
            </p>
          </div>

          <Carousel
            setApi={setApi}
            className="max-w-6xl mx-auto"
            opts={{ align: 'start', loop: true }}
          >
            <CarouselContent className="-ml-2 sm:-ml-4">
              {officials.map((official, index) => (
                <CarouselItem key={index} className="pl-2 sm:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                  <Card className="border shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group h-full">
                    <CardContent className="p-3 sm:p-4">
                      <div className="relative mb-2 sm:mb-3 overflow-hidden rounded-lg aspect-square">
                        <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-20 transition-opacity duration-300 z-10"></div>
                        <img
                          src={official.image}
                          alt={official.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <h3 className="text-xs sm:text-sm md:text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2 text-center">
                        {official.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-primary font-semibold line-clamp-1 text-center">
                        {official.position}
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-4 lg:-left-12" />
            <CarouselNext className="hidden sm:flex -right-4 lg:-right-12" />
          </Carousel>
        </div>
      </section>

      <Separator className="max-w-7xl mx-auto" />

      {/* About Section */}
      <section id="about" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-slate-900 to-blue-900 dark:from-slate-100 dark:to-blue-100 bg-clip-text text-transparent">
                  About SmartBarangay
                </span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                SmartBarangay: E-Lag on is a comprehensive digital platform designed to modernize
                barangay governance and improve citizen services. We bridge the gap between local
                government and community members through innovative technology.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Our mission is to create transparent, efficient, and accessible barangay services
                that empower every Filipino to participate in local governance and community development.
              </p>
              <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-slate-100 dark:to-blue-100 bg-clip-text text-transparent mb-1 sm:mb-2">
                    {data ? formatVisitors(data.visitors) : 0}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">Visitors</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-slate-100 dark:to-blue-100 bg-clip-text text-transparent mb-1 sm:mb-2">
                    7
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">Purok</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-slate-100 dark:to-blue-100 bg-clip-text text-transparent mb-1 sm:mb-2">
                    24/7
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">Support</p>
                </div>
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl sm:rounded-3xl blur-3xl opacity-20 dark:opacity-10"></div>
              <Card className="relative border shadow-2xl overflow-hidden">
                <CardContent className="p-0">
                  <img
                    src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop"
                    alt="Community"
                    className="w-full h-64 sm:h-80 md:h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white">
                    <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Building Stronger Communities</h3>
                    <p className="text-sm sm:text-base text-blue-100">Together, we create a better tomorrow</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
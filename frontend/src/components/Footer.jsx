import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, ShieldCheck, ArrowRight } from "lucide-react"
import useSystemSettings from "@/hooks/useSystemSettings"

export default function Footer() {
  const settings = useSystemSettings()

  const appName = settings?.appName || "Barangay Portal"
  const logoUrl = settings?.logoUrl || null
  const slogan = settings?.slogan || "Digitalizing barangay services for a better community."

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        .footer-root {
          font-family: 'DM Sans', sans-serif;
        }

        .footer-link-item a {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13.5px;
          color: hsl(var(--muted-foreground));
          text-decoration: none;
          transition: color 0.15s;
        }

        .footer-link-item a:hover {
          color: hsl(var(--foreground));
        }

        .footer-link-arrow {
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.15s, transform 0.15s;
          flex-shrink: 0;
        }

        .footer-link-item a:hover .footer-link-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .footer-social-btn {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          border: 1px solid hsl(var(--border));
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--muted-foreground));
          text-decoration: none;
          transition: border-color 0.15s, color 0.15s;
        }

        .footer-social-btn:hover {
          border-color: hsl(var(--foreground) / 0.4);
          color: hsl(var(--foreground));
        }
      `}</style>

      <footer className="footer-root w-full border-t bg-background">

        {/* Main grid */}
        <div className="mx-auto max-w-7xl grid grid-cols-4">

          {/* Brand column — spans 2 cols */}
          <div className="col-span-2 flex flex-col gap-5 px-8 py-10">

            {/* Logo */}
            <a href="/" className="flex items-center gap-3 no-underline w-fit">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${appName} logo`}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground shrink-0">
                  <span
                    className="text-background font-semibold text-base"
                    style={{ fontFamily: "'DM Serif Display', serif" }}
                  >
                    {appName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span
                className="text-xl font-semibold text-foreground"
                style={{ fontFamily: "'DM Serif Display', serif", letterSpacing: "-0.01em" }}
              >
                {appName}
              </span>
            </a>

            {/* Slogan */}
            <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-xs">
              {slogan}
            </p>

            {/* Contact info */}
            <ul className="flex flex-col gap-2.5 text-sm list-none p-0 m-0">
              <li className="flex items-center gap-2">
                <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="text-foreground font-medium">Barangay Hall, Main Street</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="text-foreground font-medium">(+63) 912 345 6789</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="text-foreground font-medium">barangay@email.gov.ph</span>
              </li>
            </ul>

            {/* Social icons */}
            <div className="flex items-center gap-2 mt-1">
              <a href="#" aria-label="Facebook" className="footer-social-btn">
                <Facebook className="size-3.5" />
              </a>
              <a href="#" aria-label="Twitter / X" className="footer-social-btn">
                <Twitter className="size-3.5" />
              </a>
              <a href="#" aria-label="Instagram" className="footer-social-btn">
                <Instagram className="size-3.5" />
              </a>
            </div>
          </div>

          {/* Services column */}
          <div className="flex flex-col gap-5 px-8 py-10">
            <div
              className="text-xs font-semibold tracking-widest uppercase text-foreground"
            >
              Services
            </div>
            <ul className="flex flex-col gap-3 list-none p-0 m-0">
              {[
                { label: "Certificates", href: "/certificates/list" },
                { label: "Appointments", href: "/certificates/appointment" },
                { label: "Blotter", href: "/blotter/blotter-list" },
                { label: "Complaints", href: "/complaints" },
              ].map(({ label, href }) => (
                <li key={href} className="footer-link-item">
                  <a href={href}>
                    <ArrowRight className="size-3 footer-link-arrow" aria-hidden="true" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Information column */}
          <div className="flex flex-col gap-5 px-8 py-10">
            <div
              className="text-xs font-semibold tracking-widest uppercase text-foreground"
            >
              Information
            </div>
            <ul className="flex flex-col gap-3 list-none p-0 m-0">
              {[
                { label: "Get started", href: "/signup" },
                { label: "Contributors", href: "/contributors" },
                { label: "Terms & conditions", href: "/terms-conditions" },
              ].map(({ label, href }) => (
                <li key={href} className="footer-link-item">
                  <a href={href}>
                    <ArrowRight className="size-3 footer-link-arrow" aria-hidden="true" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 px-8 py-4 text-xs text-muted-foreground border-t border-border">
          <span>© {new Date().getFullYear()} {appName}. All rights reserved.</span>
          <div className="flex items-center gap-1.5 border border-border rounded-full px-3 py-1">
            <ShieldCheck className="size-3" />
            <span>Barangay Digital Services Program</span>
          </div>
        </div>

      </footer>
    </>
  )
}
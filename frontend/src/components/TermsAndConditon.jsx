import { Separator } from "@/components/ui/separator";

const sections = [
  {
    number: "01",
    title: "General Information",
    content: (
      <>
        This system (<strong className="text-foreground">SmartBarangay</strong>) is operated by the{" "}
        <strong className="text-foreground">Barangay Local Government Unit (BLGU)</strong>. By using the System,
        you agree to the terms and conditions outlined below. If you do not agree with these terms,
        please refrain from using the System.
      </>
    ),
  },
  {
    number: "02",
    title: "System Description",
    content: (
      <>
        <strong className="text-foreground">SmartBarangay</strong> is a digital governance platform designed
        to streamline barangay operations and enhance community services, including document requests, resident
        registration, complaint reporting, and community announcements. The{" "}
        <strong className="text-foreground">BLGU</strong> reserves the right to modify the services and content
        provided without prior notice.
      </>
    ),
  },
  {
    number: "03",
    title: "User Accounts & Eligibility",
    content: (
      <>
        To access certain features of the System, you must register for an account with accurate and complete
        information. You are responsible for maintaining the confidentiality of your login credentials and for
        all activities that occur under your account. The System is open to registered residents, barangay
        officials, and authorized government personnel who are at least 18 years of age, or minors with
        parental or guardian consent.
      </>
    ),
  },
  {
    number: "04",
    title: "Data Privacy & Protection",
    content: (
      <>
        In compliance with <strong className="text-foreground">Republic Act No. 10173</strong> (Data Privacy Act
        of 2012), the SmartBarangay System collects, stores, and processes personal data necessary for the
        delivery of barangay services. Your data will not be shared with third parties without your consent,
        except when required by law or authorized government agencies. You have the right to access, correct,
        and request deletion of your personal data by contacting the Barangay Data Protection Officer.
      </>
    ),
  },
  {
    number: "05",
    title: "User Conduct & Responsibilities",
    content: (
      <>
        Users agree to use the SmartBarangay System responsibly and lawfully. Prohibited actions include
        submitting false or fraudulent information, impersonating barangay officials or other users, attempting
        unauthorized access, uploading malicious content, and filing fabricated complaints or blotter reports.
        Violations may result in account suspension or referral to legal authorities under{" "}
        <strong className="text-foreground">RA 10175</strong> (Cybercrime Prevention Act of 2012).
      </>
    ),
  },
  {
    number: "06",
    title: "Document Request Services",
    content: (
      <>
        The System facilitates digital requests for official barangay documents such as Barangay Clearance,
        Certificate of Residency, and Business Permits. Standard processing takes 1–3 business days. All
        issued documents carry official digital signatures and QR codes for verification. Document fees are
        non-refundable once processing has commenced and are set in accordance with the Barangay's Revenue Code.
      </>
    ),
  },
  {
    number: "07",
    title: "Intellectual Property Rights",
    content: (
      <>
        The content, design, graphics, logos, and software on the SmartBarangay System are the property of
        the <strong className="text-foreground">BLGU</strong> or its respective rights holders. Unauthorized
        reproduction, distribution, or use of these materials is strictly prohibited.
      </>
    ),
  },
  {
    number: "08",
    title: "Third-Party Links",
    content: (
      <>
        The System may contain links to third-party websites. The{" "}
        <strong className="text-foreground">BLGU</strong> is not responsible for the content of these external
        websites, and such links are provided for convenience only.
      </>
    ),
  },
  {
    number: "09",
    title: "Limitation of Liability",
    content: (
      <>
        The <strong className="text-foreground">SmartBarangay System</strong> and the{" "}
        <strong className="text-foreground">BLGU</strong> shall not be held liable for any direct or indirect
        damages arising from your use of the System, including service interruptions, data loss due to force
        majeure, or decisions made based on information retrieved from the System. The System is provided "as
        is" without warranty of any kind.
      </>
    ),
  },
  {
    number: "10",
    title: "Changes to Terms",
    content: (
      <>
        The <strong className="text-foreground">BLGU</strong> reserves the right to update these Terms and
        Conditions at any time. Updates will take effect once posted on this page. Users will be notified of
        significant changes through the System or their registered contact information. It is recommended that
        you review this page periodically.
      </>
    ),
  },
];

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Header */}
      <div className="w-full border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Terms and Conditions</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            SmartBarangay System · Effective January 1, 2025
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-0">
          {sections.map((section, index) => (
            <div key={section.number}>
              <div className="py-8 flex flex-col sm:flex-row gap-4 sm:gap-8">
                {/* Section number */}
                <div className="flex-shrink-0 w-10 sm:w-14">
                  <span className="text-xs font-mono text-muted-foreground tracking-widest">
                    {section.number}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold mb-3 leading-snug">
                    {section.title}
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
              {index < sections.length - 1 && <Separator />}
            </div>
          ))}

          {/* Contact section */}
          <Separator />
          <div className="py-8 flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div className="flex-shrink-0 w-10 sm:w-14">
              <span className="text-xs font-mono text-muted-foreground tracking-widest">11</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold mb-3">Contact</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-3">
                If you have any questions regarding these Terms and Conditions, please contact us:
              </p>
              <address className="not-italic space-y-1">
                <p className="font-semibold text-foreground text-sm sm:text-base">
                  SmartBarangay Administration Office
                </p>
                <a
                  href="mailto:admin@smartbarangay.gov.ph"
                  className="text-sm sm:text-base text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
                >
                  admin@smartbarangay.gov.ph
                </a>
              </address>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
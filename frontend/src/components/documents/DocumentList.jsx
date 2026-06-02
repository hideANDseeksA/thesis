import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileText, Eye, ChevronDown, Library, Info } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSearchContext } from "@/context/SearchContext";
import CertificatesSkeleton from "../certificates/skeleton";
import { api } from "@/lib/axios";
import WalkthroughOverlay from "@/context/WalkthroughOverlay"; // adjust path if needed

// ── Walkthrough key ──────────────────────────────────────────
const DOCS_WALKTHROUGH_KEY = "documents_walkthrough_done";

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCards, setOpenCards] = useState({});
  const navigate = useNavigate();
  const { searchQuery } = useSearchContext();

  // ── Walkthrough ──────────────────────────────────────────────────────────
  const [wtActive, setWtActive] = useState(false);
  const [wtStep, setWtStep] = useState(0);

  const headerRef      = useRef(null); // page description
  const firstCardRef   = useRef(null); // first document card
  const purposeBtnRef  = useRef(null); // Purpose toggle on first card
  const viewBtnRef     = useRef(null); // View Document button on first card

  const wtFinish = () => {
    localStorage.setItem(DOCS_WALKTHROUGH_KEY, "true");
    setWtActive(false);
    setWtStep(0);
  };

  const walkthroughSteps = [
    {
      targetRef: { current: null }, // centered welcome
      title: "Official Documents 📂",
      text: "This section gives you access to all official barangay documents — budgetary reports, ordinances, resolutions, and more.",
    },
    {
      targetRef: headerRef,
      title: "What's here",
      text: "Browse public records relevant to your community. Use the search bar at the top to quickly find a specific document by title, purpose, or date.",
      placement: "bottom",
    },
    {
      targetRef: firstCardRef,
      title: "Document cards",
      text: "Each card shows the document title and the date it was issued. Two actions are available on every card.",
      placement: "bottom",
    },
    {
      targetRef: purposeBtnRef,
      title: "View purpose",
      text: "Click Purpose to expand the card and read a brief description of why the document was issued.",
      placement: "bottom",
    },
    {
      targetRef: viewBtnRef,
      title: "Open the document",
      text: "Click View Document to open the full document in the document viewer — you can read it directly in the app.",
      placement: "top",
    },
  ];
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await api.get("/documents/resident");
        setDocuments(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Start walkthrough after data loads and only once
  useEffect(() => {
    if (loading) return;
    const done = localStorage.getItem(DOCS_WALKTHROUGH_KEY);
    if (done) return;
    const t = setTimeout(() => setWtActive(true), 500);
    return () => clearTimeout(t);
  }, [loading]);

  const toggleCard = (docId) => {
    setOpenCards((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents;
    return documents.filter((doc) =>
      [doc.title, doc.purpose, doc.issued_date, doc.expiration_date]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [documents, searchQuery]);

  if (loading) return <CertificatesSkeleton />;

  return (
    <>
      {/* ── Walkthrough overlay ──────────────────────────────────────── */}
      <WalkthroughOverlay
        active={wtActive}
        step={wtStep}
        steps={walkthroughSteps}
        onNext={() => setWtStep((s) => s + 1)}
        onSkip={wtFinish}
        onFinish={wtFinish}
      />

      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm font-medium uppercase tracking-widest">
            <Library className="w-3.5 h-3.5" />
            <span>Barangay Records</span>
          </div>

          <h1 className="scroll-m-20 text-2xl sm:text-3xl font-extrabold tracking-tight lg:text-4xl text-foreground">
            Official Documents
          </h1>

          {/* ref on description — walkthrough step 1 */}
          <p ref={headerRef} className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            This section contains official barangay documents including budgetary
            reports, ordinances, resolutions, and other public records relevant to
            our community. Click on any document to learn more or view its full
            content.
          </p>
        </div>

        <Separator />

        {/* ── Document Count ── */}
        {filteredDocuments.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredDocuments.length}
            </span>{" "}
            {filteredDocuments.length === 1 ? "document" : "documents"}
            {searchQuery && (
              <>
                {" "}for{" "}
                <span className="font-semibold text-foreground">
                  &ldquo;{searchQuery}&rdquo;
                </span>
              </>
            )}
          </p>
        )}

        {/* ── Empty State ── */}
        {filteredDocuments.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm text-foreground">No documents found</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {searchQuery
                  ? `No results matched "${searchQuery}". Try a different keyword.`
                  : "There are no documents available at the moment."}
              </p>
            </div>
          </div>
        )}

        {/* ── Document Cards ── */}
        <div className="space-y-3">
          {filteredDocuments.map((doc, index) => {
            const isFirst = index === 0;

            return (
              <Card
                key={doc.id}
                // ref on the first card — walkthrough step 2
                ref={isFirst ? firstCardRef : undefined}
                className="bg-card hover:shadow-sm transition-shadow border border-border overflow-hidden"
              >
                <Collapsible
                  open={openCards[doc.id]}
                  onOpenChange={() => toggleCard(doc.id)}
                >
                  <CardContent className="p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">

                      {/* Icon */}
                      <div className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="scroll-m-20 text-base md:text-lg font-semibold leading-snug tracking-tight text-foreground truncate capitalize">
                          {doc.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Issued{" "}
                          {new Date(doc.issued_date).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 w-full sm:w-auto flex-shrink-0 mt-1 sm:mt-0">
                        {/* Purpose toggle — ref on first card — walkthrough step 3 */}
                        <CollapsibleTrigger asChild>
                          <Button
                            ref={isFirst ? purposeBtnRef : undefined}
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-initial text-xs gap-1.5"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {openCards[doc.id] ? "Hide" : "Purpose"}
                            </span>
                            <span className="sm:hidden">
                              {openCards[doc.id] ? "Hide" : "Info"}
                            </span>
                            <ChevronDown
                              className={`w-3 h-3 transition-transform duration-200 ${
                                openCards[doc.id] ? "rotate-180" : ""
                              }`}
                            />
                          </Button>
                        </CollapsibleTrigger>

                        {/* View Document — ref on first card — walkthrough step 4 */}
                        <Button
                          ref={isFirst ? viewBtnRef : undefined}
                          className="btn-primary hover:bg-orange-600 text-white gap-1.5 flex-1 sm:flex-initial text-xs"
                          size="sm"
                          onClick={() =>
                            navigate("/resident/documents/view", {
                              state: {
                                url: doc.file_url,
                                title: doc.title,
                              },
                            })
                          }
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">View Document</span>
                          <span className="md:hidden">View</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>

                  {/* Purpose Dropdown */}
                  <CollapsibleContent>
                    <div className="border-t border-border bg-muted/40 px-4 md:px-5 py-3 md:py-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Purpose
                      </p>
                      <p className="text-sm text-foreground leading-relaxed capitalize whitespace-pre-line">
                        {doc.purpose}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default DocumentList;
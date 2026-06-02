import { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    Send,
    FileText,
    ChevronDown,
    Calendar,
    ScrollText,
    Info,
} from "lucide-react";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { capitalizeWords } from "@/lib/capitalizer";
import DynamicForm from "@/components/forms/DynamicCertificateForm";
import { useSearchContext } from "@/context/SearchContext";
import { apiWithLoading, api } from "@/lib/axios";
import CertificatesSkeleton from "../certificates/skeleton";
import { getItem } from "@/utils/localStorageHelper";
import WalkthroughOverlay from "@/context/WalkthroughOverlay"; // adjust path if needed

const CERT_WALKTHROUGH_KEY = "certificates_walkthrough_done";

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { searchQuery } = useSearchContext();
    const [activeCertificateId, setActiveCertificateId] = useState(null);
    const [request_type, setRequestType] = useState(false);
    const [openCards, setOpenCards] = useState({});
    const resident_data = getItem("resident_data");
    const citizen_since = resident_data?.citizen_since;

    // ── Walkthrough ──────────────────────────────────────────────────────────
    const [wtActive, setWtActive] = useState(false);
    const [wtStep,   setWtStep]   = useState(0);

    const headerRef      = useRef(null); // page title / description
    const firstCardRef   = useRef(null); // first certificate card
    const reqBtnRef      = useRef(null); // Requirements button on first card
    const actionBtnRef   = useRef(null); // Make Request / Schedule button on first card

    const wtFinish = () => {
        localStorage.setItem(CERT_WALKTHROUGH_KEY, "true");
        setWtActive(false);
        setWtStep(0);
    };

    const walkthroughSteps = [
        {
            targetRef: { current: null }, // centered welcome
            title: "Certificates Page 📜",
            text: "Here you can browse all official barangay certificates available for request or appointment.",
        },
        {
            targetRef: headerRef,
            title: "Residency requirement",
            text: "You must have at least 6 months of residency before you can request or schedule any certificate.",
            placement: "bottom",
        },
        {
            targetRef: firstCardRef,
            title: "Certificate cards",
            text: "Each card shows the certificate name, fee, and whether it can be requested online or requires an in-person appointment.",
            placement: "bottom",
        },
        {
            targetRef: reqBtnRef,
            title: "View requirements",
            text: "Click this button to expand the list of documents and requirements you need to prepare before requesting.",
            placement: "bottom",
        },
        {
            targetRef: actionBtnRef,
            title: "Request or schedule",
            text: "Click here to fill out the request form or pick an appointment schedule — depending on the certificate type.",
            placement: "top",
        },
    ];
    // ────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                const res = await api.get(`/certificates/resident`, {
                    withCredentials: true,
                });
                setCertificates(res.data);
            } catch (err) {
                setError(err.response?.data?.error || err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCertificates();
    }, []);

    // Start walkthrough after data loads and only once
    useEffect(() => {
        if (loading) return;
        const done = localStorage.getItem(CERT_WALKTHROUGH_KEY);
        if (done) return;
        const t = setTimeout(() => setWtActive(true), 500);
        return () => clearTimeout(t);
    }, [loading]);

    const toggleCard = (id) => {
        setOpenCards((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const filteredCertificates = useMemo(() => {
        if (!searchQuery) return certificates;
        return certificates.filter((item) =>
            [item.template_name, item.template_price, item.timestamp, item.template_requirements]
                .join(" ")
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
        );
    }, [certificates, searchQuery]);

    if (loading) return <CertificatesSkeleton />;

    if (error) {
        return (
            <div className="text-center text-sm text-destructive mt-10">{error}</div>
        );
    }

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
                        <ScrollText className="w-3.5 h-3.5" />
                        <span>Barangay Services</span>
                    </div>

                    <h1 className="scroll-m-20 text-2xl sm:text-3xl font-extrabold tracking-tight lg:text-4xl text-foreground">
                        Certificates
                    </h1>

                    {/* ref on the residency notice — walkthrough step 1 */}
                    <p ref={headerRef} className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                        Below is the list of official certificates available in our barangay.
                        Select a certificate to view its requirements and submit a request or
                        schedule an appointment.

                        <strong className="block mt-2 text-orange-500">
                            Minimum requirement: Resident must have at least 6 months of residency
                            in the barangay to request or schedule a certificate.
                        </strong>
                    </p>
                </div>

                <Separator />

                {/* ── Certificate Count ── */}
                {filteredCertificates.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                        Showing{" "}
                        <span className="font-semibold text-foreground">
                            {filteredCertificates.length}
                        </span>{" "}
                        {filteredCertificates.length === 1 ? "certificate" : "certificates"}
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
                {filteredCertificates.length === 0 && (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold text-sm text-foreground">No certificates found</p>
                            <p className="text-xs text-muted-foreground max-w-xs">
                                {searchQuery
                                    ? `No results matched "${searchQuery}". Try a different keyword.`
                                    : "There are no certificates available at the moment."}
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Certificate Cards ── */}
                <div className="space-y-3">
                    {filteredCertificates.map((item, index) => (
                        <Card
                            key={item.id}
                            // ref on the first card only — walkthrough step 2
                            ref={index === 0 ? firstCardRef : undefined}
                            className="bg-card hover:shadow-sm transition-shadow border border-border overflow-hidden"
                        >
                            <Collapsible
                                open={openCards[item.id]}
                                onOpenChange={() => toggleCard(item.id)}
                            >
                                <CardContent className="p-4 md:p-5">
                                    <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">

                                        {/* Icon */}
                                        <div className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-primary" />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <h3 className="scroll-m-20 text-base md:text-lg font-semibold leading-snug tracking-tight text-foreground truncate">
                                                {capitalizeWords(item.template_name)}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <span className="text-sm font-semibold text-foreground">
                                                    ₱{item.template_price}.00
                                                </span>

                                                <Badge
                                                    variant={item.requestType ? "default" : "secondary"}
                                                    className="text-xs px-2 py-0.5"
                                                >
                                                    {item.requestType ? "Online Request" : "Appointment Only"}
                                                </Badge>
                                            </div>

                                            <p className="text-xs text-muted-foreground">
                                                Added{" "}
                                                {new Date(item.timestamp).toLocaleDateString("en-US", {
                                                    month: "long",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 w-full sm:w-auto flex-shrink-0 mt-1 sm:mt-0">
                                            {item.template_requirements && (
                                                <CollapsibleTrigger asChild>
                                                    {/* ref on first card's requirements btn — walkthrough step 3 */}
                                                    <Button
                                                        ref={index === 0 ? reqBtnRef : undefined}
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 sm:flex-initial text-xs gap-1.5"
                                                    >
                                                        <Info className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">
                                                            {openCards[item.id] ? "Hide" : "Requirements"}
                                                        </span>
                                                        <span className="sm:hidden">
                                                            {openCards[item.id] ? "Hide" : "Info"}
                                                        </span>
                                                        <ChevronDown
                                                            className={`w-3 h-3 transition-transform duration-200 ${
                                                                openCards[item.id] ? "rotate-180" : ""
                                                            }`}
                                                        />
                                                    </Button>
                                                </CollapsibleTrigger>
                                            )}

                                            {/* ref on first card's action btn — walkthrough step 4 */}
                                            <Button
                                                ref={index === 0 ? actionBtnRef : undefined}
                                                className="btn-primary hover:bg-orange-600 text-white gap-1.5 flex-1 sm:flex-initial text-xs"
                                                size="sm"
                                                disabled={citizen_since < 6}
                                                onClick={() => {
                                                    setActiveCertificateId(item.id);
                                                    setRequestType(item.requestType);
                                                }}
                                            >
                                                {item.requestType ? (
                                                    <Send className="w-3.5 h-3.5" />
                                                ) : (
                                                    <Calendar className="w-3.5 h-3.5" />
                                                )}
                                                <span className="hidden md:inline">
                                                    {item.requestType ? "Make Request" : "Schedule Now"}
                                                </span>
                                                <span className="md:hidden">
                                                    {item.requestType ? "Request" : "Schedule"}
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>

                                {/* Requirements Dropdown */}
                                {item.template_requirements && (
                                    <CollapsibleContent>
                                        <div className="border-t border-border bg-muted/40 px-4 md:px-5 py-3 md:py-4">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                                Requirements
                                            </p>
                                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                                                {item.template_requirements}
                                            </p>
                                        </div>
                                    </CollapsibleContent>
                                )}
                            </Collapsible>
                        </Card>
                    ))}
                </div>

                {/* ── DynamicForm Modal ── */}
                {activeCertificateId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="relative w-full max-w-md lg:max-w-xl max-h-[90vh]">
                            <DynamicForm
                                templateId={activeCertificateId}
                                requestType={request_type}
                                submitLabel={request_type ? "Send" : "Submit"}
                                onSubmit={(data, template) => {
                                    console.log("Form Data:", data);
                                    console.log("Template Info:", template);
                                    setActiveCertificateId(null);
                                }}
                                onCancel={() => {
                                    setActiveCertificateId(null);
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
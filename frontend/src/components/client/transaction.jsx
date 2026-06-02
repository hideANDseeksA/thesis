import { useEffect, useState, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  FileText,
  ChevronDown,
  ClipboardList,
  Info,
  XCircle,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { useSearchContext } from "@/context/SearchContext";
import { getItem } from "@/utils/localStorageHelper";
import CertificatesSkeleton from "../certificates/skeleton";

import { showCancelConfirmation } from "@/utils/dialog";
import { toastDelete, toastError } from "@/utils/toast";
import { cancelTransaction } from "@/api/user.certificate";
import { api } from "@/lib/axios";
import { getSocket } from "@/utils/socket";
import WalkthroughOverlay from "@/context/WalkthroughOverlay"; // adjust path if needed

// ── Walkthrough key ──────────────────────────────────────────
const TXN_WALKTHROUGH_KEY = "transactions_walkthrough_done";

// ── Status config ────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  "on process": {
    label: "On Process",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  "ready to claim": {
    label: "Ready to Claim",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  declined: {
    label: "Declined",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status?.toLowerCase()] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
};

// ── Main Component ───────────────────────────────────────────
const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCards, setOpenCards] = useState({});
  const [cancellingId, setCancellingId] = useState(null);
  const { searchQuery } = useSearchContext();
  const userId = getItem("resident_id");

  // ── Walkthrough ──────────────────────────────────────────────────────────
  const [wtActive, setWtActive] = useState(false);
  const [wtStep, setWtStep] = useState(0);

  const headerRef     = useRef(null); // page title / description
  const firstCardRef  = useRef(null); // first transaction card
  const detailsBtnRef = useRef(null); // Details toggle button on first card
  const cancelBtnRef  = useRef(null); // Cancel button on first card (pending only)

  const wtFinish = () => {
    localStorage.setItem(TXN_WALKTHROUGH_KEY, "true");
    setWtActive(false);
    setWtStep(0);
  };

  const walkthroughSteps = [
    {
      targetRef: { current: null }, // centered welcome card
      title: "Transaction History 📋",
      text: "Here you can track all of your barangay certificate requests and monitor their current status.",
    },
    {
      targetRef: headerRef,
      title: "Your requests at a glance",
      text: "This page lists every certificate you've requested, sorted from newest to oldest. Use the search bar to filter by name, purpose, or status.",
      placement: "bottom",
    },
    {
      targetRef: firstCardRef,
      title: "Transaction cards",
      text: "Each card shows the certificate type, status badge, request date, appointment date (if any), and the fee. Status updates here in real time.",
      placement: "bottom",
    },
    {
      targetRef: detailsBtnRef,
      title: "View details",
      text: "Click Details to expand the card and see the full breakdown — purpose, full name, age, and amount paid.",
      placement: "bottom",
    },
    {
      targetRef: cancelBtnRef,
      title: "Cancel a request",
      text: "If your request is still Pending, you can cancel it here before the staff begins processing. Once processing starts, cancellation is no longer available.",
      placement: "top",
    },
  ];
  // ────────────────────────────────────────────────────────────────────────

  // ── Fetch transactions ──
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get(`/transactions/${userId}`);
        setTransactions(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        if (error.response?.status === 404) {
          setTransactions([]);
        } else {
          console.error("Failed to fetch transactions:", error);
        }
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchTransactions();
    }
  }, [userId]);

  // Start walkthrough after data loads and only once
  useEffect(() => {
    if (loading) return;
    const done = localStorage.getItem(TXN_WALKTHROUGH_KEY);
    if (done) return;
    const t = setTimeout(() => setWtActive(true), 500);
    return () => clearTimeout(t);
  }, [loading]);

  // ── Socket: join resident room + listen for updates ──
  useEffect(() => {
    let socket;

    try {
      socket = getSocket();
    } catch (err) {
      console.warn("Socket not available:", err.message);
      return;
    }

    const joinRoom = () => {
      socket.emit("join:room", `resident:${userId}`);
      console.log("✅ Joined room:", `resident:${userId}`);
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.on("connect", joinRoom);
    }

    const handleUpdatedTransaction = ({ id, status }) => {
      console.log("📡 transaction:updated received:", { id, status });
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      );
    };

    socket.on("transaction:updated", handleUpdatedTransaction);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("transaction:updated", handleUpdatedTransaction);
    };
  }, [userId]);

  const toggleCard = (id) => {
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCancel = async (id) => {
    const confirmed = await showCancelConfirmation({
      title: "Cancel this request?",
      text: "You're about to cancel your certificate request. This action cannot be undone.",
      confirmText: "Yes, Cancel it!",
      cancelText: "No, Keep it",
    });

    if (!confirmed) return;

    setCancellingId(id);
    try {
      await cancelTransaction(id);

      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "cancelled" } : t))
      );

      toastDelete("Request cancelled", "Your certificate request was successfully cancelled.");
    } catch (error) {
      toastError(
        error?.response?.data?.message || "Failed to cancel request. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    return transactions.filter((t) =>
      [
        t.certificate?.template_name,
        t.details?.purpose,
        t.details?.full_name,
        t.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  // Sort newest first
  const sortedTransactions = useMemo(
    () =>
      [...filteredTransactions].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      ),
    [filteredTransactions]
  );

  if (loading) return <CertificatesSkeleton />;

  // Determine if first transaction is pending (for cancel btn ref)
  const firstIsPending = sortedTransactions[0]?.status?.toLowerCase() === "pending";

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
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Certificate Requests</span>
          </div>

          <h1 className="scroll-m-20 text-2xl sm:text-3xl font-extrabold tracking-tight lg:text-4xl text-foreground">
            Transaction History
          </h1>

          {/* ref on description — walkthrough step 1 */}
          <p ref={headerRef} className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            View the status of your barangay certificate requests. Pending
            requests can be cancelled anytime before processing begins.
          </p>
        </div>

        <Separator />

        {/* ── Transaction Count ── */}
        {sortedTransactions.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {sortedTransactions.length}
            </span>{" "}
            {sortedTransactions.length === 1 ? "transaction" : "transactions"}
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
        {sortedTransactions.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm text-foreground">
                No transactions found
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {searchQuery
                  ? `No results matched "${searchQuery}". Try a different keyword.`
                  : "You haven't made any certificate requests yet."}
              </p>
            </div>
          </div>
        )}

        {/* ── Transaction Cards ── */}
        <div className="space-y-3">
          {sortedTransactions.map((transaction, index) => {
            const isPending =
              transaction.status?.toLowerCase() === "pending";
            const isCancelling = cancellingId === transaction.id;
            const isFirst = index === 0;

            return (
              <Card
                key={transaction.id}
                // ref on the first card — walkthrough step 2
                ref={isFirst ? firstCardRef : undefined}
                className="bg-card hover:shadow-sm transition-shadow border border-border overflow-hidden"
              >
                <Collapsible
                  open={openCards[transaction.id]}
                  onOpenChange={() => toggleCard(transaction.id)}
                >
                  <CardContent className="p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">

                      {/* Icon */}
                      <div className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base md:text-lg font-semibold leading-snug tracking-tight text-foreground capitalize">
                            {transaction.certificate?.template_name ?? "Certificate Request"}
                          </h3>
                          <StatusBadge status={transaction.status} />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Requested on{" "}
                          {new Date(transaction.timestamp).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {transaction.appointment_date && (
                            <>
                              {" · "}Appointment:{" "}
                              {new Date(transaction.appointment_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </>
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          ₱{transaction.certificate?.template_price?.toFixed(2) ?? "—"}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 w-full sm:w-auto flex-shrink-0 mt-1 sm:mt-0">
                        {/* Details toggle — ref on first card — walkthrough step 3 */}
                        <CollapsibleTrigger asChild>
                          <Button
                            ref={isFirst ? detailsBtnRef : undefined}
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-initial text-xs gap-1.5"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {openCards[transaction.id] ? "Hide" : "Details"}
                            </span>
                            <span className="sm:hidden">
                              {openCards[transaction.id] ? "Hide" : "Info"}
                            </span>
                            <ChevronDown
                              className={`w-3 h-3 transition-transform duration-200 ${
                                openCards[transaction.id] ? "rotate-180" : ""
                              }`}
                            />
                          </Button>
                        </CollapsibleTrigger>

                        {/* Cancel — only for pending
                            ref on first card's cancel btn — walkthrough step 4
                            (only attached if first card is pending; otherwise ref stays null) */}
                        {isPending && (
                          <Button
                            ref={isFirst ? cancelBtnRef : undefined}
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-initial text-xs gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={isCancelling}
                            onClick={() => handleCancel(transaction.id)}
                          >
                            {isCancelling ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">
                              {isCancelling ? "Cancelling..." : "Cancel Request"}
                            </span>
                            <span className="sm:hidden">Cancel</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  {/* Expandable Details */}
                  <CollapsibleContent>
                    <div className="border-t border-border bg-muted/40 px-4 md:px-5 py-3 md:py-4 space-y-3">

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Purpose
                        </p>
                        <p className="text-sm text-foreground leading-relaxed capitalize">
                          {transaction.details?.purpose ?? "—"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            Full Name
                          </p>
                          <p className="text-sm text-foreground capitalize">
                            {transaction.details?.full_name ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            Age
                          </p>
                          <p className="text-sm text-foreground">
                            {transaction.details?.age ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            Amount
                          </p>
                          <p className="text-sm text-foreground font-semibold">
                            ₱{transaction.certificate?.template_price?.toFixed(2) ?? "—"}
                          </p>
                        </div>
                      </div>

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

export default TransactionHistory;
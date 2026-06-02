import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * WalkthroughOverlay
 *
 * Props:
 *   active      – boolean, show/hide the overlay
 *   step        – current step index (0-based)
 *   steps       – array of { targetRef, title, text, placement }
 *   onNext      – called when user clicks Next
 *   onSkip      – called when user clicks Skip / X
 *   onFinish    – called when user clicks the final "Got it" on last step
 */
export default function WalkthroughOverlay({ active, step, steps, onNext, onSkip, onFinish }) {
  const [spotlight, setSpotlight] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({})
  const overlayRef = useRef(null)

  const isLast = step === steps.length - 1

  useEffect(() => {
    if (!active) return

    const current = steps[step]
    if (!current?.targetRef?.current) {
      setSpotlight(null)
      setTooltipPos({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })
      return
    }

    const el = current.targetRef.current
    const rect = el.getBoundingClientRect()
    const pad = 8

    setSpotlight({
      top: rect.top + window.scrollY - pad,
      left: rect.left + window.scrollX - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    })

    const placement = current.placement || 'bottom'
    const TOOLTIP_W = 288
    let tipLeft = rect.left + window.scrollX + rect.width / 2 - TOOLTIP_W / 2
    tipLeft = Math.max(12, Math.min(tipLeft, window.innerWidth - TOOLTIP_W - 12))

    if (placement === 'bottom') {
      setTooltipPos({
        top: rect.bottom + window.scrollY + pad + 10,
        left: tipLeft,
        transform: 'none',
      })
    } else {
      setTooltipPos({
        top: rect.top + window.scrollY - pad - 10,
        left: tipLeft,
        transform: 'translateY(-100%)',
      })
    }
  }, [active, step, steps])

  if (!active) return null

  const current = steps[step]

  return (
    <>
      {/* Dark backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9998] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {spotlight ? (
          <svg
            className="fixed inset-0 w-full h-full z-[9998]"
            style={{ pointerEvents: 'none' }}
          >
            <defs>
              <mask id="wt-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={spotlight.left}
                  y={spotlight.top}
                  width={spotlight.width}
                  height={spotlight.height}
                  rx={10}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.58)"
              mask="url(#wt-mask)"
            />
            {/* Animated ring */}
            <rect
              x={spotlight.left - 2}
              y={spotlight.top - 2}
              width={spotlight.width + 4}
              height={spotlight.height + 4}
              rx={12}
              fill="none"
              stroke="#7c6af7"
              strokeWidth="2"
              className="wt-pulse"
            />
          </svg>
        ) : (
          <div className="fixed inset-0 bg-black/60 z-[9998]" />
        )}
      </div>

      {/* Tooltip card */}
      <div
        className="fixed z-[9999] w-72 bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-2xl p-4"
        style={tooltipPos}
      >
        {/* Header row */}
        <div className="flex items-start justify-between mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-violet-500">
            Step {step + 1} of {steps.length}
          </span>
          <button
            onClick={onSkip}
            aria-label="Close walkthrough"
            className="text-muted-foreground hover:text-foreground transition-colors -mt-0.5 -mr-0.5"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-sm font-semibold text-foreground mb-1">
          {current?.title}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          {current?.text}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Step dots */}
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-colors duration-200',
                  i === step ? 'bg-violet-500' : 'bg-muted-foreground/30'
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-xs text-muted-foreground h-7 px-2"
            >
              Skip
            </Button>
            <Button
              size="sm"
              onClick={isLast ? onFinish : onNext}
              className="h-7 px-3 text-xs bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isLast ? 'Got it!' : 'Next →'}
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        .wt-pulse {
          animation: wt-pulse-anim 1.8s ease-in-out infinite;
        }
        @keyframes wt-pulse-anim {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </>
  )
}
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  labelledBy: string;
  children: ReactNode;
  onClose: () => void;
  overlayClassName?: string;
  contentClassName?: string;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  closeDisabled?: boolean;
  mobileSheet?: boolean;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function Dialog({
  labelledBy,
  children,
  onClose,
  overlayClassName,
  contentClassName,
  closeOnEscape = true,
  closeOnBackdrop = false,
  closeDisabled = false,
  mobileSheet = false,
}: DialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";

    const content = contentRef.current;
    const firstFocusable =
      content?.querySelector<HTMLElement>(
        "input:not([disabled]):not([type='hidden']),select:not([disabled]),textarea:not([disabled])",
      ) ?? content?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? content)?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && closeOnEscape && !closeDisabled) {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = Array.from(
      contentRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ??
        [],
    );
    if (focusable.length === 0) {
      event.preventDefault();
      contentRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className={cn(
        mobileSheet
          ? "fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          : "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
        overlayClassName,
      )}
      role="presentation"
      onMouseDown={(event) => {
        if (
          closeOnBackdrop &&
          !closeDisabled &&
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}>
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          "outline-none",
          contentClassName,
          mobileSheet &&
            "relative max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl pt-7 pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-4 duration-300 sm:max-h-[calc(100dvh-2rem)] sm:rounded-xl sm:pt-0 sm:animate-none",
        )}>
        {mobileSheet && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-2 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-text-secondary/30 sm:hidden"
          />
        )}
        {children}
      </div>
    </div>
  );
}

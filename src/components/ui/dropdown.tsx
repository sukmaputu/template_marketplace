import { useRef, useState, type ReactNode } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";

interface DropdownProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (props: { close: () => void }) => ReactNode;
  align?: "left" | "right";
  panelClassName?: string;
}

export function Dropdown({
  trigger,
  children,
  align = "right",
  panelClassName = "",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setOpen(false));

  return (
    <div ref={containerRef} className="relative">
      {trigger({ open, toggle: () => setOpen((prev) => !prev) })}

      {open ? (
        <div
          className={`absolute top-full z-50 mt-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          } ${panelClassName}`}>
          {children({ close: () => setOpen(false) })}
        </div>
      ) : null}
    </div>
  );
}

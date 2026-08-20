import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface DropdownMenuItem<T extends string> {
  value: T;
  label: string;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownMenuProps<T extends string> {
  items: DropdownMenuItem<T>[];
  onSelect: (value: T) => void;
  trigger: ReactNode;
  align?: "start" | "end";
  className?: string;
  "aria-label"?: string;
}

export function DropdownMenu<T extends string>({
  items,
  onSelect,
  trigger,
  align = "end",
  className,
  ...props
}: DropdownMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleSelect(value: T) {
    setOpen(false);
    onSelect(value);
  }

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <div onClick={() => setOpen((prev) => !prev)}>{trigger}</div>
      {open && (
        <div
          role="menu"
          aria-label={props["aria-label"]}
          className={cn(
            "absolute z-40 mt-1 min-w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900",
            align === "end" ? "end-0" : "start-0",
          )}
        >
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => handleSelect(item.value)}
              className={cn(
                "block w-full px-3 py-2 text-start text-sm transition-colors disabled:pointer-events-none disabled:opacity-50",
                item.danger
                  ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Example = () => {
  return (
    <div className="p-4">
      <FlyoutLink
        href="#"
        FlyoutContent={() => <div className="text-black">Register Content</div>}
      >
        Register
      </FlyoutLink>
    </div>
  );
};

type FlyoutLinkProps = {
  children: ReactNode;
  href?: string;
  FlyoutContent?: ComponentType;
  className?: string;
  underlineClassName?: string;
  flyoutClassName?: string;
  caretClassName?: string;
};

export const FlyoutLink = ({
  children,
  href,
  FlyoutContent,
  className = "text-slate-100",
  underlineClassName = "bg-amber-300/60",
  flyoutClassName = "rounded-2xl border border-slate-800/80 bg-slate-950/90",
  caretClassName = "bg-slate-950 border-t border-l border-slate-800/80",
}: FlyoutLinkProps) => {
  const [open, setOpen] = useState(false);
  const showFlyout = open && !!FlyoutContent;

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="group relative h-fit w-fit"
    >
      {href ? (
        <a href={href} className={`relative ${className}`}>
          {children}
          <span
            style={{ transform: showFlyout ? "scaleX(1)" : "scaleX(0)" }}
            className={`absolute -bottom-2 -left-2 -right-2 h-1 origin-left rounded-full transition-transform duration-300 ease-out ${underlineClassName}`}
          />
        </a>
      ) : (
        <button type="button" className={`relative ${className}`}>
          {children}
          <span
            style={{ transform: showFlyout ? "scaleX(1)" : "scaleX(0)" }}
            className={`absolute -bottom-2 -left-2 -right-2 h-1 origin-left rounded-full transition-transform duration-300 ease-out ${underlineClassName}`}
          />
        </button>
      )}
      <AnimatePresence>
        {showFlyout && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            style={{ x: "-50%" }}
            className={`absolute left-1/2 top-12 mt-2 ${flyoutClassName}`}
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-0 -top-14 h-14"
            />
            <div
              className={`absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 ${caretClassName}`}
            />
            <FlyoutContent />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Example;

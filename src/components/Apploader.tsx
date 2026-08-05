import { motion } from "motion/react";
import { ShoppingBag } from "lucide-react";

export function AppLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[color:var(--color-background)]">
      <div className="relative h-20 w-20">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full"
            style={{ backgroundColor: "var(--color-accent)" }}
            initial={{ y: -24, opacity: 0, scale: 0.5 }}
            animate={{ y: 28, opacity: [0, 1, 1, 0], scale: 1 }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.35,
              ease: "easeIn",
            }}
          />
        ))}

        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.5, 1],
          }}>
          <ShoppingBag
            className="h-14 w-14"
            style={{ color: "var(--color-primary)" }}
            strokeWidth={1.75}
          />
        </motion.div>
      </div>

      <div className="flex items-center gap-1 text-sm font-medium text-[color:var(--color-text-secondary)]">
        <span>Menyiapkan produk terbaikmu</span>
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}>
              .
            </motion.span>
          ))}
        </span>
      </div>

      <div className="h-1 w-40 overflow-hidden rounded-full bg-[color:var(--color-border)]">
        <motion.div
          className="h-full w-1/3 rounded-full"
          style={{ backgroundColor: "var(--color-primary)" }}
          animate={{ x: ["-100%", "220%"] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
}

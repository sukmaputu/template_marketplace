import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function CountdownTimer({ deadlineIso }: { deadlineIso: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(deadlineIso) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [deadlineIso]);

  if (!timeLeft) {
    return (
      <span className="text-xs text-destructive font-medium">
        Batas Waktu Telah Habis
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-accent">
      <Clock className="h-3.5 w-3.5 animate-pulse" />
      <span>
        Batal otomatis dlm{" "}
        <strong className="font-semibold text-text">
          {String(timeLeft.hours).padStart(2, "0")}j{" "}
          {String(timeLeft.minutes).padStart(2, "0")}m{" "}
          {String(timeLeft.seconds).padStart(2, "0")}d
        </strong>
      </span>
    </div>
  );
}

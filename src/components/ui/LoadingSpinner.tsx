import { LoaderCircle } from "lucide-react";

type LoadingSpinnerProps = {
  label?: string;
  className?: string;
};

export default function LoadingSpinner({
  label = "Loading…",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-sm text-slate-600 ${className}`}
    >
      <LoaderCircle className="animate-spin" size={20} />
      {label && <span>{label}</span>}
    </div>
  );
}

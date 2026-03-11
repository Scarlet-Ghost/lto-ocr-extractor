interface ConfidenceBadgeProps {
  score: number;
  verified?: boolean;
}

export default function ConfidenceBadge({
  score,
  verified = false,
}: ConfidenceBadgeProps) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-conf-high-bg px-2.5 py-0.5 text-xs font-medium text-conf-high-text">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Verified
      </span>
    );
  }

  let colorClasses: string;
  if (score >= 90) {
    colorClasses = "bg-conf-high-bg text-conf-high-text";
  } else if (score >= 70) {
    colorClasses = "bg-conf-med-bg text-conf-med-text";
  } else {
    colorClasses = "bg-conf-low-bg text-conf-low-text";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses}`}
    >
      {score}%
    </span>
  );
}

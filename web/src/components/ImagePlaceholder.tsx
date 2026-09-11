type Props = {
  label: string;
  className?: string;
  aspect?: string;
  /** Küçük thumbnail: uzun yazı gösterme */
  compact?: boolean;
};

/** Görsel gelene kadar çerçeve; sonra <img> ile değiştirilir */
export function ImagePlaceholder({
  label,
  className = '',
  aspect = 'aspect-[16/10]',
  compact = false,
}: Props) {
  return (
    <div
      className={`${aspect} overflow-hidden rounded-2xl border-2 border-dashed border-ev-border bg-ev-primary-light/60 flex flex-col items-center justify-center gap-1 text-center ${compact ? 'px-1' : 'px-4'} ${className}`}
      role="img"
      aria-label={label}
      title={label}
    >
      <span className={compact ? 'text-base opacity-50' : 'text-2xl opacity-50'}>
        🖼️
      </span>
      {!compact ? (
        <span className="text-xs font-semibold text-ev-muted leading-snug">
          {label}
        </span>
      ) : null}
    </div>
  );
}

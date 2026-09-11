import { Link } from 'react-router-dom';
import type { ConversationContext } from '../api/messaging';

type Props = {
  context: ConversationContext;
  compact?: boolean;
};

export function ConversationContextCard({ context, compact }: Props) {
  if (context.type === 'dm') return null;

  const isListing = context.type === 'listing';
  const eyebrow = isListing ? 'İlan hakkında' : 'Forum konusu hakkında';
  const icon = isListing ? '🚗' : '💬';
  const href =
    context.href ??
    (isListing && context.id
      ? `/ilanlar/${context.id}`
      : context.type === 'topic' && context.id
        ? `/forum/${context.id}`
        : undefined);

  if (compact) {
    return (
      <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-ev-primary">
        <span aria-hidden>{icon}</span>
        <span className="truncate">{context.title}</span>
      </div>
    );
  }

  const inner = (
    <>
      {context.imageUrl ? (
        <img
          src={context.imageUrl}
          alt=""
          className="h-14 w-14 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ev-primary-light text-xl">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ev-primary">
          {eyebrow}
        </p>
        <p className="mt-0.5 truncate text-sm font-extrabold text-ev-text">
          {context.title}
        </p>
        {context.subtitle ? (
          <p className="mt-0.5 truncate text-xs text-ev-muted">
            {context.subtitle}
          </p>
        ) : null}
      </div>
      {href ? (
        <span className="shrink-0 text-xs font-bold text-ev-primary">
          Aç →
        </span>
      ) : null}
    </>
  );

  const className =
    'flex items-center gap-3 rounded-2xl border border-ev-border bg-ev-bg/80 px-3 py-3 transition hover:border-ev-primary/40';

  if (href) {
    return (
      <Link to={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

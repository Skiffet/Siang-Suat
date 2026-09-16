/**
 * The icon set, drawn to Spotify's weight so the chrome reads as one family.
 *
 * Every glyph sits on a 24-unit grid and paints with `currentColor`, so size
 * and colour come from the button around it rather than from props.
 */
type IconProps = { size?: number; className?: string };

function Svg({
  size = 24,
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export function PlayIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7.05 3.606 20.3 11.03a1.11 1.11 0 0 1 0 1.94L7.05 20.394A1.11 1.11 0 0 1 5.4 19.424V4.576a1.11 1.11 0 0 1 1.65-.97Z" />
    </Svg>
  );
}

export function PauseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5.7 3h3.2a.7.7 0 0 1 .7.7v16.6a.7.7 0 0 1-.7.7H5.7a.7.7 0 0 1-.7-.7V3.7a.7.7 0 0 1 .7-.7Zm9.4 0h3.2a.7.7 0 0 1 .7.7v16.6a.7.7 0 0 1-.7.7h-3.2a.7.7 0 0 1-.7-.7V3.7a.7.7 0 0 1 .7-.7Z" />
    </Svg>
  );
}

export function NextIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M17.3 4a.7.7 0 0 1 .7.7v14.6a.7.7 0 0 1-.7.7h-1.6a.7.7 0 0 1-.7-.7V4.7a.7.7 0 0 1 .7-.7h1.6ZM6.9 4.42l6.9 6.86a1 1 0 0 1 0 1.44L6.9 19.58A1 1 0 0 1 5.2 18.86V5.14A1 1 0 0 1 6.9 4.42Z" />
    </Svg>
  );
}

export function PrevIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6.7 4a.7.7 0 0 1 .7.7v14.6a.7.7 0 0 1-.7.7H5.1a.7.7 0 0 1-.7-.7V4.7a.7.7 0 0 1 .7-.7h1.6Zm10.4.42a1 1 0 0 1 1.7.72v13.72a1 1 0 0 1-1.7.72l-6.9-6.86a1 1 0 0 1 0-1.44l6.9-6.86Z" />
    </Svg>
  );
}

export function ShuffleIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M17.1 4.3a.8.8 0 0 1 1.3-.57l2.9 2.5a.8.8 0 0 1 0 1.2l-2.9 2.5a.8.8 0 0 1-1.3-.6V8.1h-1.3c-.9 0-1.5.4-2.2 1.3l-.7 1-1.4-1.9.5-.7C13 6.3 14.1 5.6 15.8 5.6h1.3V4.3ZM3.2 6.9c0-.5.4-.9.9-.9h2c1.8 0 3 .8 4 2.3l3.4 4.9c.7.9 1.3 1.3 2.2 1.3h1.4v-1.2a.8.8 0 0 1 1.3-.6l2.9 2.5a.8.8 0 0 1 0 1.2l-2.9 2.5a.8.8 0 0 1-1.3-.6v-1.3h-1.4c-1.7 0-2.9-.7-4-2.3l-3.4-4.8c-.7-1-1.3-1.3-2.2-1.3h-2a.9.9 0 0 1-.9-.9v-.8Zm7 8.7 1.4-1.9-.6-.9-1.4 2 .6.8Zm-3.5 2c.9 0 1.5-.4 2.2-1.3l-1.4-2-.7 1c-.6.9-1.2 1.3-2.1 1.3h-2a.9.9 0 0 0-.9.9v.8c0 .5.4.9.9.9h2l2-1.6Z" />
    </Svg>
  );
}

export function RepeatIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 5h9.5a4.5 4.5 0 0 1 4.5 4.5V11a1 1 0 1 1-2 0V9.5A2.5 2.5 0 0 0 15.5 7H6v1.6a.7.7 0 0 1-1.2.5L1.9 6.2a.7.7 0 0 1 0-1L4.8 2.3a.7.7 0 0 1 1.2.5V5Zm12 14H8.5A4.5 4.5 0 0 1 4 14.5V13a1 1 0 1 1 2 0v1.5A2.5 2.5 0 0 0 8.5 17H18v-1.6a.7.7 0 0 1 1.2-.5l2.9 2.9a.7.7 0 0 1 0 1l-2.9 2.9a.7.7 0 0 1-1.2-.5V19Z" />
    </Svg>
  );
}

export function HomeIcon({ filled, ...p }: IconProps & { filled?: boolean }) {
  return filled ? (
    <Svg {...p}>
      <path d="M12.3 2.3a1 1 0 0 0-1.3 0l-8.5 7.2a1 1 0 0 0-.4.8V21a1 1 0 0 0 1 1h5.6a.6.6 0 0 0 .6-.6V15a1 1 0 0 1 1-1h2.4a1 1 0 0 1 1 1v6.4c0 .3.3.6.6.6H20a1 1 0 0 0 1-1V10.3a1 1 0 0 0-.4-.8l-8.3-7.2Z" />
    </Svg>
  ) : (
    <Svg {...p}>
      <path d="M12.3 2.3a1 1 0 0 0-1.3 0l-8.5 7.2a1 1 0 0 0-.4.8V21a1 1 0 0 0 1 1h6.2a.6.6 0 0 0 .6-.6V15a.4.4 0 0 1 .4-.4h2.6a.4.4 0 0 1 .4.4v6.4c0 .3.3.6.6.6H20a1 1 0 0 0 1-1V10.3a1 1 0 0 0-.4-.8l-8.3-7.2Zm-.65 1.66 7.35 6.4V20h-4.2v-5a2 2 0 0 0-2-2h-1.6a2 2 0 0 0-2 2v5H4.1v-9.64l7.55-6.4Z" />
    </Svg>
  );
}

export function SearchIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm0 1.8a5.7 5.7 0 1 0 0 11.4 5.7 5.7 0 0 0 0-11.4Zm5.7 11.03 5.06 5.06a.9.9 0 1 1-1.27 1.27l-5.06-5.06 1.27-1.27Z" />
    </Svg>
  );
}

export function LibraryIcon({ filled, ...p }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...p}>
      {filled ? (
        <path d="M3 3h3v18H3V3Zm5.5 0h3v18h-3V3ZM15 4.2l2.9-.78a.5.5 0 0 1 .61.36l4.3 16a.5.5 0 0 1-.35.61l-2.9.78a.5.5 0 0 1-.61-.36l-4.3-16a.5.5 0 0 1 .35-.61Z" />
      ) : (
        <path d="M3 3h3v18H3V3Zm1.5 1.5v15h.01v-15H4.5ZM8.5 3h3v18h-3V3ZM10 4.5v15h.01v-15H10Zm5-.3 2.9-.78a.5.5 0 0 1 .61.36l4.3 16a.5.5 0 0 1-.35.61l-2.9.78a.5.5 0 0 1-.61-.36l-4.3-16a.5.5 0 0 1 .35-.61Zm1.2 1.55 3.9 14.5 1.45-.4-3.9-14.5-1.45.4Z" />
      )}
    </Svg>
  );
}

export function ClockIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 1.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4ZM12 6a.9.9 0 0 1 .9.9v4.73l3.2 1.85a.9.9 0 1 1-.9 1.56l-3.65-2.11a.9.9 0 0 1-.45-.78V6.9A.9.9 0 0 1 12 6Z" />
    </Svg>
  );
}

export function UserIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.6a4.7 4.7 0 1 1 0 9.4 4.7 4.7 0 0 1 0-9.4Zm0 1.8a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8ZM12 13.5c4.4 0 8 2.3 8 5.2V21a.9.9 0 0 1-.9.9H4.9A.9.9 0 0 1 4 21v-2.3c0-2.9 3.6-5.2 8-5.2Zm0 1.8c-3.6 0-6.2 1.8-6.2 3.4v1.4h12.4v-1.4c0-1.6-2.6-3.4-6.2-3.4Z" />
    </Svg>
  );
}

export function ChevronDownIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4.3 8.3a1 1 0 0 1 1.4 0L12 14.6l6.3-6.3a1 1 0 1 1 1.4 1.4l-7 7a1 1 0 0 1-1.4 0l-7-7a1 1 0 0 1 0-1.4Z" />
    </Svg>
  );
}

export function ChevronRightIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8.3 4.3a1 1 0 0 1 1.4 0l7 7a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-1.4-1.4l6.3-6.3-6.3-6.3a1 1 0 0 1 0-1.4Z" />
    </Svg>
  );
}

export function PlusIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3a1 1 0 0 1 1 1v7h7a1 1 0 1 1 0 2h-7v7a1 1 0 1 1-2 0v-7H4a1 1 0 1 1 0-2h7V4a1 1 0 0 1 1-1Z" />
    </Svg>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20.3 5.3a1 1 0 0 1 0 1.4l-11 11a1 1 0 0 1-1.4 0l-4.2-4.2a1 1 0 1 1 1.4-1.4l3.5 3.5 10.3-10.3a1 1 0 0 1 1.4 0Z" />
    </Svg>
  );
}

export function ShareIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.3a1 1 0 0 1 .7.3l3.9 3.9a1 1 0 0 1-1.4 1.4L13 5.7V15a1 1 0 1 1-2 0V5.7L8.8 7.9a1 1 0 0 1-1.4-1.4l3.9-3.9a1 1 0 0 1 .7-.3ZM4.5 12a1 1 0 0 1 1 1v6.2h13V13a1 1 0 1 1 2 0v6.9a1.3 1.3 0 0 1-1.3 1.3H4.8a1.3 1.3 0 0 1-1.3-1.3V13a1 1 0 0 1 1-1Z" />
    </Svg>
  );
}

export function MoreIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="5" cy="12" r="1.9" />
      <circle cx="12" cy="12" r="1.9" />
      <circle cx="19" cy="12" r="1.9" />
    </Svg>
  );
}

export function BellIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.4a6.6 6.6 0 0 1 6.6 6.6v3.7l1.6 3.1a.9.9 0 0 1-.8 1.3H4.6a.9.9 0 0 1-.8-1.3l1.6-3.1V9A6.6 6.6 0 0 1 12 2.4Zm0 1.8A4.8 4.8 0 0 0 7.2 9v4.1L6 15.3h12L16.8 13V9A4.8 4.8 0 0 0 12 4.2ZM9.6 19h4.8a2.4 2.4 0 0 1-4.8 0Z" />
    </Svg>
  );
}

export function SettingsIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 8.4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2Zm0 1.8a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Zm-1.1-8.1h2.2a1 1 0 0 1 1 .8l.3 1.7 1.5.9 1.6-.6a1 1 0 0 1 1.2.45l1.1 1.9a1 1 0 0 1-.22 1.26l-1.3 1.1v1.74l1.3 1.1a1 1 0 0 1 .22 1.26l-1.1 1.9a1 1 0 0 1-1.2.45l-1.6-.6-1.5.9-.3 1.7a1 1 0 0 1-1 .8h-2.2a1 1 0 0 1-1-.8l-.3-1.7-1.5-.9-1.6.6a1 1 0 0 1-1.2-.45l-1.1-1.9a1 1 0 0 1 .22-1.26l1.3-1.1v-1.74l-1.3-1.1a1 1 0 0 1-.22-1.26l1.1-1.9a1 1 0 0 1 1.2-.45l1.6.6 1.5-.9.3-1.7a1 1 0 0 1 1-.8Z" />
    </Svg>
  );
}

export function DownloadIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.5a1 1 0 0 1 1 1v10.1l2.3-2.3a1 1 0 0 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 1.4-1.4l2.3 2.3V3.5a1 1 0 0 1 1-1ZM4.5 14a1 1 0 0 1 1 1v4.2h13V15a1 1 0 1 1 2 0v4.9a1.3 1.3 0 0 1-1.3 1.3H4.8a1.3 1.3 0 0 1-1.3-1.3V15a1 1 0 0 1 1-1Z" />
    </Svg>
  );
}

export function HeadphonesIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3a9 9 0 0 1 9 9v6.2a2.8 2.8 0 0 1-2.8 2.8h-1.4a1.4 1.4 0 0 1-1.4-1.4v-5.2a1.4 1.4 0 0 1 1.4-1.4h2.4V12a7.2 7.2 0 0 0-14.4 0v1h2.4a1.4 1.4 0 0 1 1.4 1.4v5.2A1.4 1.4 0 0 1 7.2 21H5.8A2.8 2.8 0 0 1 3 18.2V12a9 9 0 0 1 9-9Z" />
    </Svg>
  );
}

/** The bars that mark the row you are listening to right now. */
export function EqualizerIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          className="eq-bar"
          x={i * 4 + 1}
          y={2}
          width={2.4}
          height={12}
          rx={1.2}
          fill="var(--brand-green)"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </svg>
  );
}

/** The lotus that stands in for the logo — the one place gold is allowed. */
export function LotusMark({ size = 28, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M16 5c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9s1.3-6.4 3.9-9Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M16 23c-3.7 0-6.7-1.2-9-3.6-.9-1-1.5-2.2-1.8-3.6 2.6-.5 5 0 7.2 1.4 2.1 1.4 3.3 3.3 3.6 5.8Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M16 23c.3-2.5 1.5-4.4 3.6-5.8 2.2-1.4 4.6-1.9 7.2-1.4-.3 1.4-.9 2.6-1.8 3.6-2.3 2.4-5.3 3.6-9 3.6Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M16 24.4c-4.2 0-7.6-1-10.2-3 1.3 3.4 4.7 5.6 10.2 5.6s8.9-2.2 10.2-5.6c-2.6 2-6 3-10.2 3Z"
        fill="currentColor"
        opacity="0.45"
      />
    </svg>
  );
}

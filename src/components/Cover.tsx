import Image from "next/image";

/**
 * Cover art in its 6px-clipped frame — the only visible frame the system puts
 * around content, per DESIGN.md's `album-art-container`.
 */
export function Cover({
  src,
  alt,
  sizes = "(min-width: 1024px) 200px, 45vw",
  rounded = "rounded-md",
  preload = false,
  className = "",
}: {
  src: string;
  alt: string;
  sizes?: string;
  rounded?: string;
  preload?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-square overflow-hidden bg-mid ${rounded} ${className}`}
    >
      <Image
        src={`/covers/${src}.jpg`}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        className="object-cover"
      />
    </div>
  );
}

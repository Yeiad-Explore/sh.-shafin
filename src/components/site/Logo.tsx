import { blades, restPivot } from "@/components/ui/shutter-glyph-footer";

type LogoProps = {
  size?: number;
  className?: string;
  /** When set, the mark is named for assistive tech. Otherwise it is decorative. */
  title?: string;
};

/** The footer shutter at rest. This is the site logo. */
export default function Logo({ size = 28, className, title }: LogoProps) {
  const [px, py] = restPivot(0);
  const parts = blades(px, py, 0);
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {parts.map((pts, i) => (
        <polygon key={i} points={pts.join(" ")} fill="currentColor" />
      ))}
    </svg>
  );
}

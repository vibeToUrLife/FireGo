import { Brand } from "@/components/brand";

/** A quiet footer with the standing honest-disclaimer reminder. */
export function SiteFooter() {
  return (
    <footer className="border-border bg-surface mt-16 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm sm:px-6">
        <Brand />
        <p className="max-w-2xl leading-relaxed">
          FireGo gives you projections, not promises. Real returns vary, markets
          fall as well as rise, and inflation is uncertain — treat every figure
          here as a careful estimate to plan around, not a guarantee.
        </p>
        <p className="text-xs">
          © {2026} FireGo. For education and planning only — not financial
          advice.
        </p>
      </div>
    </footer>
  );
}

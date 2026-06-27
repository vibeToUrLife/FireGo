import { Brand } from "@/components/brand";
import { getDict } from "@/lib/i18n/server";

/** A quiet footer with the standing honest-disclaimer reminder. */
export async function SiteFooter() {
  const t = await getDict();

  return (
    <footer className="border-border bg-surface mt-16 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm sm:px-6">
        <Brand />
        <p className="max-w-2xl leading-relaxed">{t.footer.disclaimer}</p>
        <p className="text-xs">{t.footer.copyright(2026)}</p>
      </div>
    </footer>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t py-8" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 text-xs text-muted">
        <p>ALIN - African Legal Innovation Network</p>
        <p>La transformation du Droit africain à l&apos;ère du numérique.</p>
        <p>
          Ce site fournit des informations juridiques générales. Pour une situation
          personnelle, consultez un avocat.
        </p>
      </div>
    </footer>
  );
}

/** Small print shown at the bottom of every page, above the bottom menu. */
export default function Disclaimer() {
  return (
    <footer className="content-pad mt-8 px-5 text-center text-[11px] leading-snug text-muted">
      <p>
        This app is a personal record-keeping tool, not medical advice. Doses, percentiles and
        other figures are for reference only and may contain errors; always check the product
        label and ask a healthcare provider. You use it at your own risk, and its author accepts
        no responsibility or liability for any decision made, or harm arising, from its use.
      </p>
    </footer>
  );
}

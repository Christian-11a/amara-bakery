import Link from "next/link";
import { MotionPreferenceSelect } from "@/components/motion-toggle";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="site-footer__close">Until the next warm thing,<br /><span className="site-footer__signoff">— Amara Bakery</span></p>
      <div className="site-footer__lower">
        <nav className="site-footer__nav" aria-label="Footer navigation">
          <Link href="/">Home</Link>
          <Link href="/menu">Menu</Link>
          <Link href="/order">Your order</Link>
        </nav>
        <address className="site-footer__address">Sample address · 18 Alder Lane · Juniper Hill, Manila</address>
        <span className="site-footer__demo-note">Fictional bakery portfolio demo</span>
        <MotionPreferenceSelect className="site-footer__motion-toggle" />
        <span>© {new Date().getFullYear()} Amara Bakery</span>
      </div>
    </footer>
  );
}

/**
 * Signal Utility design reminder: an editorial, practical navigation with visible privacy cues.
 */
import { Link, useLocation } from "wouter";
import { LockKeyhole, Menu, X } from "lucide-react";
import { useState } from "react";

const logoUrl = "/manus-storage/convert-any-image-logo_62ae4ddc.png";

const navigation = [
  { href: "/", label: "Convertir" },
  { href: "/compress", label: "Compresser" },
  { href: "/blog", label: "Guides" },
  { href: "/about", label: "À propos" },
];

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#f4f0e8] text-[#132432]">
      <header className="sticky top-0 z-50 border-b border-[#132432]/10 bg-[#f4f0e8]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="Convert Any Image — accueil">
            <img src={logoUrl} className="h-11 w-11 object-contain" alt="Symbole Convert Any Image" />
            <span className="font-display text-[1.02rem] font-bold tracking-[-0.065em] text-[#132432]">convert<span className="text-[#5c7820]">any</span>image</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${location === item.href ? "bg-[#132432] text-[#f4f0e8]" : "text-[#41525d] hover:bg-[#132432]/7 hover:text-[#132432]"}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 rounded-full border border-[#132432]/10 bg-white/70 px-3 py-2 text-[0.68rem] font-bold tracking-[0.12em] text-[#41525d] sm:flex">
            <LockKeyhole className="h-3.5 w-3.5 text-[#5c7820]" />
            100 % LOCAL
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-full border border-[#132432]/12 lg:hidden" onClick={() => setOpen(!open)} aria-label="Ouvrir le menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && <nav className="border-t border-[#132432]/10 bg-[#f4f0e8] px-5 py-4 lg:hidden">{navigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block border-b border-[#132432]/8 py-3 font-semibold">{item.label}</Link>)}</nav>}
      </header>
      {children}
      <footer className="border-t border-[#f4f0e8]/15 bg-[#132432] text-[#f4f0e8]">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 md:grid-cols-[1.3fr_1fr_1fr] lg:px-10">
          <div>
            <div className="mb-4 flex items-center gap-3"><img src={logoUrl} className="h-10 w-10" alt="" /><span className="font-display text-lg font-bold tracking-[-0.06em]">convertanyimage</span></div>
            <p className="max-w-sm text-sm leading-6 text-[#d8d2c5]/72">Conversion et compression dans votre navigateur. Vos images ne quittent pas votre appareil.</p>
          </div>
          <div className="text-sm"><p className="mb-3 text-[0.68rem] font-bold tracking-[0.16em] text-[#b7f840]">OUTILS</p><div className="space-y-2 text-[#d8d2c5]/78"><Link href="/">Convertir des images</Link><br/><Link href="/compress">Compresser des images</Link><br/><Link href="/blog">Guides de formats</Link></div></div>
          <div className="text-sm"><p className="mb-3 text-[0.68rem] font-bold tracking-[0.16em] text-[#b7f840]">LÉGAL</p><div className="space-y-2 text-[#d8d2c5]/78"><Link href="/privacy">Confidentialité</Link><br/><Link href="/terms">Conditions</Link><br/><Link href="/cookie-policy">Cookies</Link></div></div>
        </div>
      </footer>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-white/5 bg-gradient-to-b from-surface-container-lowest to-black">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-margin-edge py-lg flex flex-col md:flex-row justify-between items-center gap-md">
        <div className="flex flex-col items-center md:items-start gap-xs">
          <span className="bebas-headline text-2xl text-primary tracking-widest">⚽ WORLDCUP LIVE</span>
          <p className="font-body-sm text-[11px] text-on-surface-variant/60 tracking-wider uppercase">
            © 2024 WorldCup Live · The Gold Standard of Football
          </p>
        </div>
        <nav className="flex flex-wrap justify-center gap-md">
          {["Privacy", "Terms", "Support", "Contact"].map((l) => (
            <a key={l} href="#" className="font-label-caps text-[10px] tracking-widest text-on-surface-variant/60 hover:text-primary transition-colors uppercase">
              {l}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

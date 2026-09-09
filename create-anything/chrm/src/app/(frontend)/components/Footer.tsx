import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t-4 border-[#C9A84C] bg-[#1B3A6B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Col 1: Heritage */}
          <div className="md:col-span-2">
            <h3 className="font-serif text-2xl font-bold tracking-wide">St Andrew's School, Turi</h3>
            <p className="mt-1 text-xs tracking-widest text-[#C9A84C] uppercase">The Old Turian Society</p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">
              Preserving our heritage, fostering lifelong connections across East Africa and globally, and supporting future generations since 1931.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-serif text-base font-semibold tracking-wider text-[#C9A84C] uppercase">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-xs uppercase tracking-wider text-white/80">
              <li><Link href="/login" className="hover:text-[#C9A84C]">Alumni Directory</Link></li>
              <li><Link href="/payments" className="hover:text-[#C9A84C]">Membership </Link></li>
              <li><Link href="/events" className="hover:text-[#C9A84C]">Global Events</Link></li>
              <li><Link href="/merchandise" className="hover:text-[#C9A84C]">Official Store</Link></li>
            </ul>
          </div>

          {/* Col 3: Contact */}
          <div>
            <h4 className="font-serif text-base font-semibold tracking-wider text-[#C9A84C] uppercase">Contact Office</h4>
            <p className="mt-4 text-xs leading-relaxed text-white/80">
              St Andrew's School, Turi<br />
              P.O. Private Bag, Molo 20106<br />
              Kenya<br />
              <span className="mt-2 block text-[#C9A84C]">oldturians@standrewsturi.com</span>
            </p>
          </div>
        </div>
<div className="flex items-center gap-4">
  <img 
    src="/St-Andrews-Turi.png" 
    alt="St Andrew's Turi" 
    className="h-12 w-auto object-contain"
  />
  <div>
    <h3 className="font-serif text-lg font-bold text-[#1B3A6B]">
      St Andrew's Turi
    </h3>
    <p className="text-xs text-[#1B3A6B]/60">
      Est. 1931 · Seeking the Highest
    </p>
  </div>
</div>
      </div>
    </footer>
  );
}
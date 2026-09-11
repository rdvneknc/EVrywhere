import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-ev-divider bg-ev-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <div>
          <div className="text-lg font-extrabold tracking-tight">
            <span className="text-ev-primary">EV</span>rywhere
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
            Türkiye elektrikli araç forumu, 2. el pazarı ve şarj haritası. Mobil
            uygulama ile aynı topluluk.
          </p>
        </div>

        <div>
          <div className="text-sm font-bold">Keşfet</div>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>
              <Link to="/forum" className="hover:text-ev-primary">
                Forum
              </Link>
            </li>
            <li>
              <Link to="/ilanlar" className="hover:text-ev-primary">
                2. El ilanlar
              </Link>
            </li>
            <li>
              <Link to="/sarj" className="hover:text-ev-primary">
                Şarj haritası
              </Link>
            </li>
            <li>
              <Link to="/haberler" className="hover:text-ev-primary">
                Haberler
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-bold">Hesap</div>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>
              <Link to="/giris" className="hover:text-ev-primary">
                Giriş / Kayıt
              </Link>
            </li>
            <li>
              <Link to="/profil" className="hover:text-ev-primary">
                Profilim
              </Link>
            </li>
            <li>
              <Link to="/mesajlar" className="hover:text-ev-primary">
                Mesajlar
              </Link>
            </li>
            <li>
              <Link to="/ilanlar/yeni" className="hover:text-ev-primary">
                İlan ver
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-bold">Yasal</div>
          <ul className="mt-3 space-y-2 text-sm text-white/50">
            <li>Gizlilik (yakında)</li>
            <li>Kullanım şartları (yakında)</li>
            <li>İletişim (yakında)</li>
          </ul>
          <div className="mt-5 flex gap-3 text-white/60">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm">
              in
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm">
              X
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm">
              ▶
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/45">
        © {new Date().getFullYear()} EVrywhere · Türkiye
      </div>
    </footer>
  );
}

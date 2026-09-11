import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { subscribeUserNotifications } from '../api/notifications';
import { useTheme } from '../theme/ThemeContext';

const NAV = [
  { label: 'Ana Sayfa', to: '/' },
  { label: 'Forum', to: '/forum' },
  { label: '2. El', to: '/ilanlar' },
  { label: 'Şarj', to: '/sarj' },
  { label: 'Haberler', to: '/haberler' },
];

const ACCOUNT_MENU = [
  { label: 'Profilim', to: '/profil' },
  { label: 'Garajım', to: '/profil?tab=garage' },
  { label: 'Konularım', to: '/profil?tab=forum' },
  { label: 'İlanlarım', to: '/profil?tab=listings' },
  { label: 'Mesajlar', to: '/mesajlar' },
  { label: 'Kaydedilenler', to: '/kaydedilenler' },
];

function initialsFromUser(displayName: string | null, email: string | null) {
  const name = (displayName || email || 'EV').trim();
  const parts = name.split(/[\s@._-]+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'EV'
  );
}

export function Header() {
  const { user, logOut, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifUnread, setNotifUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) {
      setNotifUnread(0);
      return;
    }
    return subscribeUserNotifications(user.uid, (items) => {
      setNotifUnread(items.filter((n) => !n.isRead).length);
    });
  }, [user]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenuOpen(true);
  };

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenuOpen(false), 160);
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) {
      navigate('/ilanlar');
      return;
    }
    navigate(`/ilanlar?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ev-divider bg-ev-surface/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 lg:gap-6 lg:px-6 lg:py-5">
        <Link to="/" className="shrink-0 leading-tight">
          <span className="block text-2xl font-extrabold tracking-tight text-ev-text lg:text-[1.7rem]">
            <span className="text-ev-primary">EV</span>rywhere
          </span>
          <span className="mt-0.5 block text-xs font-semibold text-ev-primary">
            Türkiye EV topluluğu
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `relative px-3.5 py-2 text-[15px] font-semibold transition ${
                  isActive
                    ? 'text-ev-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-ev-primary'
                    : 'text-ev-muted hover:text-ev-text'
                }`
              }
              end={item.to === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <form
            onSubmit={onSearch}
            className="relative hidden min-w-[180px] md:block lg:min-w-[220px]"
          >
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ev-hint">
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İlan veya model ara…"
              className="w-full rounded-full border border-ev-border bg-ev-bg py-2.5 pl-9 pr-3 text-sm text-ev-text outline-none placeholder:text-ev-hint focus:border-ev-primary"
            />
          </form>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'
            }
            title={theme === 'dark' ? 'Açık tema' : 'Koyu tema'}
            className="grid h-11 w-11 place-items-center rounded-full text-ev-muted transition hover:bg-ev-primary-light hover:text-ev-primary"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {!loading && user ? (
            <>
              <Link
                to="/bildirimler"
                aria-label={
                  notifUnread > 0
                    ? `${notifUnread} okunmamış bildirim`
                    : 'Bildirimler'
                }
                className="relative grid h-11 w-11 place-items-center rounded-full text-ev-muted transition hover:bg-ev-primary-light hover:text-ev-primary"
              >
                <BellIcon />
                {notifUnread > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-ev-surface" />
                ) : null}
              </Link>

              <div
                ref={menuRef}
                className="relative"
                onMouseEnter={openMenu}
                onMouseLeave={scheduleClose}
              >
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="grid h-11 w-11 place-items-center rounded-full bg-ev-primary text-xs font-extrabold text-white shadow-sm transition hover:bg-ev-primary-dark"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-label="Hesap menüsü"
                >
                  {initialsFromUser(user.displayName, user.email)}
                </button>

                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-2xl border border-ev-border bg-ev-surface py-1.5 shadow-lg shadow-black/25"
                    onMouseEnter={openMenu}
                    onMouseLeave={scheduleClose}
                  >
                    <div className="border-b border-ev-divider px-4 py-2.5">
                      <p className="truncate text-sm font-bold text-ev-text">
                        {user.displayName || 'Kullanıcı'}
                      </p>
                      <p className="truncate text-xs text-ev-hint">
                        {user.email}
                      </p>
                    </div>
                    {ACCOUNT_MENU.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-left text-sm font-semibold text-ev-muted transition hover:bg-ev-bg hover:text-ev-text"
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="my-1 border-t border-ev-divider" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        void logOut();
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      Çıkış yap
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <Link
              to="/giris"
              className="rounded-full bg-ev-primary px-5 py-2.5 text-sm font-extrabold text-white hover:bg-ev-primary-dark"
            >
              Giriş
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="stroke-current"
    >
      <circle cx="11" cy="11" r="7" strokeWidth="1.8" />
      <path d="M20 20l-3.5-3.5" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="stroke-current"
    >
      <path
        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 17a2.5 2.5 0 0 0 5 0"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="stroke-current"
    >
      <path
        d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5Z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="stroke-current"
    >
      <circle cx="12" cy="12" r="4" strokeWidth="1.8" />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

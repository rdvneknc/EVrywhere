import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { createListing } from '../api/listings';
import { useAuth } from '../auth/AuthContext';
import {
  DRIVETRAIN_OPTIONS,
  VEHICLE_COLORS,
  WARRANTY_OPTIONS,
  getModelSpecs,
} from '../data/evModelSpecs';
import {
  EV_BRANDS,
  TURKEY_PROVINCES,
  formatPriceFull,
  normalizeTr,
} from '../data/marketplace';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from(
  { length: CURRENT_YEAR - 2010 + 1 },
  (_, i) => CURRENT_YEAR - i,
);
const CHARGE_TYPES = ['CCS2', 'CHAdeMO', 'Type2'] as const;

const inputClass =
  'mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-3 py-2.5 text-sm text-ev-text outline-none focus:border-ev-primary';

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

function formatThousands(digits: string): string {
  if (!digits) return '';
  return Number(digits).toLocaleString('tr-TR');
}

export function NewListingPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [brandId, setBrandId] = useState(EV_BRANDS[0].id);
  const brand = EV_BRANDS.find((b) => b.id === brandId) ?? EV_BRANDS[0];
  const [model, setModel] = useState(brand.models[0] ?? '');
  const [year, setYear] = useState(CURRENT_YEAR);
  const [priceDigits, setPriceDigits] = useState('');
  const [kmDigits, setKmDigits] = useState('');
  const [location, setLocation] = useState('İstanbul');
  const [cityQuery, setCityQuery] = useState('');
  const [sellerType, setSellerType] = useState('Sahibinden');
  const [damageStatus, setDamageStatus] = useState('Kazasız');
  const [description, setDescription] = useState('');
  const [batteryHealth, setBatteryHealth] = useState(95);
  const [color, setColor] = useState<string>(VEHICLE_COLORS[0]);
  const [warranty, setWarranty] = useState<string>(WARRANTY_OPTIONS[0]);
  const [range, setRange] = useState(400);
  const [chargeType, setChargeType] = useState('CCS2');
  const [acChargePower, setAcChargePower] = useState(11);
  const [dcChargePower, setDcChargePower] = useState(150);
  const [batteryCapacity, setBatteryCapacity] = useState(75);
  const [motorPower, setMotorPower] = useState(200);
  const [drivetrain, setDrivetrain] = useState('Arkadan İtiş');
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/giris?next=/ilanlar/yeni', { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const nextModel = brand.models[0] ?? '';
    setModel(nextModel);
  }, [brandId]); // eslint-disable-line react-hooks/exhaustive-deps -- brand follows brandId

  useEffect(() => {
    if (!model) return;
    const specs = getModelSpecs(brandId, model);
    setRange(specs.range);
    setChargeType(specs.chargeType);
    setAcChargePower(specs.acChargePower);
    setDcChargePower(specs.dcChargePower);
    setBatteryCapacity(specs.batteryCapacity);
    setMotorPower(specs.motorPower);
    setDrivetrain(specs.drivetrain);
  }, [brandId, model]);

  const previews = useMemo(
    () => files.map((f) => ({ url: URL.createObjectURL(f), name: f.name })),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const cityOptions = useMemo(() => {
    const q = normalizeTr(cityQuery);
    if (!q) return [...TURKEY_PROVINCES];
    return TURKEY_PROVINCES.filter((c) => normalizeTr(c).includes(q));
  }, [cityQuery]);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files, ...Array.from(incoming)].slice(0, 8);
    setFiles(next);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      if (files.length < 1) throw new Error('En az 1 fotoğraf ekle.');
      if (!model.trim()) throw new Error('Model seç.');

      const priceNum = Number(priceDigits);
      const kmNum = Number(kmDigits);
      if (!priceNum || priceNum < 10_000) {
        throw new Error('Geçerli bir fiyat gir (en az 10.000 ₺).');
      }
      if (Number.isNaN(kmNum) || kmNum < 0) {
        throw new Error('Geçerli bir kilometre gir.');
      }
      if (!TURKEY_PROVINCES.includes(location as (typeof TURKEY_PROVINCES)[number])) {
        throw new Error('Listeden geçerli bir il seç.');
      }
      if (batteryHealth < 1 || batteryHealth > 100) {
        throw new Error('Batarya sağlığı 1–100 arasında olmalı.');
      }
      if (!range || !batteryCapacity || !acChargePower || !dcChargePower || !motorPower) {
        throw new Error('Teknik özellikleri kontrol et.');
      }

      const id = await createListing(user, {
        brandId,
        model,
        year,
        price: priceNum,
        km: kmNum,
        location,
        sellerType,
        damageStatus,
        description,
        batteryHealth,
        range,
        chargeType,
        color,
        warranty,
        acChargePower,
        dcChargePower,
        batteryCapacity,
        motorPower,
        drivetrain,
        photoFiles: files,
      });
      navigate(`/ilanlar/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İlan kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-svh bg-ev-bg">
        <Header />
        <p className="p-10 text-center text-sm text-ev-muted">Yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-ev-bg">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10 lg:px-6">
        <Link to="/ilanlar" className="text-sm font-semibold text-ev-primary">
          ← İlanlar
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ev-text">
          İlan ver
        </h1>
        <p className="mt-1 text-sm text-ev-muted">
          En az 1 fotoğraf ekle. İlk fotoğraf kapak görseli olur.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <Section title="Fotoğraflar">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={files.length >= 8}
                className="flex h-24 w-28 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ev-primary/50 bg-ev-primary-light text-xs font-bold text-ev-primary-dark disabled:opacity-50"
              >
                <span className="text-lg">＋</span>
                Ekle ({files.length}/8)
              </button>
              {previews.map((p, i) => (
                <div
                  key={`${p.name}-${i}`}
                  className="relative h-24 w-28 overflow-hidden rounded-xl border border-ev-border"
                >
                  <img
                    src={p.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {i === 0 ? (
                    <span className="absolute left-1 top-1 rounded bg-ev-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Kapak
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/65 text-xs font-bold text-white"
                    aria-label="Fotoğrafı kaldır"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-ev-hint">
              JPG/PNG/WebP · en fazla 8 adet · otomatik sıkıştırılır
            </p>
          </Section>

          <Section title="Araç">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Marka">
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className={inputClass}
                >
                  {EV_BRANDS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Model">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className={inputClass}
                >
                  {brand.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Model yılı">
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className={inputClass}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Renk">
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className={inputClass}
                >
                  {VEHICLE_COLORS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fiyat (₺)">
                <input
                  value={formatThousands(priceDigits)}
                  onChange={(e) => setPriceDigits(digitsOnly(e.target.value))}
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="örn. 1.850.000"
                  required
                />
                {priceDigits ? (
                  <p className="mt-1 text-[11px] text-ev-hint">
                    {formatPriceFull(Number(priceDigits))}
                  </p>
                ) : null}
              </Field>
              <Field label="Kilometre">
                <input
                  value={formatThousands(kmDigits)}
                  onChange={(e) => setKmDigits(digitsOnly(e.target.value))}
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="örn. 24.000"
                  required
                />
              </Field>
            </div>
          </Section>

          <Section title="Konum">
            <Field label="İl">
              <input
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                className={inputClass}
                placeholder="İl ara…"
              />
            </Field>
            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-ev-border">
              {cityOptions.length === 0 ? (
                <p className="px-3 py-2 text-xs text-ev-hint">İl bulunamadı</p>
              ) : (
                cityOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setLocation(c);
                      setCityQuery('');
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm ${
                      location === c
                        ? 'bg-ev-primary-light font-bold text-ev-primary-dark'
                        : 'text-ev-muted hover:bg-ev-bg'
                    }`}
                  >
                    {c}
                  </button>
                ))
              )}
            </div>
            <p className="mt-2 text-xs text-ev-muted">
              Seçili il:{' '}
              <span className="font-bold text-ev-text">{location}</span>
            </p>
          </Section>

          <Section title="Satış bilgisi">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kimden">
                <select
                  value={sellerType}
                  onChange={(e) => setSellerType(e.target.value)}
                  className={inputClass}
                >
                  <option value="Sahibinden">Sahibinden</option>
                  <option value="Galeriden">Galeriden</option>
                </select>
              </Field>
              <Field label="Hasar durumu">
                <select
                  value={damageStatus}
                  onChange={(e) => setDamageStatus(e.target.value)}
                  className={inputClass}
                >
                  <option value="Kazasız">Kazasız</option>
                  <option value="Kazalı">Kazalı</option>
                </select>
              </Field>
              <Field label="Garanti">
                <select
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  className={inputClass}
                >
                  {WARRANTY_OPTIONS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Batarya sağlığı (%)">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={batteryHealth}
                  onChange={(e) => setBatteryHealth(Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Açıklama (opsiyonel)">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={3000}
                className={inputClass}
                placeholder="Araç hakkında kısa bilgi…"
              />
              <p className="mt-1 text-right text-[11px] text-ev-hint">
                {description.length}/3000
              </p>
            </Field>
          </Section>

          <Section title="Teknik özellikler">
            <p className="mb-3 text-xs text-ev-muted">
              Model seçilince otomatik dolar; dilersen düzelt.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Menzil (km)">
                <input
                  type="number"
                  min={1}
                  value={range}
                  onChange={(e) => setRange(Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="Pil kapasitesi (kWh)">
                <input
                  type="number"
                  min={1}
                  value={batteryCapacity}
                  onChange={(e) => setBatteryCapacity(Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="AC şarj (kW)">
                <input
                  type="number"
                  min={1}
                  step={0.1}
                  value={acChargePower}
                  onChange={(e) => setAcChargePower(Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="DC şarj (kW)">
                <input
                  type="number"
                  min={1}
                  value={dcChargePower}
                  onChange={(e) => setDcChargePower(Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="Motor gücü (hp)">
                <input
                  type="number"
                  min={1}
                  value={motorPower}
                  onChange={(e) => setMotorPower(Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="Çekiş">
                <select
                  value={drivetrain}
                  onChange={(e) => setDrivetrain(e.target.value)}
                  className={inputClass}
                >
                  {DRIVETRAIN_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Şarj tipi">
                <select
                  value={chargeType}
                  onChange={(e) => setChargeType(e.target.value)}
                  className={inputClass}
                >
                  {CHARGE_TYPES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving || files.length < 1}
            className="w-full rounded-full bg-ev-primary py-3.5 text-sm font-extrabold text-white hover:bg-ev-primary-dark disabled:opacity-60"
          >
            {saving ? 'Yayınlanıyor…' : 'İlanı yayınla'}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ev-border bg-ev-surface p-5">
      <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-ev-text">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-left">
      <span className="text-xs font-bold text-ev-muted">{label}</span>
      {children}
    </label>
  );
}

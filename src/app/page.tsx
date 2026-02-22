import Link from 'next/link';
import {
  Package,
  BarChart3,
  Clock,
  TrendingUp,
  ChevronRight,
  Check,
  ArrowRight,
  Boxes,
  Bell,
  LineChart,
} from 'lucide-react';

export const metadata = {
  title: 'GroceryIMS — Smart Grocery Inventory Management',
  description:
    'Track stock, monitor expiry dates, and analyze sales for your grocery store. Real-time alerts, expiry tracking, and sales analytics.',
};

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-white text-gray-900 overflow-x-hidden">
      {/* ─── NAVBAR ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">GroceryIMS</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How it works</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-emerald-600 hover:to-teal-700 transition-all"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-teal-50/40 to-white pt-20 pb-32">
        {/* Decorative blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-r from-emerald-200/40 to-teal-200/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-40 -right-40 h-[400px] w-[400px] rounded-full bg-emerald-100/60 blur-3xl"
        />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] text-gray-900">
            Grocery Inventory
            <span className="block bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Managed Smarter
            </span>
          </h1>

          <p className="mt-6 mx-auto max-w-2xl text-lg text-gray-600 leading-relaxed">
            Track every product, get expiry alerts before they cost you, and
            understand your best-sellers — all in a single, beautiful dashboard.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:from-emerald-600 hover:to-teal-700 transition-all"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              Explore features
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-gray-500">
            {['Real-time Alerts', 'Expiry Tracking', 'Sales Analytics', 'Stock Management'].map(
              (badge) => (
                <span key={badge} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  {badge}
                </span>
              )
            )}
          </div>
        </div>

        {/* Mock dashboard preview */}
        <div className="relative mx-auto mt-20 max-w-5xl px-6">
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200/80">
            {/* Fake browser chrome */}
            <div className="flex h-10 items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-4">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
              <div className="ml-4 flex-1 max-w-xs rounded-md bg-gray-200 h-5" />
            </div>
            {/* Fake dashboard UI */}
            <div className="bg-gray-50 p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Total Products', value: '1,248', color: 'text-emerald-600' },
                  { label: 'Low Stock', value: '14', color: 'text-amber-600' },
                  { label: "Today's Revenue", value: '₱ 48,220', color: 'text-teal-600' },
                  { label: 'Expiring Soon', value: '7', color: 'text-red-500' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                    <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                    <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 h-32 flex items-end gap-1 overflow-hidden">
                {[40, 55, 35, 70, 60, 80, 65, 90, 75, 85, 68, 95].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-gradient-to-t from-emerald-500 to-teal-400 opacity-80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 h-20 w-3/4 bg-emerald-400/20 blur-3xl rounded-full pointer-events-none" />
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────────── */}
      <section id="features" className="py-28 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Everything you need to run your store
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto text-base">
              From daily stock-ins to monthly revenue reports — GroceryIMS covers the
              entire lifecycle of your grocery inventory.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Boxes,
                title: 'Inventory Tracking',
                desc: 'Add products with 15+ unit types. Stock auto-deducts on every sale using FIFO batch logic.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: Clock,
                title: 'Expiry Monitoring',
                desc: 'Per-batch expiry dates with 7-day warning alerts and critical expired alerts generated automatically.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: BarChart3,
                title: 'Sales Analytics',
                desc: 'Daily/monthly revenue charts, top-selling products, and slow-moving item reports in one view.',
                color: 'bg-teal-50 text-teal-600',
              },
              {
                icon: Bell,
                title: 'Smart Alerts',
                desc: 'Low-stock and expiry alerts surface instantly in the topbar. Resolve or dismiss per alert.',
                color: 'bg-red-50 text-red-500',
              },
              {
                icon: TrendingUp,
                title: 'Fast & Slow Movers',
                desc: 'Understand which products need promotion and which are flying off shelves with movement analytics.',
                color: 'bg-sky-50 text-sky-600',
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              How it works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Up and running in minutes
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                icon: Package,
                title: 'Set up your catalogue',
                desc: 'Add products with categories, suppliers, SKUs, and preferred units. Import or create directly.',
              },
              {
                step: '02',
                icon: Boxes,
                title: 'Log stock batches',
                desc: 'Record every goods receipt with expiry dates. FIFO ensures oldest stock is sold first automatically.',
              },
              {
                step: '03',
                icon: LineChart,
                title: 'Analyse & act',
                desc: 'View live alerts, revenue charts, and product movement reports to make smarter purchase decisions.',
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <span className="block text-xs font-bold text-emerald-500 mb-1">STEP {step}</span>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-px shadow-2xl shadow-emerald-200">
            <div className="rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-10 py-16 text-white">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Ready to take control <br className="hidden sm:block" />of your inventory?
              </h2>
              <p className="mt-4 text-emerald-100 text-base max-w-lg mx-auto">
                Sign in and start managing your grocery store with confidence — real-time
                stock, expiry alerts, and sales insights await.
              </p>
              <div className="mt-8 flex items-center justify-center">
                <Link
                  href="/login"
                  className="group flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-emerald-700 shadow-lg hover:bg-emerald-50 transition-colors"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-10 bg-white">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600">
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-600">GroceryIMS</span>
          </div>
          <p>© {new Date().getFullYear()} GroceryIMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}



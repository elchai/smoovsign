import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Menu, X, FileText, LayoutTemplate, ClipboardList, Webhook, Send, PenLine, Users,
  PlayCircle, ArrowLeft, CheckCircle2, Settings, Sheet,
} from 'lucide-react';
import { STROKE, WhatsAppIcon } from './ui.jsx';
import PhoneMock, { PhoneChip } from './PhoneMock.jsx';

export const WA = `https://wa.me/972542012000?text=${encodeURIComponent('שלום, אשמח לשמוע פרטים על SmoovSign (סמובסיין)')}`;
export const APP = 'https://smoovsign.com/app.html';

const NAV = [
  ['#features', 'יכולות'],
  ['#audience', 'למי זה מתאים'],
  ['#how', 'איך זה עובד'],
  ['#pricing', 'מחירים'],
  ['#faq', 'שאלות נפוצות'],
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={`sticky top-0 z-50 border-b transition duration-300 ${scrolled ? 'border-white/10 bg-night/85 shadow-[0_10px_40px_-20px_rgba(0,0,0,.8)] backdrop-blur-xl' : 'border-transparent bg-night backdrop-blur-md'}`}>
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-5">
        <a href="#top" className="flex items-center gap-2.5" aria-label="SmoovSign, לראש העמוד">
          <img src="/lp/img/logo.svg" width="44" height="44" alt="" className="h-11 w-11 rounded-xl drop-shadow-md" />
          <span className="flex flex-col leading-tight"><span className="text-2xl font-black tracking-tight text-white">SmoovSign</span><span className="max-w-[11rem] text-[10.5px] font-medium text-white/55 sm:max-w-none sm:text-xs">מערכת מתקדמת לחתימה דיגיטלית</span></span>
        </a>
        <nav aria-label="ראשי" className="hidden items-center gap-8 lg:flex">
          {NAV.map(([h, l]) => <a key={h} href={h} className="font-medium text-white/70 transition hover:text-aqua">{l}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <a href="#join" className="btn-cta hidden !px-5 !py-2.5 sm:inline-flex">דברו איתנו</a>
          <a href={APP} className="btn-line hidden !px-5 !py-2.5 md:inline-flex">כניסה למערכת</a>
          <button type="button" className="grid h-11 w-11 place-items-center rounded-xl border border-white/20 bg-white/10 text-white lg:hidden" aria-label={open ? 'סגירת תפריט' : 'פתיחת תפריט'} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <X size={22} strokeWidth={STROKE} /> : <Menu size={22} strokeWidth={STROKE} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/10 bg-night lg:hidden" aria-label="תפריט נייד">
            <div className="grid gap-1 px-5 py-4">
              {NAV.map(([h, l]) => <a key={h} href={h} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 font-medium text-white/80 hover:bg-white/10">{l}</a>)}
              <a href="#join" onClick={() => setOpen(false)} className="btn-cta mt-2">דברו איתנו</a>
              <a href={APP} className="btn-line">כניסה למערכת</a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

// ───────── תצוגה מקדימה אינטראקטיבית של המערכת (נתוני הדגמה) ─────────
const TABS = [
  { key: 'docs', label: 'מסמכים', icon: FileText },
  { key: 'tpl', label: 'תבניות', icon: LayoutTemplate },
  { key: 'forms', label: 'טפסים', icon: ClipboardList },
  { key: 'hooks', label: 'חיבורים', icon: Webhook },
];

const DOCS = [
  ['הסכם שכירות דירה', 'דנה אברהמי', 'נחתם', 'bg-emerald-100 text-emerald-700'],
  ['הצעת מחיר 2041', 'סטודיו ארז לוי', 'ממתין לחתימה', 'bg-amber-100 text-amber-700'],
  ['הסכם סודיות', 'רמי סבג', 'נשלח', 'bg-sky-100 text-sky-700'],
  ['טופס הצטרפות', 'ליאור נחום', 'נחתם', 'bg-emerald-100 text-emerald-700'],
];
const TPL = [['הסכם שירות', '4 שדות'], ['הצעת מחיר', '3 שדות'], ['טופס הסכמה', '5 שדות'], ['אישור קבלה', '2 שדות']];

function Frame({ tab }) {
  if (tab === 'docs') return (
    <div className="grid gap-2.5">
      {DOCS.map(([t, f, s, c]) => (
        <div key={t} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700"><FileText size={18} strokeWidth={STROKE} /></span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-ink">{t}</p><p className="text-xs text-slate-500">{f}</p></div>
          <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${c}`}>{s}</span>
        </div>
      ))}
    </div>
  );
  if (tab === 'tpl') return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {TPL.map(([n, s]) => (
        <div key={n} className="rounded-2xl bg-white p-3.5 shadow-sm">
          <p className="flex items-center gap-1.5 font-black text-ink"><LayoutTemplate size={15} strokeWidth={STROKE} className="text-brand-600" />{n}</p>
          <p className="mt-1 text-xs text-slate-500">{s} · מוכנה לשליחה</p>
          <div className="mt-2.5 grid gap-1"><span className="h-1.5 rounded bg-slate-100" /><span className="h-1.5 w-2/3 rounded bg-slate-100" /></div>
        </div>
      ))}
    </div>
  );
  if (tab === 'forms') return (
    <div className="grid gap-2.5">
      {[['שם מלא', 'fullname'], ['מספר זהות', 'id_number'], ['תאריך', 'date_auto']].map(([l, k]) => (
        <div key={k} className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm"><span className="text-sm font-bold text-ink">{l}</span><span className="rounded-lg bg-brand-50 px-2.5 py-1 font-mono text-[11px] text-brand-700" dir="ltr">{k}</span></div>
      ))}
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 py-3 font-bold text-white shadow-lg shadow-brand-600/30"><PenLine size={18} strokeWidth={STROKE} />שדה חתימה</div>
    </div>
  );
  return (
    <div className="grid gap-2.5">
      <div className="rounded-2xl bg-white p-3.5 shadow-sm">
        <p className="flex items-center gap-1.5 text-sm font-black text-ink"><Webhook size={15} strokeWidth={STROKE} className="text-brand-600" />Webhook</p>
        <p className="mt-2 rounded-xl bg-brand-900 p-2.5 font-mono text-[10.5px] leading-relaxed text-sky-200" dir="ltr">POST https://your-site.com/hook<br />{'{ "event": "form_completed" }'}</p>
      </div>
      <div className="rounded-2xl bg-white p-3.5 shadow-sm">
        <p className="flex items-center gap-1.5 text-sm font-black text-ink"><Sheet size={15} strokeWidth={STROKE} className="text-leaf" />Google Sheets</p>
        <p className="mt-1 text-xs text-slate-500">שורה חדשה לגיליון בכל מסמך שנחתם</p>
      </div>
    </div>
  );
}

function DashboardPreview() {
  const [tab, setTab] = useState('docs');
  const reduce = useReducedMotion();
  const side = [FileText, LayoutTemplate, ClipboardList, Users, Webhook, Settings];
  return (
    <div className="relative mx-auto w-full max-w-[560px]" dir="rtl">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-brand-200/60 via-white to-aqua/25 blur-2xl" />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 40, rotateX: 10 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-[1.75rem] border border-white bg-white/70 shadow-lift backdrop-blur-xl"
      >
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
          <i className="h-2.5 w-2.5 rounded-full bg-red-300" /><i className="h-2.5 w-2.5 rounded-full bg-amber-300" /><i className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="ms-3 rounded-lg bg-white px-3 py-0.5 text-[11px] text-slate-400" dir="ltr">smoovsign.com</span>
        </div>
        <div className="flex">
          <div className="hidden w-14 shrink-0 flex-col items-center gap-3 bg-brand-900 py-4 sm:flex" aria-hidden="true">
            <img src="/lp/img/logo.svg" alt="" className="h-8 w-8 rounded-lg" />
            {side.map((I, i) => <span key={i} className={`grid h-8 w-8 place-items-center rounded-lg ${i === ({ docs: 0, tpl: 1, forms: 2, hooks: 4 })[tab] ? 'bg-brand-500 text-white' : 'text-brand-200/70'}`}><I size={16} strokeWidth={STROKE} /></span>)}
          </div>
          <div className="min-h-[330px] flex-1 bg-gradient-to-b from-brand-50/60 to-white p-4">
            <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="מסכי המערכת">
              {TABS.map(({ key, label, icon: I }) => (
                <button key={key} role="tab" aria-selected={tab === key} type="button" onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition ${tab === key ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-brand-50'}`}>
                  <I size={15} strokeWidth={STROKE} />{label}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}><Frame tab={tab} /></motion.div>
            </AnimatePresence>
            <p className="mt-3 text-center text-[11px] text-slate-400">נתוני הדגמה</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const up = (d) => ({ initial: reduce ? false : { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.75, delay: d, ease: [0.22, 1, 0.36, 1] } });
  return (
    <section id="top" className="relative overflow-hidden bg-night px-5 pb-28 pt-14 text-white sm:pt-20">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-40 start-1/4 h-[560px] w-[560px] rounded-full bg-aqua/20 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 end-0 h-[460px] w-[460px] rounded-full bg-brand-500/30 blur-[130px]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.02fr_1fr]">
        <div>
          <motion.p {...up(0)} className="mono-tag-dark inline-flex items-center gap-2 rounded-full border border-aqua/30 bg-aqua/10 px-4 py-1.5"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-aqua" /><span className="relative h-2 w-2 rounded-full bg-aqua" /></span>מערכת מתקדמת לחתימה דיגיטלית על מסמכים וטפסים</motion.p>
          <motion.h1 {...up(0.08)} className="mt-6 text-[2.9rem] font-black leading-[1.02] tracking-tight sm:text-7xl lg:text-[5.4rem]">
            מסמך נשלח.<br /><span className="bg-gradient-to-l from-[#7dd3fc] to-aqua bg-clip-text text-transparent">מסמך נחתם.</span>
          </motion.h1>
          <motion.p {...up(0.16)} className="mt-6 max-w-xl text-lg leading-relaxed text-white/70 sm:text-xl">
            מעלים PDF ומסמנים איפה לחתום ואז שולחים קישור. החותם חותם מהנייד או מהמחשב ואתם מקבלים PDF חתום עם סטטוס ויומן פעילות לכל מסמך.
          </motion.p>
          <motion.div {...up(0.24)} className="mt-9 grid gap-3 sm:flex sm:flex-wrap">
            <a href={WA} rel="noopener" className="btn-cta"><WhatsAppIcon size={20} />דברו איתנו בוואצאפ<ArrowLeft size={18} strokeWidth={STROKE} /></a>
            <a href={APP} className="btn-line"><PlayCircle size={19} strokeWidth={STROKE} />כניסה למערכת</a>
          </motion.div>
          <motion.ul {...up(0.32)} className="mt-9 flex flex-wrap justify-center gap-x-6 sm:justify-start gap-y-2 text-sm font-medium text-white/65">
            {['כניסה עם חשבון Google', 'קישור ייחודי לכל חותם', 'PDF חתום להורדה'].map((t) => <li key={t} className="flex items-center gap-1.5"><CheckCircle2 size={17} strokeWidth={STROKE} className="text-aqua" />{t}</li>)}
          </motion.ul>
        </div>

        {/* חלון המערכת מאחור והנייד של החותם מלפנים */}
        <motion.div {...up(0.2)} className="relative mx-auto w-full max-w-[600px] lg:h-[600px]">
          <div className="hidden lg:block lg:absolute lg:start-0 lg:top-6 lg:w-[88%]"><DashboardPreview /></div>
          <div className="relative z-10 flex justify-center lg:absolute lg:-bottom-4 lg:end-[-4%] lg:block"><PhoneMock className="w-[236px] sm:w-[262px]" /></div>
          <PhoneChip icon={CheckCircle2} text="המסמך נחתם" sub="הסכם שכירות · דנה אברהמי" tone="bg-leaf-light text-leaf" className="start-[-2%] bottom-[22%] animate-floaty" />
          <PhoneChip icon={Send} text="נשלח לחתימה" sub="הצעת מחיר 2041" tone="bg-brand-100 text-brand-700" className="end-[34%] top-[2%] animate-floaty [animation-delay:1.2s]" delay={0.3} />
        </motion.div>
      </div>
    </section>
  );
}


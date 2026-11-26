import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, UserCheck, NotebookPen, KeyRound, Plus, Minus, Send, Loader2, CheckCircle2, AlertCircle,
  Phone, PenLine, Accessibility, ZoomIn, ZoomOut, Contrast, RotateCcw,
} from 'lucide-react';
import { HoverCard, IconBox, Heading, Section, Reveal, STROKE, WhatsAppIcon } from './ui.jsx';
import { WA, APP } from './Hero.jsx';

export function Security() {
  const items = [
    [ShieldCheck, 'leaf', 'קוד אימות למסמך', 'לכל מסמך נוצר קוד\nאימות שמאפשר לוודא\nשהמסמך מקורי.'],
    [UserCheck, 'brand', 'קישור אישי לכל חותם', 'כל חותם מקבל קישור\nייחודי וחותם רק\nעל המסמך שנשלח אליו.'],
    [KeyRound, 'coral', 'כניסה עם חשבון Google', 'השולחים נכנסים לחשבון\nבלחיצה ואפשר לוותר\nעל סיסמה נוספת.'],
    [NotebookPen, 'brand', 'יומן פעילות והרשאות', 'כל פעולה נרשמת ביומן\nובמסלול Business מגדירים\nהרשאות לעובדים.'],
  ];
  return (
    <Section id="security" className="bg-gradient-to-b from-transparent via-brand-50/50 to-transparent">
      <Heading eyebrow="אבטחה ושליטה" title="המסמכים שלכם נשארים בשליטתכם" lead="חוזים והצעות מחיר הם רגישים. בנינו את המערכת כך שתמיד ברור מי חתם ומתי." />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([icon, tone, t, d], k) => (
          <HoverCard key={t} delay={k * 0.07} className="p-7">
            <IconBox icon={icon} tone={tone} className="!h-14 !w-14" size={28} />
            <h3 className="mt-5 text-lg font-black text-ink">{t}</h3>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-600">{d}</p>
          </HoverCard>
        ))}
      </div>
    </Section>
  );
}

const FAQ = [
  ['כמה זה עולה', 'מסלול Free חינם לתמיד עם 10 שליחות בחודש. המסלולים בתשלום מתחילים ב-29 ₪ לחודש וכוללים יותר שליחות ותבניות והודעות בוואצאפ.'],
  ['איך החותם חותם', 'הוא מקבל קישור אישי במייל או בוואצאפ ופותח אותו בנייד או במחשב. החתימה נעשית באצבע או בעכבר על המסך.'],
  ['אפשר לשלוח מסמך לכמה חותמים', 'כן. מגדירים כמה נמענים ושדות לכל אחד וכל חותם מקבל קישור משלו. במסלול Pro אפשר גם לקבוע סדר חתימות.'],
  ['אפשר לחבר את SmoovSign לאתר או למערכת שלנו', 'כן. יש SDK לשילוב באתר ו-Webhook שמעביר את הנתונים לכתובת שתגדירו ותבנית מוכנה שמוסיפה שורה ל-Google Sheets.'],
  ['איך מתחילים', 'נכנסים למערכת עם חשבון Google ושולחים את המסמך הראשון. ואם נוח יותר לדבר כתבו לנו בוואצאפ.'],
];

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <Section id="faq">
      <Heading eyebrow="שאלות נפוצות" title="מה שכולם שואלים" />
      <div className="mx-auto grid max-w-3xl gap-3">
        {FAQ.map(([q, a], k) => {
          const on = open === k;
          return (
            <Reveal key={q} delay={k * 0.05}>
              <div className={`card-glass overflow-hidden transition ${on ? 'ring-1 ring-brand-300' : ''}`}>
                <button type="button" aria-expanded={on} onClick={() => setOpen(on ? -1 : k)} className="flex w-full items-center justify-between gap-4 p-5 text-start text-lg font-bold">
                  {q}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">{on ? <Minus size={18} strokeWidth={STROKE} /> : <Plus size={18} strokeWidth={STROKE} />}</span>
                </button>
                <AnimatePresence initial={false}>
                  {on && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden"><p className="px-5 pb-5 leading-relaxed text-slate-600">{a}</p></motion.div>}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

// טלפון ישראלי בכל כתיב: 054-1234567, 0541234567, +972541234567, 972-54-1234567
const validPhone = (p) => { let d = p.replace(/\D/g, ''); if (d.startsWith('972')) d = '0' + d.slice(3); return /^0\d{8,9}$/.test(d); };

export function Join() {
  const [f, setF] = useState({ name: '', biz: '', sends: '', phone: '' });
  const [state, setState] = useState({ busy: false, ok: false, err: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    const miss = [!f.name.trim() && 'שם מלא', !f.biz.trim() && 'שם העסק או הארגון'].filter(Boolean);
    if (miss.length) { setState({ busy: false, ok: false, err: `נא למלא ${miss.join(' ו')}` }); return; }
    if (!validPhone(f.phone)) { setState({ busy: false, ok: false, err: 'מספר הטלפון לא תקין. בדקו שהוא מלא ומתחיל ב-05 או ב-‎+972' }); return; }
    setState({ busy: true, ok: false, err: '' });
    const text = `שלום, מעוניין/ת ב-SmoovSign (סמובסיין).\nשם: ${f.name}\nעסק/ארגון: ${f.biz}\nשליחות בחודש: ${f.sends || 'לא צוין'}\nטלפון: ${f.phone}`;
    window.open(`https://wa.me/972542012000?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    setState({ busy: false, ok: true, err: '' });
  };
  const input = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100';
  return (
    <section id="join" className="bg-[linear-gradient(to_bottom,#eaf0fd_0,#eaf0fd_170px,#0a1230_170px)] px-5 pb-24 pt-10">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-8 text-white shadow-lift sm:p-14">
        <div className="pointer-events-none absolute -top-24 start-0 h-72 w-72 rounded-full bg-brand-400/30 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 end-0 h-72 w-72 rounded-full bg-aqua/25 blur-[90px]" />
        <div className="relative grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="eyebrow !bg-white/10 !text-brand-100">הצטרפו עכשיו</span>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">מוכנים שהמסמכים שלכם ייחתמו?</h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-brand-100/85">נכנסים למערכת עם חשבון Google או משאירים פרטים ונחזור אליכם. אפשר גם לדבר איתנו ישירות.</p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <a href={WA} rel="noopener" className="btn bg-[#25d366] text-white shadow-lg shadow-black/20 hover:bg-[#1fb957]"><WhatsAppIcon size={20} />וואצאפ</a>
              <a href={APP} className="btn-ghost !bg-white/10 !text-white hover:!bg-white/20"><PenLine size={19} strokeWidth={STROKE} />כניסה למערכת</a>
              <a href="tel:0542012000" className="btn-ghost !bg-white/10 !text-white hover:!bg-white/20"><Phone size={19} strokeWidth={STROKE} />054-2012000</a>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <form onSubmit={submit} noValidate className="grid gap-3.5 rounded-3xl bg-white p-6 text-ink shadow-lift sm:p-8">
              <label className="grid gap-1.5 text-sm font-bold">שם מלא<input className={input} autoComplete="name" maxLength={80} value={f.name} onChange={set('name')} /></label>
              <label className="grid gap-1.5 text-sm font-bold">שם העסק או הארגון<input className={input} maxLength={80} value={f.biz} onChange={set('biz')} /></label>
              <label className="grid gap-1.5 text-sm font-bold">כמה מסמכים שולחים בחודש<input className={input} inputMode="numeric" maxLength={6} value={f.sends} onChange={set('sends')} /></label>
              <label className="grid gap-1.5 text-sm font-bold">טלפון<input className={input} type="tel" autoComplete="tel" dir="ltr" style={{ textAlign: 'right' }} maxLength={20} value={f.phone} onChange={set('phone')} /></label>
              <button type="submit" disabled={state.busy} className="btn-cta mt-1 disabled:opacity-60">{state.busy ? <Loader2 className="animate-spin" size={19} /> : <Send size={19} strokeWidth={STROKE} />}שליחה בוואצאפ</button>
              <div role="status" aria-live="polite">
                {state.ok && <p className="flex items-center gap-2 rounded-2xl bg-leaf-light p-3 font-bold text-leaf"><CheckCircle2 size={19} strokeWidth={STROKE} />נפתח חלון וואצאפ עם הפרטים. שלחו ונחזור אליך בקרוב.</p>}
                {state.err && <p className="flex items-center gap-2 rounded-2xl bg-coral-light p-3 font-bold text-coral-dark"><AlertCircle size={19} strokeWidth={STROKE} />{state.err}</p>}
              </div>
              <p className="text-xs text-slate-500">הפרטים משמשים רק ליצירת קשר לגבי המערכת.</p>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-brand-900 px-5 pt-10 pb-28 text-brand-100/80 sm:pb-20">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img src="/lp/img/logo.svg" alt="" className="h-11 w-11 rounded-xl" width="44" height="44" />
          <div><p className="font-black text-white">SmoovSign</p><p className="text-sm">מערכת מתקדמת לחתימה דיגיטלית</p></div>
        </div>
        <div className="flex flex-wrap gap-5 text-sm">
          <a className="hover:text-white" href="/accessibility.html">הצהרת נגישות</a>
          <a className="hover:text-white" href="/privacy.html">מדיניות פרטיות</a>
          <a className="hover:text-white" href="tel:0542012000">054-2012000</a>
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm">
        <p>נבנה ע"י <a href="https://daghazahav.com" target="_blank" rel="noopener" className="font-bold text-white hover:text-aqua">דג הזהב</a></p>
        <a href={APP} className="font-medium text-brand-100/70 hover:text-white">כניסה למערכת</a>
      </div>
    </footer>
  );
}

export function Floating() {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(100);
  const [hc, setHc] = useState(false);
  useEffect(() => {
    try { const s = +localStorage.getItem('fs') || 100; setSize(s); setHc(localStorage.getItem('hc') === '1'); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    document.documentElement.style.fontSize = `${size}%`;
    document.body.classList.toggle('hc', hc);
    try { localStorage.setItem('fs', size); localStorage.setItem('hc', hc ? '1' : '0'); } catch { /* ignore */ }
  }, [size, hc]);
  const btn = 'flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold hover:bg-brand-50';
  return (
    <>
      <a href={WA} rel="noopener" aria-label="וואצאפ" className="fixed bottom-5 end-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-white shadow-lift transition hover:scale-110">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.05 4.91A10 10 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.37a9.93 9.93 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.92-9.91 0-2.65-1.03-5.14-2.92-7.02ZM12.05 20.16h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.39c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.24-.64.81-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.24a7.53 7.53 0 0 1-1.39-1.73c-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.03 0 1.2.87 2.36.99 2.52.12.16 1.71 2.62 4.15 3.67.58.25 1.03.4 1.39.51.58.18 1.11.16 1.53.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.47-.28Z" /></svg>
      </a>
      <div className="fixed bottom-5 start-5 z-50">
        <button type="button" aria-label="אפשרויות נגישות" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-lift transition hover:scale-110"><Accessibility size={26} strokeWidth={STROKE} /></button>
        {open && (
          <div role="group" aria-label="נגישות" className="absolute bottom-16 start-0 grid w-52 gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-lift">
            <button type="button" className={btn} onClick={() => setSize((s) => Math.min(150, s + 10))}><ZoomIn size={17} strokeWidth={STROKE} />הגדלת טקסט</button>
            <button type="button" className={btn} onClick={() => setSize((s) => Math.max(80, s - 10))}><ZoomOut size={17} strokeWidth={STROKE} />הקטנת טקסט</button>
            <button type="button" className={btn} onClick={() => setHc((v) => !v)}><Contrast size={17} strokeWidth={STROKE} />ניגודיות גבוהה</button>
            <button type="button" className={btn} onClick={() => { setSize(100); setHc(false); }}><RotateCcw size={17} strokeWidth={STROKE} />איפוס</button>
          </div>
        )}
      </div>
    </>
  );
}

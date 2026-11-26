import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import {
  Link2, FileText, PenLine, CheckCheck, Wifi, BatteryFull, SignalHigh, CheckCircle2, Download, Bell, Eraser,
} from 'lucide-react';
import { STROKE } from './ui.jsx';

// הדמיית נייד של חוויית החותם: מסגרת מציאותית (חור מצלמה, כפתורי צד, ברק זכוכית), ארבעה מסכים
// שמתחלפים לבד כהחלקה רציפה בלי רווח ריק ביניהם, וטיית עומק קלה אחרי העכבר. הנתונים הם הדגמה.

const TABS = [
  { key: 'link', label: 'קישור', icon: Link2 },
  { key: 'doc', label: 'המסמך', icon: FileText },
  { key: 'sign', label: 'חתימה', icon: PenLine },
  { key: 'done', label: 'נחתם', icon: CheckCheck },
];

const DEFAULT_CLIENT = { signer: 'מיכל אזולאי', doc: 'אישור הצטרפות לחוג', sender: 'חוג הציור של נועה', date: '14.11.2026' };

function Header({ small, big }) {
  return (
    <div className="relative bg-gradient-to-b from-[#0f1a4d] to-[#0a1230] px-4 pb-7 pt-2 text-white">
      <p className="text-[10px] opacity-80">{small}</p>
      <p className="text-[19px] font-black leading-tight">{big}</p>
      <span className="absolute -bottom-3 end-4 grid h-7 w-7 place-items-center rounded-full bg-white/15 backdrop-blur">
        <Bell size={13} strokeWidth={STROKE} />
      </span>
    </div>
  );
}

function Card({ children, className = '' }) {
  return <div className={`rounded-2xl bg-white p-3 text-[11px] leading-snug text-slate-600 shadow-[0_3px_12px_rgba(10,18,48,.08)] ${className}`}>{children}</div>;
}

const Sig = ({ draw = true }) => (
  <svg viewBox="0 0 160 60" fill="none" className="h-full w-full" aria-hidden="true">
    <motion.path d="M10 40c10-24 20 12 32-4s14-24 24-6 12 14 24-2 16-12 30-2" stroke="#2f47cf" strokeWidth="3" strokeLinecap="round" initial={draw ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.5 }} />
  </svg>
);

const SCREENS = {
  link: (c) => (
    <>
      <Header small="התקבל קישור לחתימה" big={c.signer} />
      <div className="-mt-1 space-y-2 px-3 pt-3">
        <Card>
          <p className="text-[10px]">מסמך שממתין לך</p>
          <p className="text-[17px] font-black leading-tight text-[#0f1a4d]">{c.doc}</p>
          <span className="mt-1 inline-block rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-700">ממתין לחתימה</span>
        </Card>
        <Card className="flex items-center gap-2"><FileText size={14} className="text-[#0f1a4d]" strokeWidth={STROKE} /><span><b className="block text-slate-800">נשלח מאת</b>{c.sender}</span></Card>
        <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#0f1a4d] py-3 text-[12px] font-black text-[#7dd3fc]"><PenLine size={15} strokeWidth={STROKE} />פתיחת המסמך</div>
        <p className="text-center text-[9.5px] text-slate-400">הקישור אישי ומיועד רק לחותם</p>
      </div>
    </>
  ),
  doc: (c) => (
    <>
      <Header small="עמוד 1 מתוך 2" big={c.doc} />
      <div className="space-y-2 px-3 pt-4">
        <Card className="space-y-1.5">
          <span className="block h-1.5 rounded bg-slate-200" /><span className="block h-1.5 rounded bg-slate-200" /><span className="block h-1.5 w-2/3 rounded bg-slate-200" />
          <span className="block h-1.5 rounded bg-slate-200" /><span className="block h-1.5 w-1/2 rounded bg-slate-200" />
        </Card>
        <div className="flex items-center gap-2 rounded-xl border-[1.5px] border-dashed border-[#3f5fe9] bg-[#3f5fe9]/10 px-3 py-2.5 text-[11px] font-bold text-[#2f47cf]"><PenLine size={14} strokeWidth={STROKE} />חתימה: {c.signer}</div>
        <div className="flex items-center gap-2 rounded-xl border-[1.5px] border-dashed border-emerald-500 bg-emerald-500/10 px-3 py-2.5 text-[11px] font-bold text-emerald-700 w-3/4"><CheckCircle2 size={14} strokeWidth={STROKE} />תאריך: {c.date}</div>
      </div>
    </>
  ),
  sign: (c) => (
    <>
      <Header small="חתימה" big="חתמו באצבע" />
      <div className="space-y-2 px-3 pt-4">
        <div className="h-[118px] rounded-2xl border-2 border-dashed border-[#3f5fe9]/50 bg-white p-3"><Sig /></div>
        <div className="flex items-center justify-between text-[10px] text-slate-500"><span className="flex items-center gap-1"><Eraser size={12} strokeWidth={STROKE} />ניקוי</span><span>{c.signer}</span></div>
        <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-l from-[#2f47cf] to-[#3f5fe9] py-2.5 text-[12px] font-black text-white"><CheckCheck size={15} strokeWidth={STROKE} />אישור וחתימה</div>
      </div>
    </>
  ),
  done: (c) => (
    <>
      <Header small="הסתיים" big="המסמך נחתם" />
      <div className="space-y-2 px-3 pt-4">
        <Card className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={28} strokeWidth={STROKE} /></span>
          <b className="mt-2 block text-[13px] text-slate-800">תודה {c.signer.split(' ')[0]}</b>
          <span>{c.doc} נחתם ב-{c.date}</span>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-[#075985]"><FileText size={18} strokeWidth={STROKE} /></span>
          <span className="min-w-0 flex-1"><b className="block text-[11.5px] text-slate-800">{c.doc}.pdf</b><span className="text-[10px] text-slate-400">PDF חתום</span></span>
          <Download size={16} strokeWidth={STROKE} className="text-[#0f1a4d]" />
        </Card>
        <p className="text-center text-[9.5px] text-slate-400">{c.sender} קיבלו את המסמך החתום</p>
      </div>
    </>
  ),
};

// ב-RTL המסך הבא נמצא משמאל, ולכן נכנס משמאל ודוחף את הנוכחי ימינה
const SLIDE = {
  enter: (d) => ({ x: d > 0 ? '-100%' : '100%' }),
  center: { x: '0%' },
  exit: (d) => ({ x: d > 0 ? '100%' : '-100%' }),
};

export default function PhoneMock({ start = 0, auto = true, className = '', interval = 3800, tilt = true, client }) {
  const c = { ...DEFAULT_CLIENT, ...client };
  const reduce = useReducedMotion();
  const [[i, dir], setPage] = useState([start, 1]);
  const go = (k) => setPage(([cur]) => (k === cur ? [cur, 1] : [k, k > cur ? 1 : -1]));
  const [hover, setHover] = useState(false);
  const ref = useRef(null);
  const mx = useMotionValue(0); const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 16 }); const sy = useSpring(my, { stiffness: 120, damping: 16 });
  const rotY = useTransform(sx, [-1, 1], [-9, 9]); const rotX = useTransform(sy, [-1, 1], [7, -7]);

  useEffect(() => {
    if (!auto || hover || reduce) return undefined;
    const t = setInterval(() => setPage(([cur]) => [(cur + 1) % TABS.length, 1]), interval);
    return () => clearInterval(t);
  }, [auto, hover, reduce, interval]);

  const onMove = (e) => {
    if (!tilt || reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1); my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const Screen = SCREENS[TABS[i].key];

  return (
    <motion.div
      ref={ref} onMouseMove={onMove} onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); mx.set(0); my.set(0); }}
      style={{ rotateY: rotY, rotateX: rotX, transformPerspective: 1100 }}
      className={`relative mx-auto aspect-[9/19] w-[250px] ${className}`}
    >
      <div className="absolute -inset-6 -z-10 rounded-[4rem] bg-aqua/25 blur-3xl" />
      <div className="absolute inset-0 rounded-[2.9rem] bg-gradient-to-br from-[#0f1a4d] via-[#0a1230] to-[#0f1a42] p-[3px] shadow-[0_40px_80px_-20px_rgba(0,0,0,.7)]">
        <div className="relative h-full w-full overflow-hidden rounded-[2.75rem] bg-black p-[7px]">
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.25rem] bg-[#f6f8fe] [isolation:isolate] [transform:translateZ(0)]">
            <div className="relative z-10 flex h-8 shrink-0 items-center justify-between bg-[#0f1a4d] px-5 pt-1 text-[10px] font-bold text-white">
              <span>9:41</span>
              <span className="absolute left-1/2 top-[7px] grid h-[13px] w-[13px] -translate-x-1/2 place-items-center rounded-full bg-black ring-1 ring-white/10"><span className="h-[5px] w-[5px] rounded-full bg-[#0a1230] shadow-[inset_0_0_2px_rgba(56,189,248,.55)]" /></span>
              <span className="flex items-center gap-1"><SignalHigh size={11} /><Wifi size={11} /><BatteryFull size={13} /></span>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden bg-[#f6f8fe]">
              <AnimatePresence initial={false} custom={dir}>
                <motion.div
                  key={TABS[i].key}
                  custom={dir}
                  variants={SLIDE}
                  initial={reduce ? false : 'enter'}
                  animate="center"
                  exit={reduce ? undefined : 'exit'}
                  transition={reduce ? { duration: 0 } : { x: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } }}
                  className="absolute inset-0 overflow-hidden bg-[#f6f8fe] will-change-transform [backface-visibility:hidden]"
                >
                  {Screen(c)}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="shrink-0 border-t border-slate-200/70 bg-white/95 pb-3 pt-1.5">
              <div className="grid grid-cols-4">
                {TABS.map(({ key, label, icon: Icon }, k) => (
                  <button key={key} type="button" tabIndex={-1} aria-label={label} onClick={() => go(k)} className={`grid justify-items-center gap-0.5 text-[9px] font-bold transition ${k === i ? 'text-[#0f1a4d]' : 'text-slate-400'}`}>
                    <span className={`rounded-full px-3 py-1 transition ${k === i ? 'bg-sky-100' : ''}`}><Icon size={15} strokeWidth={STROKE} /></span>{label}
                  </button>
                ))}
              </div>
              <span className="mx-auto mt-1.5 block h-[3px] w-20 rounded-full bg-slate-300" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent opacity-60" />
          </div>
        </div>
      </div>
      <span className="absolute -start-[3px] top-24 h-10 w-[3px] rounded-s bg-[#2638a8]" />
      <span className="absolute -start-[3px] top-40 h-14 w-[3px] rounded-s bg-[#2638a8]" />
      <span className="absolute -end-[3px] top-32 h-16 w-[3px] rounded-e bg-[#2638a8]" />
    </motion.div>
  );
}

export function PhoneChip({ icon: Icon, text, sub, className = '', tone = 'bg-aqua text-night', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 + delay, type: 'spring', stiffness: 160, damping: 14 }}
      className={`absolute z-20 hidden items-center gap-2.5 rounded-2xl border border-white/20 bg-white/90 px-3.5 py-2.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,.45)] backdrop-blur-xl md:flex ${className}`}
    >
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon size={18} strokeWidth={STROKE} /></span>
      <span className="text-start"><b className="block text-[13px] leading-tight text-ink">{text}</b>{sub && <span className="text-[11px] text-slate-500">{sub}</span>}</span>
    </motion.div>
  );
}

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Send, CheckCheck } from 'lucide-react';
import { Counter, Heading, Section, Reveal } from './ui.jsx';
import PhoneMock, { PhoneChip } from './PhoneMock.jsx';

const WORDS = ['שליחה לחתימה', 'חתימה מהנייד', 'עורך שדות בגרירה', 'תבניות מוכנות', 'בונה טפסים', 'PDF חתום', 'כמה חותמים', 'יומן פעילות', 'Webhook', 'Google Sheets', 'אנשי קשר', 'SDK לאתר שלכם'];

// פס רץ אינסופי ורציף: שני חצאים זהים זה לצד זה, האנימציה זזה 50% בדיוק רוחב חצי אחד,
// כך שהלולאה חלקה בלי קפיצה ובלי רווח ריק. רווחים צפופים כדי שתמיד יראו הרבה כיתוב.
function MarqueeHalf() {
  const set = [...WORDS, ...WORDS];
  return (
    <div className="flex shrink-0 items-center whitespace-nowrap text-xl font-black sm:text-2xl" dir="rtl" aria-hidden="true">
      {set.map((w, i) => (
        <span key={i} className="flex items-center">{w}<span className="mx-6 text-night/45 sm:mx-7">✦</span></span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-aqua/30 bg-aqua py-4 text-night" aria-hidden="true" dir="ltr">
      <div className="flex w-max animate-marquee will-change-transform [backface-visibility:hidden]" dir="ltr">
        <MarqueeHalf />
        <MarqueeHalf />
      </div>
    </div>
  );
}

// מספרים גדולים על רקע כהה. רק עובדות מהמוצר
export function BigStats() {
  const items = [
    { to: 0, prefix: '₪', ltr: true, label: 'מסלול Free לתמיד', note: '10 שליחות בחודש להתחלה' },
    { to: 4, ltr: true, label: 'מסלולים', note: 'מחינם ועד Business' },
    { to: 8, ltr: true, label: 'סוגי שדות', note: 'חתימה ותאריך וטקסט וקובץ ועוד' },
    { to: 1, ltr: true, label: 'קישור לכל חותם', note: 'נפתח ישירות בדפדפן בנייד או במחשב' },
  ];
  return (
    <section aria-label="במספרים" className="bg-night px-5 py-20 text-white">
      <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={it.label} delay={i * 0.08} className="bg-night-2/70 p-7 text-center sm:p-9">
            <p dir={it.ltr ? 'ltr' : 'rtl'} className="whitespace-nowrap font-sans text-5xl font-black tabular-nums tracking-tight text-aqua sm:text-6xl"><Counter to={it.to} prefix={it.prefix} suffix={it.suffix} /></p>
            <p className="mt-3 text-lg font-bold">{it.label}</p>
            <p className="mt-1 text-sm text-white/55">{it.note}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// "לחותמים": חוויית החתימה בנייד, עם כרטיסים צפים. שני הניידים מציגים חותמים ומסמכים שונים
export function ClientSection() {
  const reduce = useReducedMotion();
  const points = [
    ['פותחים את הקישור', 'המסמך מוצג במסך הנייד ואפשר לעבור עליו בנחת'],
    ['חותמים באצבע', 'החתימה נוצרת על המסך ונכנסת למקום שהוגדר במסמך'],
    ['מקבלים אישור', 'המסמך נחתם ובצד השולח נשמר PDF חתום'],
  ];
  return (
    <Section id="client" className="overflow-hidden bg-gradient-to-b from-[#eaf0fd] to-[#f6f8fe]">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div>
          <Heading center={false} eyebrow="לחותמים שלכם" title="חתימה שקל לסיים מהנייד" lead="החותם מקבל קישור אישי ופותח אותו מכל מכשיר. כל מסמך מוצג עם השדות שהוגדרו לו." />
          <ul className="grid gap-4">
            {points.map(([t, d], k) => (
              <Reveal key={t} delay={k * 0.08} as="li" className="flex gap-4 rounded-2xl border border-brand-100 bg-white/80 p-4 shadow-soft">
                <span className="mono-tag grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-night text-aqua">0{k + 1}</span>
                <span><b className="block text-lg text-ink">{t}</b><span className="text-slate-600">{d}</span></span>
              </Reveal>
            ))}
          </ul>
        </div>
        <div className="relative mx-auto flex w-full max-w-[560px] justify-center gap-6 pb-20 pt-16">
          <div className="absolute inset-x-0 top-1/2 -z-10 h-72 -translate-y-1/2 rounded-full bg-aqua/25 blur-[90px]" />
          <PhoneMock start={0} className="w-[210px] sm:w-[240px]" client={{ signer: 'מיכל אזולאי', doc: 'אישור הצטרפות לחוג', sender: 'חוג הציור של נועה', date: '14.11.2026' }} />
          <motion.div initial={reduce ? false : { y: 40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.15 }} className="mt-14 hidden sm:block">
            <PhoneMock start={2} interval={4600} className="w-[240px]" client={{ signer: 'אורי בן דוד', doc: 'הסכם שירותי ייעוץ', sender: 'משרד ייעוץ פיננסי', date: '02.12.2026' }} />
          </motion.div>
          <PhoneChip icon={Send} text="קישור לחתימה נשלח" sub="במייל או בוואצאפ" tone="bg-brand-100 text-brand-700" className="inset-x-0 top-0 mx-auto w-max animate-floaty [animation-delay:0.7s]" delay={0.3} />
          <PhoneChip icon={CheckCheck} text="המסמך נחתם" sub="PDF חתום נשמר" tone="bg-leaf-light text-leaf" className="inset-x-0 bottom-0 mx-auto w-max animate-floaty [animation-delay:1.5s]" delay={0.5} />
        </div>
      </div>
    </Section>
  );
}

// כיתוב ענק בסוף העמוד, כמו חתימה
export function Wordmark() {
  return (
    <div className="overflow-hidden bg-night px-5 pb-6 pt-14" aria-hidden="true">
      <p className="select-none text-center text-[13vw] font-black leading-[0.8] tracking-tighter text-transparent [-webkit-text-stroke:1.5px_rgba(56,189,248,.35)] sm:text-[11vw]">SMOOVSIGN</p>
    </div>
  );
}

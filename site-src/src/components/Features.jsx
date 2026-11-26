import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Send, PenLine, LayoutTemplate, ClipboardList, FileText, Webhook, Sheet, Users, History, Code2, Smartphone,
  Upload, MousePointerClick, CheckCircle2, Building2, Briefcase, Laptop, UsersRound, Download, Link2,
} from 'lucide-react';
import { HoverCard, IconBox, Heading, Section, Reveal, STROKE, WhatsAppIcon } from './ui.jsx';
import { WA, APP } from './Hero.jsx';

function Title({ icon, tone, title, dark }) {
  return (
    <div className="flex items-center gap-3">
      <IconBox icon={icon} tone={tone} />
      <h3 className={`text-xl font-black ${dark ? 'text-white' : 'text-ink'}`}>{title}</h3>
    </div>
  );
}

export function Bento() {
  const status = [['הסכם שכירות דירה', 'נחתם', 'bg-emerald-100 text-emerald-700'], ['הצעת מחיר 2041', 'ממתין לחתימה', 'bg-amber-100 text-amber-700'], ['הסכם סודיות', 'נשלח', 'bg-sky-100 text-sky-700'], ['טופס הצטרפות', 'נחתם', 'bg-emerald-100 text-emerald-700']];
  return (
    <Section id="features">
      <Heading eyebrow="יכולות המערכת" title="כל מה שצריך כדי שמסמכים ייחתמו במקום אחד" lead="מהשליחה ועד המסמך החתום בלי להדפיס ובלי לסרוק." />
      <div className="grid auto-rows-[minmax(200px,auto)] gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* שליחה */}
        <HoverCard className="p-7 md:col-span-2 lg:row-span-2">
          <Title icon={Send} title="שליחה לחתימה בקישור" />
          <p className="mt-3 text-slate-600">מעלים PDF או תמונה ומסמנים איפה לחתום. כל חותם מקבל קישור ייחודי במייל או בוואצאפ ובלוח הבקרה רואים את הסטטוס של כל מסמך.</p>
          <div className="mt-6 grid gap-2.5">
            {status.map(([t, s, c], i) => (
              <motion.div key={t} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.1 }} className="flex items-center justify-between rounded-2xl bg-white p-3.5 shadow-sm">
                <span className="font-bold text-ink">{t}</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${c}`}>{s}</span>
              </motion.div>
            ))}
          </div>
        </HoverCard>
        {/* עורך שדות */}
        <HoverCard dark delay={0.08} className="p-7 lg:row-span-2">
          <Title icon={PenLine} tone="dark" title="עורך שדות בגרירה" dark />
          <p className="mt-3 text-brand-100/80">שדות חתימה ותאריך וטקסט נגררים למקום הנכון. לכל נמען צבע משלו.</p>
          <div className="mt-5 grid gap-2 rounded-2xl bg-white/5 p-3">
            <span className="h-1.5 rounded bg-white/15" /><span className="h-1.5 rounded bg-white/15" /><span className="h-1.5 w-2/3 rounded bg-white/15" />
            <span className="mt-1 flex items-center gap-1.5 rounded-lg border border-dashed border-sky-300 bg-sky-300/10 px-2.5 py-2 text-[11px] font-bold text-sky-200"><PenLine size={13} strokeWidth={STROKE} />חתימה · נמען 1</span>
            <span className="flex w-4/5 items-center gap-1.5 rounded-lg border border-dashed border-emerald-300 bg-emerald-300/10 px-2.5 py-2 text-[11px] font-bold text-emerald-200"><PenLine size={13} strokeWidth={STROKE} />חתימה · נמען 2</span>
            <span className="flex w-3/5 items-center gap-1.5 rounded-lg border border-dashed border-amber-300 bg-amber-300/10 px-2.5 py-2 text-[11px] font-bold text-amber-200">תאריך</span>
          </div>
          <p className="mt-3 text-center text-xs text-brand-200/80">חתימה, תאריך, טקסט, תיבת סימון, קובץ ועוד</p>
        </HoverCard>
        {/* חתימה מהנייד */}
        <HoverCard delay={0.12} className="p-7">
          <Title icon={Smartphone} tone="leaf" title="חתימה מהנייד" />
          <div className="mt-5 grid h-24 place-items-center rounded-2xl border-2 border-dashed border-brand-300 bg-white">
            <svg viewBox="0 0 160 60" fill="none" className="h-16 w-4/5" aria-hidden="true"><motion.path d="M10 40c10-24 20 12 32-4s14-24 24-6 12 14 24-2 16-12 30-2" stroke="#2f47cf" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4 }} /></svg>
          </div>
          <p className="mt-3 text-xs text-slate-500">החותם חותם באצבע על המסך. אפשר גם מהמחשב.</p>
        </HoverCard>
        {/* PDF חתום */}
        <HoverCard delay={0.16} className="p-7">
          <Title icon={FileText} tone="coral" title="PDF חתום להורדה" />
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-coral-light text-coral"><FileText size={20} strokeWidth={STROKE} /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-ink">הסכם שכירות דירה.pdf</p><p className="text-xs text-slate-500">נחתם ונשמר</p></div>
            <Download size={18} strokeWidth={STROKE} className="text-brand-700" />
          </div>
          <p className="mt-3 text-xs text-slate-500">בסיום החתימה נוצר מסמך PDF חתום.</p>
        </HoverCard>
        {/* webhook + sheets */}
        <HoverCard delay={0.04} className="p-7 md:col-span-2">
          <Title icon={Webhook} title="Google Sheets או Webhook" />
          <p className="mt-3 text-slate-600">כשמסמך או טופס נחתמים הנתונים נשלחים לכתובת שתגדירו. תבנית Apps Script מוכנה מוסיפה שורה לגיליון ושומרת את החתימות בדרייב.</p>
          <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm" dir="rtl">
            <div className="grid grid-cols-3 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-800"><span>שם</span><span>מסמך</span><span>נחתם</span></div>
            {[['נועם ברק', 'טופס הסכמה', '12.11'], ['שירה מור', 'הצעת מחיר', '13.11'], ['עידו פרי', 'הסכם שירות', '14.11']].map(([a, b, c]) => (
              <div key={a} className="grid grid-cols-3 border-t border-slate-100 px-3 py-2 text-xs text-slate-600"><span className="font-bold text-ink">{a}</span><span>{b}</span><span>{c}</span></div>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><Sheet size={14} strokeWidth={STROKE} className="text-leaf" />נתוני הדגמה</p>
        </HoverCard>
        {/* תבניות */}
        <HoverCard delay={0.08} className="p-7">
          <Title icon={LayoutTemplate} title="תבניות" />
          <p className="mt-3 text-slate-600">מסמכים שחוזרים על עצמם נשלחים מתבנית מוכנה עם כל השדות במקום.</p>
          <div className="mt-4 flex flex-wrap gap-2">{['הסכם שירות', 'הצעת מחיר', 'אישור'].map((t) => <span key={t} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{t}</span>)}</div>
        </HoverCard>
        {/* טפסים */}
        <HoverCard delay={0.12} className="p-7">
          <Title icon={ClipboardList} tone="coral" title="בונה טפסים" />
          <p className="mt-3 text-slate-600">בונים טופס עם שדות ומשתפים קישור מילוי. התשובות והחתימה מגיעות אליכם.</p>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white p-3 text-xs font-bold text-slate-600 shadow-sm"><Link2 size={15} strokeWidth={STROKE} className="text-brand-600" /><span>קישור מילוי לשיתוף</span></div>
        </HoverCard>
        {/* אנשי קשר וכמה חותמים */}
        <HoverCard delay={0.16} className="p-7">
          <Title icon={Users} tone="leaf" title="ריבוי חותמים" />
          <p className="mt-3 text-slate-600">מסמך אחד לכמה אנשים וקישור אישי לכל אחד. נמענים קבועים נשמרים בלחיצה.</p>
          <div className="mt-4 flex -space-x-2 space-x-reverse">{['דנ', 'רס', 'לנ', 'מא'].map((t, i) => <span key={t} className={`grid h-9 w-9 place-items-center rounded-full border-2 border-white text-xs font-black text-white ${['bg-brand-600', 'bg-leaf', 'bg-coral', 'bg-brand-400'][i]}`}>{t}</span>)}</div>
        </HoverCard>
        {/* יומן פעילות */}
        <HoverCard delay={0.2} className="p-7">
          <Title icon={History} title="יומן פעילות" />
          <p className="mt-3 text-slate-600">כל פעולה במסמך נרשמת ביומן ורואים מי חתם ומתי.</p>
          <ul className="mt-4 grid gap-1.5 text-xs text-slate-600">{['המסמך נשלח', 'החותם פתח את הקישור', 'המסמך נחתם'].map((t, i) => <li key={t} className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${i === 2 ? 'bg-leaf' : 'bg-brand-300'}`} />{t}</li>)}</ul>
        </HoverCard>
        {/* SDK */}
        <HoverCard dark delay={0.24} className="p-7 md:col-span-2">
          <Title icon={Code2} tone="dark" title="SDK לאתר שלכם" dark />
          <p className="mt-3 text-brand-100/80">שילוב החתימה בכל אתר או מערכת: יצירת מסמך מתבנית, קישור חתימה והמתנה להשלמה.</p>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-black/30 p-4 font-mono text-[12px] leading-relaxed text-sky-200" dir="ltr">{`const smoov = new SmoovSDK();
const { id, signUrl } = await smoov.createFromTemplate('tpl_xxx');
const doc = await smoov.waitForCompletion(id);`}</pre>
        </HoverCard>
      </div>
    </Section>
  );
}

export function Audience() {
  const cards = [
    { icon: Briefcase, tone: 'brand', title: 'בעלי עסקים ועצמאים', text: 'הצעות מחיר והסכמי שירות ואישורים נחתמים בקישור אחד ואין צורך להדפיס.' },
    { icon: Building2, tone: 'leaf', title: 'משרדים וארגונים', text: 'תבניות לכל סוג מסמך, כמה חותמים בסדר קבוע ויומן פעילות לכל מסמך.' },
    { icon: Laptop, tone: 'coral', title: 'בעלי אתרים ומפתחים', text: 'ערכת SDK וגם Webhook שמחברים את החתימה לאתר או למערכת שכבר עובדים אצלכם.' },
    { icon: UsersRound, tone: 'brand', title: 'צוותים וחברות', text: 'ניהול עובדים והרשאות וגישת API ותבניות ללא הגבלה במסלול Business.' },
  ];
  return (
    <Section id="audience" className="bg-gradient-to-b from-transparent via-brand-50/50 to-transparent">
      <Heading eyebrow="מערכת אחת שמתאימה לכולם" title="מי עובד עם SmoovSign" lead="מעצמאי אחד ועד צוות שלם וכל אחד בוחר את המסלול שמתאים לו." />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ icon, tone, title, text }, i) => (
          <HoverCard key={title} delay={i * 0.08} className="p-7">
            <IconBox icon={icon} tone={tone} className="!h-14 !w-14" size={28} />
            <h3 className="mt-5 text-xl font-black text-ink">{title}</h3>
            <p className="mt-2 leading-relaxed text-slate-600">{text}</p>
          </HoverCard>
        ))}
      </div>
    </Section>
  );
}

export function How() {
  const steps = [
    { icon: Upload, title: 'מעלים מסמך', text: 'PDF או תמונה, או תבנית מוכנה שכבר הוגדרה.' },
    { icon: MousePointerClick, title: 'מסמנים שדות ונמענים', text: 'גוררים את שדות החתימה למקום הנכון ושולחים קישור לכל חותם.' },
    { icon: CheckCircle2, title: 'החותם חותם', text: 'החתימה מתבצעת מהנייד או מהמחשב והמסמך החתום מחכה לכם.' },
  ];
  return (
    <Section id="how" className="bg-gradient-to-br from-brand-800 to-brand-900 text-white">
      <Heading dark eyebrow="איך זה עובד" title="שלושה שלבים והמסמך חתום" lead="נכנסים עם חשבון Google ומתחילים לשלוח." />
      <div className="relative grid gap-5 md:grid-cols-3">
        {steps.map(({ icon, title, text }, i) => (
          <HoverCard key={title} dark delay={i * 0.1} className="!bg-white/10 p-7 backdrop-blur">
            <div className="flex items-center justify-between">
              <IconBox icon={icon} tone="dark" />
              <span className="text-5xl font-black text-white/15">{i + 1}</span>
            </div>
            <h3 className="mt-5 text-xl font-black">{title}</h3>
            <p className="mt-2 leading-relaxed text-brand-100/80">{text}</p>
          </HoverCard>
        ))}
      </div>
      <Reveal className="mt-10 flex flex-wrap justify-center gap-3 text-center"><a href={APP} className="btn-cta">כניסה למערכת</a><a href={WA} rel="noopener" className="btn-line"><WhatsAppIcon size={19} />דברו איתנו בוואצאפ</a></Reveal>
    </Section>
  );
}

const PLANS = [
  { name: 'Free', who: 'לשימוש אישי', m: 0, y: 0, per: 'לתמיד', items: ['10 שליחות בחודש', '2 נמענים למסמך', 'תבנית אחת', 'חתימה ידנית', 'קוד אימות למסמך'], cta: 'מתחילים בחינם', href: APP },
  { name: 'Basic', who: 'ליחידים ועסקים קטנים', m: 29, y: 279, items: ['כל היכולות של Free', '30 שליחות בחודש', '5 תבניות', 'סנכרון ענן', 'הודעות במייל', 'קישור מילוי פומבי'], cta: 'תקופת ניסיון', href: APP, hot: true },
  { name: 'Pro', who: 'לעסקים בינוניים', m: 59, y: 569, items: ['כל היכולות של Basic', '100 שליחות בחודש', '15 תבניות', 'סבב חתימות לפי סדר', 'מעטפות מסמכים', 'הודעות במייל ובוואצאפ'], cta: 'תקופת ניסיון', href: APP },
  { name: 'Business', who: 'לחברות וצוותים', m: 129, y: 1249, items: ['כל היכולות של Pro', '300 שליחות בחודש', 'תבניות ללא הגבלה', 'ניהול עובדים והרשאות', 'יומן פעילות מפורט', 'גישת API'], cta: 'דברו איתנו', href: WA },
];

export function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <Section id="pricing">
      <Heading eyebrow="מחירים" title="מסלול לכל גודל של עסק" lead="מתחילים בחינם וגדלים בהתאם לצורך." />
      <Reveal className="mb-8 flex items-center justify-center gap-3 text-sm font-bold">
        <span className={yearly ? 'text-slate-400' : 'text-ink'}>חודשי</span>
        <button type="button" aria-pressed={yearly} aria-label="מעבר בין חיוב חודשי לשנתי" onClick={() => setYearly((v) => !v)} className={`relative h-7 w-14 rounded-full transition ${yearly ? 'bg-brand-600' : 'bg-slate-300'}`}>
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${yearly ? 'start-8' : 'start-1'}`} />
        </button>
        <span className={yearly ? 'text-ink' : 'text-slate-400'}>שנתי</span>
        <span className="rounded-full bg-leaf-light px-2.5 py-0.5 text-xs font-bold text-emerald-800">חסכו 20%</span>
      </Reveal>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p, i) => (
          <HoverCard key={p.name} delay={i * 0.07} className={`flex flex-col p-7 ${p.hot ? '!border-brand-400 ring-2 ring-brand-300' : ''}`}>
            <p className="text-2xl font-black text-ink">{p.name}</p>
            <p className="text-sm text-slate-500">{p.who}</p>
            <p className="mt-4 text-5xl font-black tabular-nums text-ink"><span className="text-2xl">₪</span>{yearly ? p.y : p.m}</p>
            <p className="mb-5 text-sm text-slate-500">{p.per || (yearly ? 'לשנה' : 'לחודש')}</p>
            <ul className="mb-6 grid flex-1 gap-2 text-sm text-slate-700">
              {p.items.map((t) => <li key={t} className="flex items-start gap-2"><CheckCircle2 size={16} strokeWidth={STROKE} className="mt-0.5 shrink-0 text-brand-600" />{t}</li>)}
            </ul>
            <a href={p.href} rel="noopener" className={p.hot ? 'btn-brand' : 'btn-ghost'}>{p.cta}</a>
          </HoverCard>
        ))}
      </div>
    </Section>
  );
}


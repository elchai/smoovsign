import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, animate } from 'framer-motion';

export const STROKE = 1.75;

// אייקון Lucide בתוך מעטפת מרובעת עגולה. מגיב בעדינות כשמרחפים על הכרטיס (group)
export function IconBox({ icon: Icon, tone = 'brand', size = 24, className = '' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700 group-hover:bg-brand-600 group-hover:text-white',
    leaf: 'bg-leaf-light text-leaf group-hover:bg-leaf group-hover:text-white',
    coral: 'bg-coral-light text-coral group-hover:bg-coral group-hover:text-white',
    dark: 'bg-white/10 text-brand-200 group-hover:bg-brand-400 group-hover:text-brand-900',
  };
  return (
    <span className={`icon-box ${tones[tone]} group-hover:-rotate-6 group-hover:scale-110 ${className}`}>
      <Icon size={size} strokeWidth={STROKE} aria-hidden="true" />
    </span>
  );
}

// כניסה הדרגתית בגלילה. למי שביקש הפחתת תנועה, האלמנט מופיע מיד
export function Reveal({ children, delay = 0, className = '', as = 'div', y = 28 }) {
  const reduce = useReducedMotion();
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}

// כרטיס עם הרמה אלגנטית, הגדלה קלה וזוהר טורקיז במעבר עכבר
export function HoverCard({ children, className = '', delay = 0, dark = false }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.22 } }}
      className={`group relative overflow-hidden ${dark ? 'rounded-3xl border border-white/10 bg-brand-900 text-white shadow-soft' : 'card-glass'} transition-shadow duration-300 hover:border-brand-400/70 hover:shadow-glow ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`relative px-5 py-20 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function Heading({ eyebrow, title, lead, center = true, dark = false }) {
  return (
    <Reveal className={`${center ? 'mx-auto text-center' : ''} mb-12 max-w-2xl`}>
      {eyebrow && <span className={`eyebrow ${dark ? '!bg-white/10 !text-brand-200' : ''}`}>{eyebrow}</span>}
      <h2 className={`mt-4 text-3xl font-black leading-tight sm:text-5xl ${dark ? 'text-white' : 'text-ink'}`}>{title}</h2>
      {lead && <p className={`mt-4 text-lg leading-relaxed ${dark ? 'text-brand-100/80' : 'text-slate-600'}`}>{lead}</p>}
    </Reveal>
  );
}

export function Counter({ to, prefix = '', suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!inView || reduce) { if (reduce) setV(to); return; }
    const c = animate(0, to, { duration: 1.4, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [inView, to, reduce]);
  return <span ref={ref}>{prefix}{v}{suffix}</span>;
}

// סמל וואצאפ האמיתי (לא בועת צ'אט). מקבל size/className כמו אייקוני Lucide
export function WhatsAppIcon({ size = 24, className = '', ...rest }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden="true" {...rest}>
      <path d="M19.05 4.91A10 10 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.37a9.93 9.93 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.92-9.91 0-2.65-1.03-5.14-2.92-7.02ZM12.05 20.16h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.39c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.24-.64.81-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.24a7.53 7.53 0 0 1-1.39-1.73c-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.03 0 1.2.87 2.36.99 2.52.12.16 1.71 2.62 4.15 3.67.58.25 1.03.4 1.39.51.58.18 1.11.16 1.53.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

// מילות יחס לא נשארות לבד בסוף שורה: רווח בלתי שבור אחריהן. פועל גם על תוכן שנטען בהמשך.
// lookbehind ולא קבוצה רגילה, כדי שברצף כמו "של כל תשובה" שתי המילים ייקשרו באותו מעבר
const W = /(?<=^|\s)(ובלי|בלי|ללא|על|של|עם|את|אל|לפי|מול|בין|כל|לכל|או|גם|עד|ועד|לא|אם|כי|כמו)[ \t\n\r]+/g;
const NBSP = ' ';
const fix = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((n) => {
    const p = n.parentNode && n.parentNode.nodeName;
    if (p === 'SCRIPT' || p === 'STYLE' || p === 'TEXTAREA' || p === 'INPUT') return;
    const v = n.nodeValue.replace(W, (m, w) => w + NBSP);
    if (v !== n.nodeValue) n.nodeValue = v;
  });
};
export function bindPrepositions(root) {
  fix(root);
  let t;
  const obs = new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => fix(root), 60); });
  obs.observe(root, { childList: true, subtree: true });
  return () => obs.disconnect();
}

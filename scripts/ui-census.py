#!/usr/bin/env python3
"""
DhanVeda UI consistency census (read-only). Counts DISTINCT styles per component type across all 12 views.

  npm run build && npx vite preview --port 4173 &
  python scripts/ui-census.py                       # print the report (desktop 1280 + mobile 390)
  python scripts/ui-census.py --max-buttons 6 --max-cards 3 --max-inputs 2 --max-eyebrows 1   # gate: exit 1 if exceeded

Variant keys: buttons (height, radius, font-size, weight); cards (radius, padding, shadow?); inputs (height, radius, font-size);
eyebrows = uppercase labels (size, tracking, weight); headings (tag, size, weight); money = (font family, size).
Update VIEWS if navigation labels are renamed.
"""
import argparse, collections as C, json, sys
from playwright.sync_api import sync_playwright

VIEWS = ["Dashboard", "Transactions", "People / Splits", "Budgets", "Recurring Payments", "Categories", "Emergency Fund",
         "Investments", "Goals & Dreams", "Achievements", "AI Health Summary", "Settings"]
JS = r"""()=>{
 const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
 const main=document.querySelector('main'), px=v=>parseFloat(v)||0, o={};
 o.buttons=[...main.querySelectorAll('button')].filter(b=>vis(b)&&b.textContent.trim()).map(b=>{const s=getComputedStyle(b);
   return [Math.round(b.getBoundingClientRect().height),Math.round(px(s.borderTopLeftRadius)),s.fontSize,s.fontWeight]});
 o.cards=[...main.querySelectorAll('*')].filter(e=>{if(!vis(e))return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();
   return px(s.borderTopLeftRadius)>=12&&r.width>=180&&r.height>=60&&s.backgroundColor!=='rgba(0, 0, 0, 0)'&&(px(s.borderTopWidth)>0||s.boxShadow!=='none')})
   .map(e=>{const s=getComputedStyle(e);return [Math.round(px(s.borderTopLeftRadius)),Math.round(px(s.paddingLeft)),s.boxShadow!=='none']});
 o.inputs=[...main.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(vis).map(e=>{const s=getComputedStyle(e);
   return [Math.round(e.getBoundingClientRect().height),Math.round(px(s.borderTopLeftRadius)),s.fontSize]});
 o.headings=[...main.querySelectorAll('h1,h2,h3,h4')].filter(vis).map(e=>{const s=getComputedStyle(e);return [e.tagName,s.fontSize,s.fontWeight]});
 o.eyebrows=[...main.querySelectorAll('*')].filter(e=>vis(e)&&e.children.length===0&&e.textContent.trim().length>2&&getComputedStyle(e).textTransform==='uppercase')
   .map(e=>{const s=getComputedStyle(e);return [s.fontSize,s.letterSpacing,s.fontWeight]});
 o.money=[];const w=document.createTreeWalker(main,NodeFilter.SHOW_TEXT);
 while(w.nextNode()){const n=w.currentNode;if(/₹\s?[\d,]+/.test(n.textContent)){const e=n.parentElement;if(vis(e)){const s=getComputedStyle(e);o.money.push([s.fontFamily.split(',')[0].replace(/["']/g,''),s.fontSize])}}}
 o.compact=[...new Set((main.innerText.match(/\b\d[\d,.]*\s?(?:K|L|Cr)\b/g)||[]))];
 o.labels=[...main.querySelectorAll('button')].filter(vis).map(b=>b.textContent.trim()).filter(t=>/^[A-Za-z][A-Za-z' ]+$/.test(t)&&t.split(' ').length>1);
 return o}"""

def click(pg, label):
    pg.evaluate("(l)=>{[...document.querySelectorAll('button')].find(x=>x.textContent.trim().startsWith(l))?.click()}", label); pg.wait_for_timeout(800)

def collect(url):
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        for (w, h, tag) in [(1280, 800, "desktop"), (390, 844, "mobile")]:
            pg = b.new_context(viewport={"width": w, "height": h}).new_page(); pg.on("dialog", lambda d: d.accept())
            pg.goto(url, wait_until="networkidle"); pg.wait_for_timeout(400)
            pg.evaluate("()=>{[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Load Demo Dataset'))?.click()}"); pg.wait_for_timeout(1500)
            for _ in range(8):
                if not pg.evaluate("()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Collect & Continue'));b&&b.click();return !!b}"): break
                pg.wait_for_timeout(500)
            for v in VIEWS:
                click(pg, v); pg.evaluate("()=>window.scrollTo(0,0)"); out[f"{tag}:{v}"] = pg.evaluate(JS)
        b.close()
    return out

def casing(labels):
    k = C.Counter()
    for t in labels:
        words = [w for w in t.split() if len(w) > 3]
        k["Title Case" if words and all(w[0].isupper() for w in words) else "sentence case"] += 1
    return dict(k)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--url", default="http://127.0.0.1:4173/"); ap.add_argument("--json")
    for n in ("buttons", "cards", "inputs", "eyebrows"): ap.add_argument(f"--max-{n}", type=int)
    a = ap.parse_args(); d = collect(a.url); bad = 0
    if a.json: json.dump(d, open(a.json, "w"))
    for tag in ("desktop", "mobile"):
        rows = {k: [x for v in VIEWS for x in d[f"{tag}:{v}"][k]] for k in ("buttons", "cards", "inputs", "headings", "eyebrows", "money")}
        cnt = {k: C.Counter(map(tuple, v)) for k, v in rows.items()}
        print(f"\n== {tag} ==")
        for k in cnt: print(f"{k:9s} total {sum(cnt[k].values()):4d} | distinct {len(cnt[k]):3d} | top: " + "; ".join(f"{list(x)}x{n}" for x, n in cnt[k].most_common(4)))
        print("compact amounts:", sorted({c for v in VIEWS for c in d[f'{tag}:{v}']['compact']}))
        print("button label casing:", casing([t for v in VIEWS for t in d[f'{tag}:{v}']['labels']]))
        for n in ("buttons", "cards", "inputs", "eyebrows"):
            lim = getattr(a, f"max_{n}")
            if lim is not None and len(cnt[n]) > lim: print(f"  FAIL {n}: {len(cnt[n])} distinct > {lim}"); bad += 1
    sys.exit(1 if bad else 0)

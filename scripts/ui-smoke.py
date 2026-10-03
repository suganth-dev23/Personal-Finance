#!/usr/bin/env python3
"""
DhanVeda UI smoke + audit. Read-only: never edits the repo.

  pip install playwright && playwright install chromium
  python scripts/ui-smoke.py --serve                      # builds nothing; runs `npx vite preview` for you
  python scripts/ui-smoke.py --url http://127.0.0.1:4173  # use a server you already started (run `npm run build` first)

Per viewport x theme it: loads the demo dataset, visits all 12 sidebar/More views, asserts the right view
opened (Navbar title), then measures: page-level horizontal scroll, un-contained overflowing elements,
console errors, failed non-font requests, unnamed buttons/inputs, tap targets < 44px (info), and (--contrast)
low-contrast text (heuristic; confirm with axe). Writes report.json + screenshots. Exit 1 on any FAIL.
"""
import argparse, json, os, subprocess, sys, time, urllib.request
from playwright.sync_api import sync_playwright

VIEWS = [  # (sidebar/More label, Navbar title in src/components/layout/Navbar.tsx VIEW_TITLES)
    ("Dashboard", "Financial Dashboard"), ("Transactions", "Transaction History"),
    ("People / Splits", "People & Expense Splits"), ("Budgets", "Monthly Budgets"),
    ("Recurring Payments", "Recurring Payments"), ("Categories", "Spending Categories"),
    ("Emergency Fund", "Emergency Fund"), ("Investments", "Investments Portfolio"),
    ("Goals & Dreams", "Dreams & Goals"), ("Achievements", "Achievements & Badges"),
    ("AI Health Summary", "AI Financial Health Summary"), ("Settings", "App Settings & Backup"),
]
KNOWN_NOISE = ("width(0) and height(0) of chart",)       # recharts first-paint warning, tracked as known
FONT_HOSTS = ("fonts.googleapis.com", "fonts.gstatic.com")  # blocked in some sandboxes; not an app failure

JS_CLICK = """(l)=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim().startsWith(l));
  if(!b) return false; b.click(); return true}"""
JS_TITLE = "()=>document.querySelector('header.sticky h1, header h1')?.textContent.trim() || ''"
JS_OVERFLOW = """()=>{const iw=innerWidth, out=[];
  for (const e of document.querySelectorAll('main *')) {
    const r=e.getBoundingClientRect(); if(r.width===0||r.right<=iw+1) continue;
    if (getComputedStyle(e).position==='fixed') continue;
    let p=e.parentElement, contained=false;
    while(p && p.tagName!=='MAIN'){ const s=getComputedStyle(p);
      if(['auto','scroll','hidden','clip'].includes(s.overflowX) && p.getBoundingClientRect().right<=iw+1){contained=true;break}
      p=p.parentElement }
    if(!contained) out.push((e.tagName+'.'+String(e.className).split(' ').slice(0,3).join('.')).slice(0,80));
    if(out.length>=5) break }
  return {sw:document.documentElement.scrollWidth, iw, uncontained:out}}"""
JS_A11Y = """()=>{const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
  const name=e=>(e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')||e.getAttribute('title')||e.textContent||'').trim()
        ||(e.querySelector('img[alt]')?.getAttribute('alt')||'');
  const btns=[...document.querySelectorAll('button,[role=button],a[href]')].filter(vis);
  const unnamed=btns.filter(b=>!name(b)).length;
  const inputs=[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(vis);
  const unlabeled=inputs.filter(i=>!(i.id&&document.querySelector('label[for="'+i.id+'"]'))&&!i.closest('label')&&!i.getAttribute('aria-label')&&!i.getAttribute('aria-labelledby')&&!i.getAttribute('placeholder')).length;
  const small=btns.filter(b=>{const r=b.getBoundingClientRect();return r.width<44||r.height<44}).length;
  return {unnamedButtons:unnamed, unlabeledInputs:unlabeled, tapTargetsUnder44:small, interactive:btns.length}}"""
JS_CONTRAST = """()=>{
  const cv=document.createElement('canvas'); cv.width=cv.height=1; const cx=cv.getContext('2d',{willReadFrequently:true}); const cache=new Map();
  const parse=c=>{ // Tailwind v4 computes colours as oklch()/color(); a 1px canvas normalises ANY css colour to sRGB
    if(!c) return null; if(cache.has(c)) return cache.get(c);
    cx.clearRect(0,0,1,1); cx.fillStyle='#000'; cx.fillStyle=c; cx.fillRect(0,0,1,1);
    const d=cx.getImageData(0,0,1,1).data; const v={r:d[0],g:d[1],b:d[2],a:d[3]/255}; cache.set(c,v); return v};
  const lin=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
  const L=c=>0.2126*lin(c.r)+0.7152*lin(c.g)+0.0722*lin(c.b);
  const over=(f,b)=>({r:f.r*f.a+b.r*(1-f.a),g:f.g*f.a+b.g*(1-f.a),b:f.b*f.a+b.b*(1-f.a),a:1});
  const bgOf=e=>{const stack=[];for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);
      if(s.backgroundImage!=='none' && s.backgroundImage.includes('gradient')) return null; // gradient: skip (heuristic)
      const c=parse(s.backgroundColor); if(c&&c.a>0){stack.push(c); if(c.a>=1)break}}
    let base={r:255,g:255,b:255,a:1}; if(document.documentElement.classList.contains('dark')) base=parse(getComputedStyle(document.body).backgroundColor)||{r:11,g:14,b:20,a:1};
    for(let i=stack.length-1;i>=0;i--) base=over(stack[i],base); return base};
  const bad=[];let checked=0;
  const w=document.createTreeWalker(document.querySelector('main')||document.body,NodeFilter.SHOW_TEXT);
  while(w.nextNode()){const n=w.currentNode; const t=n.textContent.trim(); if(!t) continue; const e=n.parentElement;
    const r=e.getBoundingClientRect(); const s=getComputedStyle(e); if(r.width===0||r.height===0||s.visibility==='hidden'||+s.opacity===0) continue;
    if(e.closest('svg,[disabled],[aria-hidden=true]')) continue;
    const fg=parse(s.color), bg=bgOf(e); if(!fg||!bg) continue; checked++;
    const f=over(fg,bg), l1=L(f), l2=L(bg), ratio=(Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
    const px=parseFloat(s.fontSize), bold=parseInt(s.fontWeight)>=700, large=px>=24||(px>=18.66&&bold);
    if(ratio < (large?3:4.5)) bad.push({t:t.slice(0,32),ratio:+ratio.toFixed(2),cls:String(e.className).split(' ').filter(c=>/text-/.test(c)).slice(0,2).join(' ')});
  }
  const byKey={}; bad.forEach(b=>{const k=b.cls||'(inherited)'; byKey[k]=(byKey[k]||0)+1});
  return {checked, failing:bad.length, topClasses:Object.entries(byKey).sort((a,b)=>b[1]-a[1]).slice(0,5), sample:bad.slice(0,3)}}"""


def wait_up(url, secs=30):
    for _ in range(secs * 2):
        try:
            urllib.request.urlopen(url, timeout=1); return True
        except Exception:
            time.sleep(0.5)
    return False


def run(args):
    report, failures = {}, 0
    os.makedirs(args.out, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for vp in args.viewports.split(","):
            w, h = map(int, vp.split("x"))
            for theme in args.themes.split(","):
                ctx = browser.new_context(viewport={"width": w, "height": h},
                                          reduced_motion="reduce" if args.reduced_motion else "no-preference")
                ctx.add_init_script(f"try{{localStorage.setItem('dhanveda_dark_mode','{'true' if theme=='dark' else 'false'}')}}catch(e){{}}")
                pg = ctx.new_page(); pg.on("dialog", lambda d: d.accept())
                errors, bad_req = [], []
                pg.on("console", lambda m: errors.append(m.text[:140]) if m.type in ("error", "warning")
                      and not m.text.startswith("Failed to load resource") else None)
                pg.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)[:160]))
                pg.on("response", lambda r: bad_req.append(f"{r.status} {r.url[:90]}") if r.status >= 400
                      and not any(h in r.url for h in FONT_HOSTS) else None)
                pg.goto(args.url, wait_until="networkidle"); pg.wait_for_timeout(500)
                if pg.evaluate(JS_CLICK, "Load Demo Dataset"):
                    pg.wait_for_timeout(1500)
                for _ in range(8):                                   # dismiss badge popups from the bulk load
                    if not pg.evaluate(JS_CLICK, "Collect & Continue"): break
                    pg.wait_for_timeout(600)
                pg.wait_for_timeout(1200)
                key = f"{vp}-{theme}" + ("-rm" if args.reduced_motion else "")
                for label, title in VIEWS:
                    if args.views and label not in args.views.split(","): continue
                    errors.clear(); bad_req.clear()
                    if not pg.evaluate(JS_CLICK, label):
                        report[f"{key}:{label}"] = {"FAIL": ["nav button not found"]}; failures += 1; continue
                    pg.wait_for_timeout(900)
                    for _ in range(3):                               # popups can appear on navigation
                        if not pg.evaluate(JS_CLICK, "Collect & Continue"): break
                        pg.wait_for_timeout(500)
                    got = pg.evaluate(JS_TITLE)
                    ov, a11y = pg.evaluate(JS_OVERFLOW), pg.evaluate(JS_A11Y)
                    entry = {"title": got, "a11y": a11y, "errors": sorted(set(errors))[:4], "badRequests": bad_req[:3]}
                    fails = []
                    if got != title: fails.append(f"wrong view: expected '{title}' got '{got}'")
                    if ov["sw"] > ov["iw"]: fails.append(f"page h-scroll {ov['sw']}>{ov['iw']}")
                    if ov["uncontained"]: fails.append("uncontained overflow: " + "; ".join(ov["uncontained"][:3]))
                    real = [e for e in entry["errors"] if not any(k in e for k in KNOWN_NOISE)]
                    if real: fails.append("console: " + real[0])
                    if bad_req: fails.append("request failed: " + bad_req[0])
                    if args.strict_a11y and (a11y["unnamedButtons"] or a11y["unlabeledInputs"]):
                        fails.append(f"a11y: {a11y['unnamedButtons']} unnamed buttons, {a11y['unlabeledInputs']} unlabeled inputs")
                    if args.contrast:
                        entry["contrast"] = pg.evaluate(JS_CONTRAST)
                        if args.max_low_contrast is not None and entry["contrast"]["failing"] > args.max_low_contrast:
                            fails.append(f"low-contrast text {entry['contrast']['failing']} > {args.max_low_contrast}")
                    if fails: entry["FAIL"] = fails; failures += 1
                    report[f"{key}:{label}"] = entry
                    if not args.no_screenshots:
                        pg.screenshot(path=os.path.join(args.out, f"{key}-{label.split()[0].lower()}.png"),
                                      full_page=(w < 768))
                ctx.close()
        browser.close()
    with open(os.path.join(args.out, "report.json"), "w") as f: json.dump(report, f, indent=1)
    for k, v in report.items():
        flag = "FAIL " + " | ".join(v["FAIL"]) if "FAIL" in v else "ok"
        extra = f"  tap<44px:{v['a11y']['tapTargetsUnder44']}" if "a11y" in v else ""
        if "contrast" in v: extra += f"  lowContrast:{v['contrast']['failing']}/{v['contrast']['checked']}"
        print(f"{k:34s} {flag}{extra}")
    print(f"\n{len(report)} checks, {failures} failing. Report: {os.path.join(args.out, 'report.json')}")
    return 1 if failures else 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://127.0.0.1:4173")
    ap.add_argument("--serve", action="store_true", help="start `npx vite preview` (run `npm run build` first)")
    ap.add_argument("--out", default="ui-smoke-out")
    ap.add_argument("--viewports", default="1280x800,390x844,320x640")
    ap.add_argument("--themes", default="light,dark")
    ap.add_argument("--views", default="", help="comma-separated labels, e.g. 'Dashboard,Budgets'")
    ap.add_argument("--reduced-motion", action="store_true")
    ap.add_argument("--contrast", action="store_true", help="heuristic text-contrast scan (confirm with axe)")
    ap.add_argument("--max-low-contrast", type=int, default=None, help="fail a view above this count (use 0 from Phase 1)")
    ap.add_argument("--strict-a11y", action="store_true", help="fail on unnamed buttons / unlabeled inputs")
    ap.add_argument("--no-screenshots", action="store_true")
    a = ap.parse_args()
    srv = None
    if a.serve:
        srv = subprocess.Popen(["npx", "vite", "preview", "--port", a.url.rsplit(":", 1)[-1].strip("/"), "--host", "127.0.0.1"],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        if not wait_up(a.url): sys.exit("server not reachable at " + a.url)
        code = run(a)
    finally:
        if srv: srv.terminate()
    sys.exit(code)

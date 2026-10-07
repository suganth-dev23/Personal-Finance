#!/usr/bin/env python3
"""
DhanVeda performance probe (read-only). Emulates a low-end phone: 390x844, CPU throttled (default 6x).

  npm run build && npx vite preview --port 4173 &        # serve the production build
  python scripts/perf-probe.py --n 25                    # demo-sized data
  python scripts/perf-probe.py --n 2000 --out perf-2000.json

It loads the demo dataset, clones its transactions up to N (spread over 3 years) directly in IndexedDB,
reloads under CPU throttling, then measures: cold load, view switches (until the main thread is idle again),
Transactions DOM size / heap / scroll frame times, typing in search, and how many IndexedDB writes ONE delete causes.
"Blocked" = sum of (long task duration - 50 ms) after the action. Update the NAV_* labels if navigation is renamed.
"""
import argparse, json, sys, time
from playwright.sync_api import sync_playwright

NAV_TX, NAV_BUDGETS, NAV_HOME = "History", "Budgets", "Home"      # visible button labels (mobile tab bar / More sheet)
INIT = """
window.__lt=[]; window.__puts=0; window.__clears=0; window.__dels=0;
try{ new PerformanceObserver(l=>{for(const e of l.getEntries()) window.__lt.push(e.duration)}).observe({type:'longtask',buffered:true}); }catch(e){}
const P=IDBObjectStore.prototype, put=P.put, clr=P.clear, del=P.delete;
P.put=function(...a){window.__puts++; return put.apply(this,a)}; P.clear=function(...a){window.__clears++; return clr.apply(this,a)};
P.delete=function(...a){window.__dels++; return del.apply(this,a)};
"""
SEED = """async (N)=>{ const db=await new Promise((ok,err)=>{const r=indexedDB.open('dhanveda_db'); r.onsuccess=()=>ok(r.result); r.onerror=()=>err(r.error)});
  const base=await new Promise(ok=>{const q=db.transaction('transactions').objectStore('transactions').getAll(); q.onsuccess=()=>ok(q.result)});
  const out=[], day=86400000, end=Date.now();
  for(let i=0;i<N;i++){ const b=base[i%base.length], d=new Date(end-(i*(3*365*day/N)));
    out.push({...b,id:'perf-'+i,description:'ROW-'+String(i).padStart(4,'0'),date:d.toISOString().slice(0,10),createdAt:d.toISOString(),updatedAt:d.toISOString()}) }
  await new Promise((ok,err)=>{const tx=db.transaction('transactions','readwrite'),s=tx.objectStore('transactions'); s.clear(); out.forEach(o=>s.put(o)); tx.oncomplete=ok; tx.onerror=()=>err(tx.error)});
  db.close(); return out.length }"""
CLICK = "(l)=>{const b=[...document.querySelectorAll('button')].find(x=>{const t=x.textContent.trim(); return t.startsWith(l) || (l==='History' && t.startsWith('Ledger'))}); if(b) b.click(); return !!b}"
POPUPS = "()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Collect & Continue')); b&&b.click(); return !!b}"
BLOCKED = "()=>Math.round(window.__lt.reduce((a,d)=>a+Math.max(0,d-50),0))"


def settle(pg, quiet_polls=2, max_s=120):
    """Wait until no new long-task time accrues for quiet_polls x 700 ms; return blocked ms since reset."""
    prev, same, t = -1, 0, time.time()
    while time.time() - t < max_s:
        cur = pg.evaluate(BLOCKED)
        same = same + 1 if cur == prev else 0
        if same >= quiet_polls: break
        prev = cur; pg.wait_for_timeout(700)
    return pg.evaluate(BLOCKED)


def go(pg, label):
    pg.wait_for_timeout(800); pg.evaluate("()=>{window.__lt=[]}")
    t0 = time.time(); ok = pg.evaluate(CLICK, label)
    if not ok:
        pg.evaluate("""()=>{const m=[...document.querySelectorAll('button')].find(x=>x.textContent.trim().startsWith('More')||x.getAttribute('aria-label')==='Open more tools and views'); if(m) m.click()}""")
        pg.wait_for_timeout(400)
        ok = pg.evaluate(CLICK, label)
    pg.evaluate("()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))")
    first_paint_ms = round((time.time() - t0) * 1000)
    return {"found": ok, "first_paint_ms": first_paint_ms, "blocked_ms": settle(pg)}


def main(a):
    res = {"n": a.n, "cpu": a.cpu, "url": a.url}
    with sync_playwright() as p:
        b = p.chromium.launch(); ctx = b.new_context(viewport={"width": 390, "height": 844}); ctx.add_init_script(INIT)
        pg = ctx.new_page(); pg.on("dialog", lambda d: d.accept())
        pg.goto(a.url, wait_until="networkidle"); pg.wait_for_timeout(500)
        pg.evaluate("()=>{[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Load Demo Dataset'))?.click()}")
        pg.wait_for_timeout(2500)
        if a.n > 25: res["seeded"] = pg.evaluate(SEED, a.n)
        cdp = ctx.new_cdp_session(pg); cdp.send("Emulation.setCPUThrottlingRate", {"rate": a.cpu}); cdp.send("Performance.enable")
        t0 = time.time(); pg.goto(a.url, wait_until="load")
        pg.wait_for_function("()=>document.body.innerText.toUpperCase().includes('NET WORTH')", timeout=180000)
        res["cold_load_to_content_s"] = round(time.time() - t0, 2); pg.wait_for_timeout(1500)
        res["cold_blocked_ms"] = pg.evaluate(BLOCKED)
        res["fcp_ms"] = pg.evaluate("()=>Math.round((performance.getEntriesByName('first-contentful-paint')[0]||{startTime:-1}).startTime)")
        res["first_load_transfer_kB"] = pg.evaluate("()=>Math.round(performance.getEntriesByType('resource').reduce((s,r)=>s+(r.encodedBodySize||0),0)/1000)")
        for _ in range(6):
            if not pg.evaluate(POPUPS): break
            pg.wait_for_timeout(700)
        res["open_transactions"] = go(pg, NAV_TX)
        res["transactions_dom"] = pg.evaluate("()=>({nodes:document.getElementsByTagName('*').length,rowsLike:document.querySelectorAll('main li,main [role=row],main tr').length})")
        pg.mouse.move(195, 420); seen = set()
        scroll_frames = []
        for _ in range(80):
            t_frame = time.time()
            pg.mouse.wheel(0, 300)
            pg.wait_for_timeout(30)
            scroll_frames.append(round((time.time() - t_frame) * 1000))
            seen.update(pg.evaluate("()=>(document.body.innerText.match(/ROW-\\d{4}/g)||[])"))
        if not seen:
            seen.update(pg.evaluate("()=>[...document.querySelectorAll('main tr, main li, main [role=row]')].map(r=>(r.textContent||'').slice(0,40)).filter(Boolean)"))
        scroll_frames.sort()
        res["rows_reached"] = len(seen)
        res["scroll"] = {
            "p50": scroll_frames[len(scroll_frames) >> 1] if scroll_frames else 0,
            "p95": scroll_frames[int(len(scroll_frames) * 0.95)] if scroll_frames else 0,
            "worst": scroll_frames[-1] if scroll_frames else 0,
            "over33": len([x for x in scroll_frames if x > 33]),
            "over100": len([x for x in scroll_frames if x > 100]),
            "rows_reached": len(seen),
        }
        pg.evaluate("()=>window.scrollTo(0,0)"); pg.wait_for_timeout(500)
        inp = pg.query_selector("main input[placeholder*='Search']")
        if inp:
            pg.evaluate("()=>{window.__lt=[]}"); t = time.time(); inp.click(); pg.keyboard.type("swiggy", delay=40)
            res["search_6_chars"] = {"typing_wall_s": round(time.time() - t, 2), "blocked_ms": settle(pg),
                                     "worst_task_ms": pg.evaluate("()=>Math.round(Math.max(0,...window.__lt))")}
            try:
                inp.fill("")
            except Exception:
                try:
                    pg.fill("main input[placeholder*='Search']", "", timeout=5000)
                except Exception:
                    pg.keyboard.press("Control+A")
                    pg.keyboard.press("Backspace")
            pg.wait_for_timeout(500); settle(pg)
        pg.evaluate("()=>{window.__puts=0;window.__clears=0;window.__dels=0;window.__lt=[]}")
        ok = pg.evaluate("""()=>{const b=document.querySelector('main button[title*="elete"],main button[aria-label*="elete"]'); if(b) b.click(); return !!b}""")
        blocked = settle(pg); pg.wait_for_timeout(2500); blocked = max(blocked, settle(pg))   # IndexedDB writes finish after the render
        res["delete_one_transaction"] = {"clicked": ok, "idb_puts": pg.evaluate("()=>window.__puts"),
            "idb_deletes": pg.evaluate("()=>window.__dels"), "idb_store_clears": pg.evaluate("()=>window.__clears"), "blocked_ms": blocked}
        res["leave_transactions_to_budgets"] = go(pg, NAV_BUDGETS)
        res["back_home"] = go(pg, NAV_HOME)
        m = {x["name"]: x["value"] for x in cdp.send("Performance.getMetrics")["metrics"]}
        res["end_state"] = {"dom_nodes": int(m.get("Nodes", 0)), "js_heap_MB": round(m.get("JSHeapUsedSize", 0) / 1e6, 1)}
        b.close()
    out = json.dumps(res, indent=1); print(out)
    if a.out: open(a.out, "w").write(out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://127.0.0.1:4173/"); ap.add_argument("--n", type=int, default=25)
    ap.add_argument("--cpu", type=float, default=6); ap.add_argument("--out")
    main(ap.parse_args())

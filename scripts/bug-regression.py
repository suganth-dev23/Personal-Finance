#!/usr/bin/env python3
"""
DhanVeda bug regression suite (read-only; never edits the repo). Each test reproduces ONE confirmed bug from
BUG-REPORT-AND-FIX-PROMPTS.md and PASSES only when the bug is fixed.

  npm run build && npx vite preview --port 4173 &
  pip install playwright && playwright install chromium
  python scripts/bug-regression.py                       # all tests
  python scripts/bug-regression.py T01 T05               # selected tests (prefix match)
  python scripts/bug-regression.py --url http://127.0.0.1:4173/

Exit code 1 if any test fails. Written against repo commit 27fe0e5 (labels: Transactions, Budgets, Home, Settings).
"""
import argparse, json, os, sys, tempfile, traceback
from playwright.sync_api import sync_playwright

IDB_ALL = """async (store)=>{const db=await new Promise((ok,err)=>{const r=indexedDB.open('dhanveda_db'); r.onsuccess=()=>ok(r.result); r.onerror=()=>err(r.error)});
  const rows=await new Promise(ok=>{const q=db.transaction(store).objectStore(store).getAll(); q.onsuccess=()=>ok(q.result)}); db.close(); return rows}"""
IDB_PUT = """async ([store,rows])=>{const db=await new Promise((ok,err)=>{const r=indexedDB.open('dhanveda_db'); r.onsuccess=()=>ok(r.result); r.onerror=()=>err(r.error)});
  await new Promise((ok,err)=>{const tx=db.transaction(store,'readwrite'); rows.forEach(o=>tx.objectStore(store).put(o)); tx.oncomplete=ok; tx.onerror=()=>err(tx.error)}); db.close()}"""
SEED_ROWS = """async (N)=>{const db=await new Promise((ok,err)=>{const r=indexedDB.open('dhanveda_db'); r.onsuccess=()=>ok(r.result); r.onerror=()=>err(r.error)});
  const base=await new Promise(ok=>{const q=db.transaction('transactions').objectStore('transactions').getAll(); q.onsuccess=()=>ok(q.result)});
  const out=[], day=86400000, end=Date.now(); for(let i=0;i<N;i++){const b=base[i%base.length], d=new Date(end-(i*(2*365*day/N)));
   out.push({...b,id:'w-'+i,description:'ROW-'+String(i).padStart(4,'0'),date:d.toISOString().slice(0,10),createdAt:d.toISOString(),updatedAt:d.toISOString(),splits:undefined})}
  await new Promise((ok,err)=>{const tx=db.transaction('transactions','readwrite'),s=tx.objectStore('transactions'); s.clear(); out.forEach(o=>s.put(o)); tx.oncomplete=ok; tx.onerror=()=>err(tx.error)}); db.close(); return out.length}"""
CLICK_TXT = "(l)=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim().startsWith(l)); if(b) b.click(); return !!b}"
DELETE_FIRST = """(d)=>{const rows=[...document.querySelectorAll('main tr, main li, main [role=row]')].filter(r=>!d||r.textContent.includes(d));
  const b=rows.map(r=>r.querySelector('button[title*="elete"],button[aria-label*="elete"]')).find(Boolean); if(b){b.click(); return true} return false}"""
SCROLL_POS = "()=>Math.round((document.scrollingElement?.scrollTop||0)+(document.body.scrollTop||0)+(window.scrollY||0))"
BLANK = "()=>document.body.innerText.trim().length<80"


class Ctx:
    def __init__(self, browser, url, w=1280, h=800, mobile=False):
        self.ctx = browser.new_context(viewport={"width": w, "height": h}, has_touch=mobile, accept_downloads=True)
        self.pg = self.ctx.new_page(); self.url = url; self.dialogs = []
        self.pg.on("dialog", lambda d: (self.dialogs.append(d.message[:90]), d.accept()))
        self.errors = []; self.pg.on("pageerror", lambda e: self.errors.append(str(e)[:120]))
        self.pg.goto(url, wait_until="networkidle"); self.pg.wait_for_timeout(400)

    def demo(self):
        for _ in range(10):
            if self.pg.evaluate("()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Load Demo Dataset')); if(b){b.click(); return true} return false}"):
                break
            self.pg.wait_for_timeout(300)
        self.pg.wait_for_timeout(2500); self.dismiss(); return self

    def dismiss(self):
        for _ in range(8):
            if not self.pg.evaluate("()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Collect & Continue'));b&&b.click();return !!b}"): break
            self.pg.wait_for_timeout(600)

    def go(self, label): self.pg.evaluate(CLICK_TXT, label); self.pg.wait_for_timeout(900)
    def reload(self): self.pg.reload(wait_until="networkidle"); self.pg.wait_for_timeout(2200); self.dismiss()
    def rows(self, store="transactions"): return self.pg.evaluate(IDB_ALL, store)
    def close(self): self.ctx.close()


def T01_list_renders_all_rows(b, url):
    """B-01: with >40 transactions the windowed list must keep rendering rows while the user scrolls."""
    c = Ctx(b, url, 390, 844, True).demo(); c.pg.evaluate(SEED_ROWS, 600); c.reload(); c.go("Transactions"); c.pg.wait_for_timeout(800)
    c.pg.mouse.move(195, 420); seen = set()
    for _ in range(140):
        c.pg.mouse.wheel(0, 700); c.pg.wait_for_timeout(50)
        seen.update(c.pg.evaluate("()=>(document.body.innerText.match(/ROW-\\d{4}/g)||[])"))
    nodes = c.pg.evaluate("()=>document.getElementsByTagName('*').length"); c.close()
    return len(seen) >= 590 and "ROW-0599" in seen and nodes < 4000, f"rows reached {len(seen)}/600, last={max(seen) if seen else None}, DOM nodes={nodes}"


def T02_scroll_resets_on_navigation(b, url):
    """B-01b: opening another view must start at the top."""
    c = Ctx(b, url, 390, 844, True).demo(); c.go("Budgets"); c.pg.mouse.move(195, 420); c.pg.mouse.wheel(0, 800); c.pg.wait_for_timeout(500)
    before = c.pg.evaluate(SCROLL_POS); c.go("Home"); c.pg.wait_for_timeout(600); after = c.pg.evaluate(SCROLL_POS); c.close()
    return before > 300 and after < 60, f"scrolled {before}px on Budgets, Dashboard opened at {after}px"


def T03_corrupt_record_does_not_blank_app(b, url):
    """B-02: one malformed stored record must not white-screen the app (and Settings must stay reachable)."""
    c = Ctx(b, url).demo()
    c.pg.evaluate(IDB_PUT, ["transactions", [{"id": "bad-1", "date": None, "amount": "abc", "type": "expense", "description": None, "category": "x"}]])
    c.reload(); blank_dash = c.pg.evaluate(BLANK); c.go("Settings"); blank_settings = c.pg.evaluate(BLANK); c.close()
    return (not blank_dash) and (not blank_settings), f"dashboard blank={blank_dash}, settings blank={blank_settings}"


def T04_failed_write_is_visible_and_consistent(b, url):
    """B-03: if IndexedDB rejects a write, the user must be told, or the UI must not claim success."""
    c = Ctx(b, url).demo(); c.go("Transactions"); db_before = len(c.rows())
    c.pg.evaluate("()=>{const d=IDBObjectStore.prototype.delete; window.__f=true; IDBObjectStore.prototype.delete=function(...a){if(window.__f){window.__f=false; throw new DOMException('simulated','QuotaExceededError')} return d.apply(this,a)}}")
    c.pg.evaluate(DELETE_FIRST, ""); c.pg.wait_for_timeout(3000)
    db_after = len(c.rows()); ui = c.pg.evaluate("()=>(document.body.innerText.match(/(\\d+) of (\\d+) entries/)||[])[1]")
    warned = c.pg.evaluate("()=>/couldn.?t save|could not save|failed to save|storage (is )?full|not saved|save failed/i.test(document.body.innerText)")
    c.close(); consistent = ui is not None and int(ui) == db_after
    return warned or consistent, f"db {db_before}->{db_after}, UI shows {ui}, warning visible={warned}"


SEED_SPLIT = """async ()=>{const db=await new Promise((ok,err)=>{const r=indexedDB.open('dhanveda_db'); r.onsuccess=()=>ok(r.result); r.onerror=()=>err(r.error)});
  const txs=await new Promise(ok=>{const q=db.transaction('transactions').objectStore('transactions').getAll(); q.onsuccess=()=>ok(q.result)});
  const t=txs.find(x=>x.id==='tx-1')||txs[0]; const now=new Date().toISOString();
  t.splits=[{id:'sp-1',contactId:'c-test',amount:100,direction:'they_owe_me',settled:true}]; t.updatedAt=now;
  await new Promise((ok,err)=>{const tx=db.transaction(['contacts','settlements','transactions'],'readwrite');
    tx.objectStore('contacts').put({id:'c-test',name:'Test Friend',createdAt:now,updatedAt:now});
    tx.objectStore('settlements').put({id:'s-test',contactId:'c-test',date:now.slice(0,10),amount:100,createdAt:now,updatedAt:now,sourceTransactionId:t.id,sourceSplitEntryId:'sp-1',direction:'they_owe_me'});
    tx.objectStore('transactions').put(t); tx.oncomplete=ok; tx.onerror=()=>err(tx.error)}); db.close(); return {id:t.id,desc:t.description}}"""


def T05_undo_restores_original_and_settlements(b, url):
    """B-04: Undo must bring back the SAME transaction (id, createdAt) and its settlement records."""
    c = Ctx(b, url).demo(); t = c.pg.evaluate(SEED_SPLIT); c.reload(); c.go("Transactions")
    c.pg.evaluate(DELETE_FIRST, (t["desc"] or "")[:20]); c.pg.wait_for_timeout(900)
    c.pg.evaluate("()=>{[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Undo')?.click()}"); c.pg.wait_for_timeout(1500)
    ids = {x["id"] for x in c.rows()}; sets = c.rows("settlements"); c.close()
    return t["id"] in ids and len(sets) == 1, f"original id restored={t['id'] in ids}, settlements after undo={len(sets)} (expected 1)"


def T06_restore_malformed_is_rejected_or_confirmed(b, url):
    """B-05: restoring a backup must validate records and ask before replacing existing data."""
    c = Ctx(b, url).demo(); c.go("Settings"); before = len(c.rows())
    fp = os.path.join(tempfile.mkdtemp(), "bad.json")
    json.dump({"version": "2.1", "transactions": [{"id": "x1", "date": None, "amount": "abc", "type": "expense"}]}, open(fp, "w"))
    c.dialogs.clear(); (c.pg.query_selector("input[type=file][accept*='json']") or c.pg.query_selector("input[type=file]")).set_input_files(fp); c.pg.wait_for_timeout(2500)
    after = len(c.rows()); asked = any("replace" in d.lower() or "restore" in d.lower() or "overwrite" in d.lower() for d in c.dialogs)
    c.reload(); blank = c.pg.evaluate(BLANK); c.close()
    return (after == before or asked) and not blank, f"transactions {before}->{after}, confirmation shown={asked}, app blank after reload={blank}"


def T07_edit_survives_fast_close(b, url):
    """B-06: a delete must be persisted even if the tab is closed shortly after the click."""
    c = Ctx(b, url).demo(); c.go("Transactions"); before = len(c.rows()); c.pg.evaluate(DELETE_FIRST, ""); c.pg.wait_for_timeout(260)
    c.pg.goto("about:blank"); c.pg.wait_for_timeout(300); p2 = c.ctx.new_page(); p2.goto(url, wait_until="networkidle"); p2.wait_for_timeout(1500)
    after = len(p2.evaluate(IDB_ALL, "transactions")); c.close()
    return after == before - 1, f"transactions {before}->{after} after leaving 260 ms after the click"


def _open_add(c):
    c.pg.evaluate("()=>{[...document.querySelectorAll('button')].find(x=>x.textContent.trim().startsWith('Add Transaction'))?.click()}"); c.pg.wait_for_timeout(700)


def T08_double_click_save_creates_one(b, url):
    """B-07: double-clicking Save must create exactly one transaction."""
    c = Ctx(b, url).demo(); _open_add(c); d = c.pg.locator("[role=dialog]")
    d.locator("input[type=number]").fill("77"); d.locator("input[placeholder^='e.g. Swiggy']").fill("DOUBLE-CLICK")
    d.get_by_role("button", name="Save Transaction").dblclick(); c.pg.wait_for_timeout(1200)
    n = len([t for t in c.rows() if t.get("description") == "DOUBLE-CLICK"]); c.close()
    return n == 1, f"{n} transactions saved (expected 1)"


def T09_amount_and_date_bounds(b, url):
    """B-08: absurd amounts, sub-paise precision and year-9999 dates must be rejected (or normalised)."""
    c = Ctx(b, url).demo(); out = {}
    for label, amt, date in [("huge", "99999999999999999999", None), ("subpaise", "0.001", None), ("year9999", "5", "9999-12-31")]:
        _open_add(c); d = c.pg.locator("[role=dialog]"); d.locator("input[type=number]").fill(amt); d.locator("input[placeholder^='e.g. Swiggy']").fill("BOUND-" + label)
        if date: d.locator("input[type=date]").fill(date)
        d.get_by_role("button", name="Save Transaction").click(); c.pg.wait_for_timeout(900)
        out[label] = [t["amount"] for t in c.rows() if t.get("description") == "BOUND-" + label]
        if c.pg.locator("[role=dialog]").count(): c.pg.keyboard.press("Escape"); c.pg.wait_for_timeout(400)
    c.close(); ok = not out["huge"] and (not out["subpaise"] or out["subpaise"] == [0]) and not out["year9999"]
    return ok, f"saved amounts: {out}"


def T10_csv_export_neutralizes_formulas(b, url):
    """B-10: exported CSV cells that start with = + - @ must be neutralised (CSV/formula injection)."""
    c = Ctx(b, url).demo(); t = c.rows()[0]; t["description"] = '=HYPERLINK("http://evil.test","click")'; t["person"] = "+1+1"
    c.pg.evaluate(IDB_PUT, ["transactions", [t]]); c.reload(); c.go("Transactions")
    with c.pg.expect_download(timeout=8000) as dl:
        c.pg.evaluate("()=>{const b=[...document.querySelectorAll('main button')].find(b=>/export|csv|download/i.test((b.getAttribute('aria-label')||'')+(b.title||'')+b.textContent)); b&&b.click()}")
    text = open(dl.value.path(), encoding="utf-8-sig").read(); c.close()
    bad = [l for l in text.splitlines() if '"=' in l or '"+1' in l]
    return not bad, f"{len(bad)} exported row(s) contain an unneutralised formula cell"


def T11_modal_returns_focus_to_trigger(b, url):
    """B-14: closing a dialog with Escape must return focus to the control that opened it."""
    c = Ctx(b, url).demo(); c.go("Transactions")
    c.pg.evaluate("()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim().startsWith('Add Transaction')); window.__trigger=b; b.focus(); b.click()}"); c.pg.wait_for_timeout(700)
    c.pg.keyboard.press("Escape"); c.pg.wait_for_timeout(700)
    back = c.pg.evaluate("()=>document.activeElement===window.__trigger || (document.activeElement?.textContent||'').trim().startsWith('Add Transaction')")
    tag = c.pg.evaluate("()=>document.activeElement?.tagName"); c.close()
    return back, f"focus after close = {tag}"


TESTS = [T01_list_renders_all_rows, T02_scroll_resets_on_navigation, T03_corrupt_record_does_not_blank_app, T04_failed_write_is_visible_and_consistent,
         T05_undo_restores_original_and_settlements, T06_restore_malformed_is_rejected_or_confirmed, T07_edit_survives_fast_close,
         T08_double_click_save_creates_one, T09_amount_and_date_bounds, T10_csv_export_neutralizes_formulas, T11_modal_returns_focus_to_trigger]

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("only", nargs="*"); ap.add_argument("--url", default="http://127.0.0.1:4173/"); a = ap.parse_args()
    failed = 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for t in TESTS:
            if a.only and not any(t.__name__.startswith(o) for o in a.only): continue
            try: ok, detail = t(browser, a.url)
            except Exception as e: ok, detail = False, "test crashed: " + "".join(traceback.format_exception_only(type(e), e)).strip()[:160]
            failed += (not ok); print(f"{'PASS' if ok else 'FAIL'}  {t.__name__}  | {detail}")
        browser.close()
    print(f"\n{failed} failing"); sys.exit(1 if failed else 0)

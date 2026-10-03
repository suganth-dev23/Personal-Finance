#!/usr/bin/env python3
"""
Migration metrics for the DhanVeda UI overhaul. Read-only, no dependencies.

  python scripts/ui-metrics.py                         # print metrics for ./src (+ ./dist sizes if built)
  python scripts/ui-metrics.py --save baseline.json    # Phase 0: record the baseline
  python scripts/ui-metrics.py --check 4 --baseline baseline.json   # gate for phase N: exit 1 if a target is missed
"""
import argparse, glob, gzip, json, os, re, sys

SRC = "src"
def files(exts=(".tsx", ".ts")):
    return [p for p in glob.glob(f"{SRC}/**/*", recursive=True) if p.endswith(exts)]
def read(p):
    return open(p, encoding="utf-8").read()
def count(rx, paths):
    r = re.compile(rx); return sum(len(r.findall(read(p))) for p in paths)

COLOR = r"\b(?:bg|text|border|ring|from|to|via|fill|stroke|shadow|divide|placeholder|outline)-(?:%s)-\d{2,3}"
def metrics():
    tsx = files((".tsx",)); allf = files()
    non_gami = [p for p in tsx if "/gamification/" not in p.replace(os.sep, "/") and "StreakBanner" not in p and "Toast" not in p]
    m = {
        "hardcoded_hex_in_classes": count(r"\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide)-\[#[0-9A-Fa-f]{3,8}\]", tsx),
        "amber_orange_classes_total": count(COLOR % "amber|orange", tsx),
        "amber_orange_outside_gamification": count(COLOR % "amber|orange", non_gami),
        "emerald_classes": count(COLOR % "emerald", tsx),
        "rose_classes": count(COLOR % "rose", tsx),
        "light_text_slate_400_500": count(r"(?<![:\w-])text-slate-(?:400|500)\b", tsx),
        "text_under_12px": count(r"\btext-\[(?:9|10|11)px\]", tsx),
        "transition_all": count(r"\btransition-all\b", tsx),
        "bg_gradient_classes": count(r"\bbg-gradient-to-", tsx),
        "font_numeric_uses": count(r"\bfont-numeric\b", tsx),
        "jetbrains_mono_refs": count(r"JetBrains", allf + ["index.html"] + glob.glob(f"{SRC}/**/*.css", recursive=True)),
        "radius_off_scale(2xl|3xl|lg|md)": count(r"\brounded-(?:2xl|3xl|lg|md)\b", tsx),
        "formatINR_call_sites": count(r"\bformatINR\(", tsx),
        "money_component_uses": count(r"<Money\b", tsx),
        "backdrop_blur_classes": count(r"\bbackdrop-blur", tsx),
        "infinite_animations": count(r"animate-(?:spin(?:-slow)?|pulse|ping|bounce)(?![\w-])|animate-[a-z-]+-infinite\b", tsx),
        "react_memo_uses": count(r"\bmemo\(|React\.memo\(", tsx),
        "deferred_or_transition_uses": count(r"useDeferredValue|startTransition|useTransition", tsx),
        "aria_attributes": count(r"\baria-[a-z]+", tsx),
        "role_progressbar": count(r'role="progressbar"', tsx),
        "buttons_total": count(r"<button\b", tsx),
        "ui_primitives_dir_files": len(glob.glob(f"{SRC}/components/ui/*.tsx")),
        "lines_FinanceContext": len(read(f"{SRC}/context/FinanceContext.tsx").splitlines()) if os.path.exists(f"{SRC}/context/FinanceContext.tsx") else 0,
    }
    # per-folder colour census (drives codemod order)
    per = {}
    for d in sorted(glob.glob(f"{SRC}/components/*/")):
        ps = [p for p in tsx if p.startswith(d)]
        per[os.path.basename(d.rstrip("/"))] = {"amber_orange": count(COLOR % "amber|orange", ps),
            "emerald": count(COLOR % "emerald", ps), "rose": count(COLOR % "rose", ps)}
    m["_per_folder_colour"] = per
    # bundle sizes if built
    sizes = {}
    for p in glob.glob("dist/assets/*.js") + glob.glob("dist/assets/*.css"):
        raw = open(p, "rb").read(); n = os.path.basename(p)
        key = re.sub(r"-[A-Za-z0-9_]{6,}\.(js|css)$", r".\1", n)
        sizes[key] = {"raw_kB": round(len(raw)/1000, 1), "gzip_kB": round(len(gzip.compress(raw))/1000, 1)}
    m["_bundle"] = sizes
    fl = 0
    if os.path.exists("dist/index.html"):
        for ref in re.findall(r'(?:src|href)="/(assets/[^"]+\.(?:js|css))"', read("dist/index.html")):
            if os.path.exists("dist/" + ref): fl += len(gzip.compress(open("dist/" + ref, "rb").read()))
    m["first_load_gzip_kB"] = round(fl / 1000, 1)
    return m

# Proposed targets, keyed by the phase that must satisfy them. A target is (metric, op, value|"x*baseline").
TARGETS = {
    1: [("first_load_gzip_kB", "<=", 150), ("backdrop_blur_classes", "<=", 2)],
    2: [("react_memo_uses", ">=", 3), ("deferred_or_transition_uses", ">=", 1)],
    3: [("hardcoded_hex_in_classes", "<=", 0), ("text_under_12px", "<=", 0), ("jetbrains_mono_refs", "<=", 0)],
    4: [("ui_primitives_dir_files", ">=", 8)],
    5: [("aria_attributes", ">=", "1.5*baseline")],
    6: [("money_component_uses", ">=", 25), ("amber_orange_outside_gamification", "<=", 0), ("transition_all", "<=", "0.3*baseline"),
        ("money_component_uses", ">=", "0.8*formatINR_call_sites_baseline")],
    9: [("amber_orange_outside_gamification", "<=", 0), ("transition_all", "<=", "0.1*baseline"),
        ("light_text_slate_400_500", "<=", 0), ("role_progressbar", ">=", 8), ("first_load_gzip_kB", "<=", 150)],
}
def check(cur, base, phase):
    ok = True
    for phases in [p for p in TARGETS if p <= phase]:
        for name, op, val in TARGETS[phases]:
            if isinstance(val, str):
                k, ref = val.split("*"); k = float(k)
                refname = ref.replace("_baseline", "")
                val = k * (base.get(refname, base.get(name, 0)) if base else 0)
            v = cur[name]; passed = v <= val if op == "<=" else v >= val
            ok &= passed
            print(f"  {'ok  ' if passed else 'FAIL'} (phase {phases}) {name}: {v} {op} {val:g}")
    return ok

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--save"); ap.add_argument("--baseline"); ap.add_argument("--check", type=int)
    a = ap.parse_args()
    cur = metrics()
    base = json.load(open(a.baseline)) if a.baseline and os.path.exists(a.baseline) else None
    for k, v in cur.items():
        if k.startswith("_"): continue
        d = f"  (baseline {base[k]}, {cur[k]-base[k]:+g})" if base and k in base else ""
        print(f"{k:38s} {v}{d}")
    print("\nper-folder colour classes (amber/orange | emerald | rose):")
    for f, c in sorted(cur["_per_folder_colour"].items(), key=lambda x: -x[1]["amber_orange"]):
        print(f"  {f:14s} {c['amber_orange']:4d} | {c['emerald']:4d} | {c['rose']:4d}")
    if cur["_bundle"]:
        print("\nbundle (raw kB / gzip kB):")
        for n, s in sorted(cur["_bundle"].items(), key=lambda x: -x[1]["raw_kB"])[:8]: print(f"  {n:30s} {s['raw_kB']:7.1f} / {s['gzip_kB']:6.1f}")
    if a.save: json.dump(cur, open(a.save, "w"), indent=1); print("\nsaved", a.save)
    if a.check:
        print(f"\nphase {a.check} gate:"); sys.exit(0 if check(cur, base, a.check) else 1)

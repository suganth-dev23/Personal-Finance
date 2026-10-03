#!/usr/bin/env python3
"""WCAG contrast gate for tokens.css.  python scripts/contrast-check.py [tokens/tokens.css]   (exit 1 on any failure)
Parses `:root{}` (light) and `.dark{}` (dark = root overlaid by .dark). Every pair below must meet its minimum."""
import re, sys
path = sys.argv[1] if len(sys.argv) > 1 else "tokens/tokens.css"
css = open(path).read()
def block(sel):
    m = re.search(re.escape(sel) + r"\s*\{(.*?)\}", css, re.S)
    return dict(re.findall(r"--([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})", m.group(1))) if m else {}
light = block(":root"); dark = {**light, **block(".dark")}
def lum(h):
    h = h.lstrip("#"); f = lambda c: c/12.92 if c <= 0.03928 else ((c+0.055)/1.055)**2.4
    r, g, b = (f(int(h[i:i+2], 16)/255) for i in (0, 2, 4)); return 0.2126*r + 0.7152*g + 0.0722*b
def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True); return (la+0.05)/(lb+0.05)
T, U = 4.5, 3.0   # text, UI component / input boundary / focus indicator
PAIRS = [(fg, bg, T, "text") for fg in ("ink-1", "ink-2", "ink-3") for bg in ("app", "surface", "sunken")]
PAIRS += [("primary", bg, T, "text") for bg in ("app", "surface", "sunken")] + [("primary", "primary-tint", T, "text"),
          ("on-primary", "primary", T, "text")]
for role in ("positive", "negative", "warning", "reward"):
    PAIRS += [(role, "surface", T, "text"), (role, "sunken", T, "text"), (role, f"{role}-tint", T, "text")]
PAIRS += [("line-input", bg, U, "input edge") for bg in ("surface", "sunken", "app")]
PAIRS += [("primary", bg, U, "focus ring") for bg in ("app", "surface", "sunken")]
bad = 0
for mode, pal in (("light", light), ("dark", dark)):
    print(f"\n== {mode} ==")
    for fg, bg, need, kind in PAIRS:
        if fg not in pal or bg not in pal: print(f"  MISSING token {fg} or {bg}"); bad += 1; continue
        r = ratio(pal[fg], pal[bg]); ok = r >= need; bad += (not ok)
        if not ok or "-v" in sys.argv: print(f"  {'ok  ' if ok else 'FAIL'} {r:5.2f} (>= {need}) {kind:10s} {fg} {pal[fg]} on {bg} {pal[bg]}")
    print(f"  {len(PAIRS)} pairs checked")
print(f"\n{'ALL PASS' if not bad else str(bad)+' FAILURES'}"); sys.exit(1 if bad else 0)

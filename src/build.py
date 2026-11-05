"""Build Brand Astra from the master source (rules.js + check.js + app.html + Code.gs).

rules.js is the Recykal brand rulebook. It goes at the top of Code.gs and replaces the
/*@BRAND_RULES@*/ marker in app.html, so the server and the page always use the same rules.
check.js is the automatic check (no AI) that runs on the file in the browser; it replaces /*@BRAND_CHECK@*/.

Outputs (in the parent folder):
  brand-astra.html                      the app: runs inside Google Apps Script (opened on its own, it points to the company link)
  brand-astra-apps-script/Index.html    same file, for pasting into Apps Script
  brand-astra-apps-script/Code.gs       server code (rulebook + Code.gs)
  brand-astra-render/app/               the same Index.html and Code.gs, for the Render (Node) server
Run: python3 build.py
The sample-data preview (code between /*@DEMO_START@*/ and /*@DEMO_END@*/) is left out unless you run
python3 build.py --demo, which also writes brand-check-demo.html for a hosted preview.
"""
import os, re, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
IN_REPO = os.path.exists(os.path.join(OUT, "server.js"))   # run from src/ inside the Render repository: build app/ only
app = open(os.path.join(HERE, "app.html"), encoding="utf-8").read()
rules = open(os.path.join(HERE, "rules.js"), encoding="utf-8").read()
check = open(os.path.join(HERE, "check.js"), encoding="utf-8").read()
code = rules + "\n" + open(os.path.join(HERE, "Code.gs"), encoding="utf-8").read()
assert app.count("/*@BRAND_RULES@*/") == 1, "app.html needs one /*@BRAND_RULES@*/ marker"
assert app.count("/*@BRAND_CHECK@*/") == 1, "app.html needs one /*@BRAND_CHECK@*/ marker"
app = app.replace("/*@BRAND_RULES@*/", rules).replace("/*@BRAND_CHECK@*/", check)
DEMO = "--demo" in sys.argv
if not DEMO:
    app, n = re.subn(r"\n[ \t]*/\*@DEMO_START@\*/.*?/\*@DEMO_END@\*/[ \t]*", "", app, flags=re.S)
    assert n >= 2, "expected the demo blocks"
else:
    app = app.replace("/*@DEMO_START@*/", "").replace("/*@DEMO_END@*/", "")

m = re.match(r"\s*<title>(.*?)</title>\n", app)
assert m, "app.html must start with its <title>"
body = app[m.end():]

full = (
    "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
    "<base target=\"_top\">\n<title>Brand Astra</title>\n</head>\n<body>\n" + body + "\n</body>\n</html>\n"
)
artifact = "<title>Brand Astra Demo</title>\n" + body

if IN_REPO:
    os.makedirs(os.path.join(OUT, "app"), exist_ok=True)
    open(os.path.join(OUT, "app", "Index.html"), "w", encoding="utf-8").write(full)
    open(os.path.join(OUT, "app", "Code.gs"), "w", encoding="utf-8").write(code)
else:
    os.makedirs(os.path.join(OUT, "brand-astra-apps-script"), exist_ok=True)
    open(os.path.join(OUT, "brand-astra.html"), "w", encoding="utf-8").write(full)
    open(os.path.join(OUT, "brand-astra-apps-script", "Index.html"), "w", encoding="utf-8").write(full)
    open(os.path.join(OUT, "brand-astra-apps-script", "Code.gs"), "w", encoding="utf-8").write(code)
    if DEMO:
        open(os.path.join(OUT, "brand-check-demo.html"), "w", encoding="utf-8").write(artifact)
    # The Render repository gets the built app and a copy of this source.
    repo = os.path.join(OUT, "brand-astra-render")
    if os.path.isdir(repo):
        os.makedirs(os.path.join(repo, "app"), exist_ok=True)
        open(os.path.join(repo, "app", "Index.html"), "w", encoding="utf-8").write(full)
        open(os.path.join(repo, "app", "Code.gs"), "w", encoding="utf-8").write(code)
        os.makedirs(os.path.join(repo, "src"), exist_ok=True)
        for f in ("app.html", "rules.js", "check.js", "Code.gs", "build.py"):
            shutil.copyfile(os.path.join(HERE, f), os.path.join(repo, "src", f))

# Syntax-check the page script and the server code with Node, if available.
js = full.split("<script>")[1].split("</script>")[0]
tmp = os.path.join(HERE, ".check")
os.makedirs(tmp, exist_ok=True)
open(os.path.join(tmp, "page.js"), "w", encoding="utf-8").write(js)
open(os.path.join(tmp, "code.js"), "w", encoding="utf-8").write(code)
for f in ("page.js", "code.js"):
    r = subprocess.run(["node", "--check", os.path.join(tmp, f)], capture_output=True, text=True)
    if r.returncode:
        print(r.stderr); sys.exit(1)
print("built:", "demo" if DEMO else "production", len(full), "bytes · syntax OK")

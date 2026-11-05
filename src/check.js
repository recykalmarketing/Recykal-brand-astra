// ---------- Brand Astra automatic check (no AI) ----------
// Runs in the browser on the actual design file and decides every rule it can measure exactly:
//   PowerPoint (.pptx): opened with JSZip; fonts, colours, gradients, text styling, positions and pictures read from the slide XML.
//   PDF (also Google Slides and Docs, exported by the server): opened with pdf.js; fonts, colours, gradients and pictures read
//     from the drawing operations, text and positions from the text layer, and every page rendered for pixel checks.
//   Images (PNG, JPG, WEBP): pixels only (size, colours, corners, the template bar).
// Rules a computer can't judge reliably (logo artwork, imagery, alignment, proofreading) are marked for the brand team.
// The same file always gets the same result, and every lost point names the measurement behind it.

const BRAND_CHECK = (() => {
  const R = BRAND.ruleById;
  const RATIO = { slide: 16 / 9, landscape: 16 / 9, square: 1, portrait: 1080 / 1350, story: 1080 / 1920 };
  const PX = { slide: [1920, 1080], landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1350], story: [1080, 1920] };
  const MARGIN = { square: 50 / 1080, portrait: 50 / 1080, landscape: 60 / 1920, story: 100 / 1080, slide: 0.03 };   // share of the width
  const STOCK = /\b(shutterstock|istock(photo)?|getty ?images|adobe ?stock|depositphotos|dreamstime|123rf|alamy|freepik|vecteezy|stock photo)\b/i;
  const FOOTER = /private\s*(&|and)\s*confidential|©|all rights reserved/i;
  const ACCENT_GREEN = ["#34AB8B", "#1DC797", "#049769"], ACCENT_PURPLE = ["#6E5CE1", "#6E5CFA", "#8460D4"];
  const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");
  const pagesLabel = (list, word) => list.length ? (list.length > 1 ? word + "s " : word + " ") + list.slice(0, 12).join(", ") + (list.length > 12 ? "…" : "") : "";
  const toHex = (r, g, b) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
  const rgb = BRAND.hexRgb;
  const LIN = Array.from({ length: 256 }, (_, v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  const lum = (hex) => { const c = rgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const lightness = (hex) => { const [r, g, b] = rgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 2.55; };
  const weightOf = (font, bold) => { const f = String(font || "").toLowerCase(); if (/extrabold|ultrabold|black|heavy/.test(f)) return "extrabold"; if (/semibold|demibold/.test(f)) return "semibold"; if (/bold/.test(f) || bold) return "bold"; if (/medium/.test(f)) return "medium"; if (/light|thin/.test(f)) return "light"; return "regular"; };
  const isBold = (w) => w === "bold" || w === "semibold" || w === "extrabold";
  const cleanFont = (n) => String(n || "").replace(/^[A-Z]{6}\+/, "").replace(/[-,]?(MT|PS|PSMT)$/, "").trim();
  const isPoppins = (n) => /poppins/i.test(n);
  const hasWords = (s) => /[A-Za-z0-9]/.test(s);

  // ---------- libraries (loaded on first use) ----------
  const loaded = {};
  function loadScript(src, global) {
    if (window[global]) return Promise.resolve(window[global]);
    return loaded[src] || (loaded[src] = new Promise((res, rej) => {
      const sc = document.createElement("script"); sc.src = src;
      sc.onload = () => window[global] ? res(window[global]) : (delete loaded[src], rej(new Error(global)));
      sc.onerror = () => { delete loaded[src]; rej(new Error(global)); }; document.head.append(sc);
    }));
  }
  async function pdfjs() {
    const L = await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", "pdfjsLib");
    L.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    return L;
  }
  const jszip = () => loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js", "JSZip");

  // ---------- pixels ----------
  function pixelsOf(source, w, h, long) {
    const sc = Math.min(1, long / Math.max(w, h)); const W = Math.max(3, Math.round(w * sc)), H = Math.max(3, Math.round(h * sc));
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d", { willReadFrequently: true }); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H); ctx.drawImage(source, 0, 0, W, H);
    return { data: ctx.getImageData(0, 0, W, H).data, W, H };
  }
  /** Flat design colours (fills and panels, not photo texture or anti-aliased edges) by share of the page. */
  function flatColours(px, where, skip) {
    const { data: d, W, H } = px; const step = Math.max(1, Math.round(Math.max(W, H) / 400)); const row = W * 4 * step; const buckets = new Map(); let total = 0;
    const inSkip = (x, y) => skip && skip.some((r) => x >= r.x * W && x <= (r.x + r.w) * W && y >= r.y * H && y <= (r.y + r.h) * H);
    for (let y = step; y < H - step; y += step) for (let x = step; x < W - step; x += step) {
      const i = (y * W + x) * 4; total++;
      if (inSkip(x, y)) continue;
      let flat = true;
      for (const j of [i - 4 * step, i + 4 * step, i - row, i + row]) if (Math.abs(d[j] - d[i]) > 10 || Math.abs(d[j + 1] - d[i + 1]) > 10 || Math.abs(d[j + 2] - d[i + 2]) > 10) { flat = false; break; }
      if (!flat) continue;
      const k = (d[i] >> 3) << 10 | (d[i + 1] >> 3) << 5 | (d[i + 2] >> 3);
      const b = buckets.get(k) || { n: 0, r: 0, g: 0, b: 0 }; b.n++; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2]; buckets.set(k, b);
    }
    const merged = [];
    [...buckets.values()].sort((a, b) => b.n - a.n).forEach((b) => { const hx = toHex(b.r / b.n, b.g / b.n, b.b / b.n); const m = merged.find((x) => BRAND.dist(x.hex, hx) <= 5); if (m) m.n += b.n; else merged.push({ hex: hx, n: b.n }); });
    return merged.filter((c) => c.n / total >= 0.004).slice(0, 16).map((c) => ({ hex: c.hex, pct: Math.round(c.n / total * 1000) / 10, where }));
  }
  /** Pixels of a region (fractions of the page): the background colour, and how much differs from it. */
  function region(px, x0, y0, x1, y1) {
    const { data: d, W, H } = px; const X0 = Math.max(0, Math.floor(x0 * W)), X1 = Math.min(W, Math.ceil(x1 * W)), Y0 = Math.max(0, Math.floor(y0 * H)), Y1 = Math.min(H, Math.ceil(y1 * H));
    const counts = new Map(); const list = [];
    for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) { const i = (y * W + x) * 4; list.push(i); const k = (d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | (d[i + 2] >> 4); counts.set(k, (counts.get(k) || 0) + 1); }
    if (!list.length) return null;
    let bk = 0, bn = 0; counts.forEach((n, k) => { if (n > bn) { bn = n; bk = k; } });
    let r = 0, g = 0, b = 0, n = 0;
    list.forEach((i) => { const k = (d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | (d[i + 2] >> 4); if (k === bk) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } });
    const bg = toHex(r / n, g / n, b / n); const [br, bgg, bb] = rgb(bg);
    let diff = 0; list.forEach((i) => { if (Math.max(Math.abs(d[i] - br), Math.abs(d[i + 1] - bgg), Math.abs(d[i + 2] - bb)) > 48) diff++; });
    return {
      bg, bgShare: bn / list.length, content: diff / list.length,
      share: (hexes, tol) => { const labs = hexes; let hit = 0; const step = Math.max(1, Math.floor(list.length / 4000)); let seen = 0;
        for (let q = 0; q < list.length; q += step) { const i = list[q]; seen++; const hx = toHex(d[i], d[i + 1], d[i + 2]); if (labs.some((c) => BRAND.dist(c, hx) <= tol)) hit++; }
        return hit / Math.max(1, seen); },
      inkColour: () => {                                   // the text colour: the pixels furthest from the background (97th percentile)
        const bl = lum(bg); const hist = new Uint32Array(256); const bins = new Uint8Array(list.length);
        list.forEach((i, q) => { const b = Math.min(255, Math.floor(Math.abs(LIN[d[i]] * 0.2126 + LIN[d[i + 1]] * 0.7152 + LIN[d[i + 2]] * 0.0722 - bl) * 255)); bins[q] = b; hist[b]++; });
        let need = Math.ceil(list.length * 0.03), cut = 255; while (cut > 0 && need > hist[cut]) { need -= hist[cut]; cut--; }
        const q = bins.findIndex((b) => b >= cut); const i = list[q < 0 ? 0 : q]; return toHex(d[i], d[i + 1], d[i + 2]);
      },
    };
  }
  /** The short template bar under www.recykal.com: a thin horizontal run of contrasting pixels, bottom-left. */
  function findBar(px, m) {
    const { data: d, W, H } = px; const rg = region(px, 0, 0.75, 0.5, 1); if (!rg) return false; const [br, bgg, bb] = rgb(rg.bg);
    const X0 = Math.floor(m * 0.5 * W), X1 = Math.floor(0.5 * W), Y0 = Math.floor(0.75 * H), Y1 = H - 1;
    const rows = [];
    for (let y = Y0; y < Y1; y++) {
      let best = 0, run = 0, start = 0, bs = 0;
      for (let x = X0; x < X1; x++) { const i = (y * W + x) * 4; const on = Math.abs(d[i] - br) + Math.abs(d[i + 1] - bgg) + Math.abs(d[i + 2] - bb) > 150; if (on) { if (!run) start = x; run++; if (run > best) { best = run; bs = start; } } else run = 0; }
      rows.push(best >= 0.035 * W && best <= 0.3 * W ? [bs, best] : null);
    }
    const maxH = Math.max(2, Math.round(0.014 * H));
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i] || (i > 0 && rows[i - 1])) continue;
      let j = i; while (j + 1 < rows.length && rows[j + 1] && Math.abs(rows[j + 1][0] - rows[i][0]) < 0.01 * W) j++;
      if (j - i + 1 <= maxH && !(rows[j + 1])) return true;
    }
    return false;
  }

  // ---------- reading the file into one page model ----------
  // page: { n, texts:[{str, x, y, w, h, size (share of page height), font, weight, colour, caps, underline, outline, shadow, title, footer}],
  //         images:[{x, y, w, h, pxW, pxH, distort, rot}], fills:[{hex, area, text}], gradients:[{stops}], bg, px, colours, raster }
  async function readImage(file) {
    const bmp = await createImageBitmap(file);
    const px = pixelsOf(bmp, bmp.width, bmp.height, 1200);
    const page = { n: 1, texts: [], images: [], fills: [], gradients: [], px, colours: flatColours(px, "page 1"), raster: 1 };
    const out = { kind: "image", w: bmp.width, h: bmp.height, pages: [page], textKnown: false, styleKnown: false, notes: [] };
    bmp.close && bmp.close(); return out;
  }

  async function readPdf(file, onStage) {
    let L; try { L = await pdfjs(); } catch (e) { throw new Error("Couldn't load the PDF reader. Check your internet connection and try again, or upload a PNG export."); }
    const doc = await L.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
    const O = L.OPS; const N = Math.min(doc.numPages, 40);
    const out = { kind: "pdf", w: 0, h: 0, pages: [], textKnown: true, styleKnown: true, notes: [], total: doc.numPages };
    if (doc.numPages > N) out.notes.push(`Only the first ${N} of ${doc.numPages} pages were checked.`);
    for (let p = 1; p <= N; p++) {
      onStage && onStage(`Reading page ${p} of ${N}`);
      const page = await doc.getPage(p); const vp = page.getViewport({ scale: 1 }); const W = vp.width, H = vp.height;
      if (p === 1) { out.w = W; out.h = H; }
      const pg = { n: p, texts: [], images: [], fills: [], gradients: [], outlineText: 0, raster: 0 };
      // Drawing operations: colours with their area, gradients, pictures with their placement, outlined text.
      const ops = await page.getOperatorList();
      const view = page.view; const pw = view[2] - view[0], ph = view[3] - view[1];
      let ctm = [1, 0, 0, 1, 0, 0]; const stack = []; let fill = "#000000"; let box = null; const fillArea = {}, textColour = {}; let linkText = 0;
      const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
      const pt = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
      const hexOf = (a) => typeof a[0] === "string" ? a[0].toUpperCase() : toHex(a[0], a[1], a[2]);
      const stopsOf = (ir) => Array.isArray(ir) && (ir[0] === "RadialAxial" || ir[0] === "Mesh") ? (Array.isArray(ir[3]) ? ir[3].map((s) => String(s[1]).toUpperCase()).filter((s) => /^#[0-9A-F]{6}$/.test(s)) : []) : null;
      for (let k = 0; k < ops.fnArray.length; k++) {
        const fn = ops.fnArray[k], a = ops.argsArray[k];
        if (fn === O.save) stack.push(ctm);
        else if (fn === O.restore) ctm = stack.pop() || ctm;
        else if (fn === O.transform) ctm = mul(ctm, a);
        else if (fn === O.paintFormXObjectBegin) { stack.push(ctm); if (a && a[0]) ctm = mul(ctm, a[0]); }
        else if (fn === O.paintFormXObjectEnd) ctm = stack.pop() || ctm;
        else if (fn === O.setFillRGBColor) fill = hexOf(a);
        else if ((fn === O.setFillColorN || fn === O.setStrokeColorN) && a) { const s = stopsOf(a); if (s) pg.gradients.push({ stops: s }); }
        else if (fn === O.shadingFill && a) { const s = stopsOf(a[0]); if (s) pg.gradients.push({ stops: s }); }
        else if (fn === O.constructPath) box = a && a[2] ? a[2] : null;
        else if ((fn === O.fill || fn === O.eoFill || fn === O.fillStroke || fn === O.eoFillStroke || fn === O.closeFillStroke || fn === O.closeEOFillStroke) && box) {
          const c = [pt(ctm, box[0], box[1]), pt(ctm, box[2], box[1]), pt(ctm, box[2], box[3]), pt(ctm, box[0], box[3])];
          const xs = c.map((q) => q[0]), ys = c.map((q) => q[1]);
          const area = Math.max(0, Math.min(1, ((Math.min(Math.max(...xs), view[2]) - Math.max(Math.min(...xs), view[0])) * (Math.min(Math.max(...ys), view[3]) - Math.max(Math.min(...ys), view[1]))) / (pw * ph)));
          fillArea[fill] = (fillArea[fill] || 0) + area; box = null;
        }
        else if (fn === O.setTextRenderingMode && a && [1, 2, 5, 6].includes(a[0])) pg.outlineText++;
        else if ((fn === O.showText || fn === O.showSpacedText) && a && a[0] && a[0].filter) {
          const str = a[0].filter((g) => g && g.unicode).map((g) => g.unicode).join("");
          if (/www\.|@|https?:/i.test(str)) linkText++;                 // hyperlinks keep the app's link colour; not a design colour
          else { const n = str.replace(/\s/g, "").length; textColour[fill] = (textColour[fill] || 0) + n; }
        }
        else if (fn === O.beginGroup) { stack.push(ctm); if (a && a[0] && a[0].matrix) ctm = mul(ctm, a[0].matrix); }
        else if (fn === O.endGroup) ctm = stack.pop() || ctm;
        else if (fn === O.paintImageXObject || fn === O.paintInlineImageXObject) {
          const iw = fn === O.paintImageXObject ? a[1] : a[0] && a[0].width, ih = fn === O.paintImageXObject ? a[2] : a[0] && a[0].height;
          const dw = Math.hypot(ctm[0], ctm[1]), dh = Math.hypot(ctm[2], ctm[3]); if (!iw || !ih || !dw || !dh) continue;
          const o = pt(ctm, 0, 0), q = pt(ctm, 1, 1);
          pg.images.push({ x: (Math.min(o[0], q[0]) - view[0]) / pw, y: 1 - (Math.max(o[1], q[1]) - view[1]) / ph, w: dw / pw, h: dh / ph, pxW: iw, pxH: ih,
            distort: Math.abs((iw / ih) / (dw / dh) - 1), rot: Math.abs(ctm[1]) > 0.01 * dw || Math.abs(ctm[2]) > 0.01 * dh });
        }
      }
      Object.keys(fillArea).forEach((hx) => { if (fillArea[hx] >= 0.002) pg.fills.push({ hex: hx, area: fillArea[hx] }); });
      Object.keys(textColour).forEach((hx) => { if (textColour[hx] >= 8) pg.fills.push({ hex: hx, area: 0, text: textColour[hx] }); });
      // Only pictures that show on the page (decks keep the uncropped original far off the slide).
      pg.images = pg.images.filter((im) => im.x < 1 && im.x + im.w > 0 && im.y < 1 && im.y + im.h > 0).map((im) => Object.assign(im, { vis: Math.max(0, Math.min(1, im.x + im.w) - Math.max(0, im.x)) * Math.max(0, Math.min(1, im.y + im.h) - Math.max(0, im.y)) }));
      pg.raster = Math.min(1, pg.images.reduce((s, im) => s + im.vis, 0));
      // Text layer: every run with its font, size and position.
      const tc = await page.getTextContent();
      tc.items.forEach((it) => {
        if (!it.str || !it.str.trim()) return;
        const t = it.transform; const size = Math.hypot(t[2], t[3]) || it.height || 0; const hgt = it.height || size;
        const r = vp.convertToViewportRectangle([t[4], t[5] - size * 0.22, t[4] + (it.width || 0), t[5] + hgt * 0.95]);
        const x = Math.min(r[0], r[2]) / W, y = Math.min(r[1], r[3]) / H, w = Math.abs(r[2] - r[0]) / W, h = Math.abs(r[3] - r[1]) / H;
        let font = ""; try { if (page.commonObjs.has(it.fontName)) font = cleanFont(page.commonObjs.get(it.fontName).name); } catch (e) {}
        if (!font && tc.styles[it.fontName]) font = cleanFont(tc.styles[it.fontName].fontFamily);
        pg.texts.push({ str: it.str, eol: !!it.hasEOL, x, y, w, h, size: size / ph, font, weight: weightOf(font), footer: FOOTER.test(it.str) || (y > 0.9 && /^\s*\d{1,3}\s*$/.test(it.str)) });
      });
      // Render the page for the pixel checks: text contrast at full size, then colours and corners on a smaller copy.
      {
        const sc = Math.min(3, 1400 / Math.max(W, H)); const v2 = page.getViewport({ scale: sc });
        const cv = document.createElement("canvas"); cv.width = Math.round(v2.width); cv.height = Math.round(v2.height);
        const ctx = cv.getContext("2d", { willReadFrequently: true }); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, cv.width, cv.height);
        await page.render({ canvasContext: ctx, viewport: v2 }).promise;
        const full = { data: ctx.getImageData(0, 0, cv.width, cv.height).data, W: cv.width, H: cv.height };
        pg.texts.forEach((t) => {
          if (t.footer || t.h < 0.012 || t.str.replace(/\W/g, "").length < 3) return;
          const rg = region(full, t.x, t.y, t.x + t.w, t.y + t.h); if (!rg || rg.bgShare < 0.35 || rg.content < 0.03) return;
          t.fg = rg.inkColour(); t.bg = rg.bg;
        });
        const sm = document.createElement("canvas"); const k = 800 / Math.max(cv.width, cv.height); sm.width = Math.round(cv.width * k); sm.height = Math.round(cv.height * k);
        const sctx = sm.getContext("2d", { willReadFrequently: true }); sctx.drawImage(cv, 0, 0, sm.width, sm.height);
        pg.px = { data: sctx.getImageData(0, 0, sm.width, sm.height).data, W: sm.width, H: sm.height };
        // Colours inside photos aren't design colours; a page that is one flattened picture is measured as a whole.
        const photos = pg.images.filter((im) => im.vis >= 0.01 && im.vis < 0.85);
        pg.colours = flatColours(pg.px, "page " + p, photos);
        cv.width = cv.height = 0;
      }
      out.pages.push(pg);
      page.cleanup && page.cleanup();
    }
    return out;
  }

  // PowerPoint: the slide XML, with theme colours and fonts, layouts and masters resolved.
  async function readPptx(file, onStage) {
    let Z; try { Z = await jszip(); } catch (e) { throw new Error("Couldn't load the PowerPoint reader. Check your internet connection and try again, or export the deck as PDF."); }
    let zip; try { zip = await Z.loadAsync(await file.arrayBuffer()); } catch (e) { throw new Error("This doesn't look like a PowerPoint (.pptx) file. Save it as .pptx or export it as PDF."); }
    const parser = new DOMParser(); const cache = {};
    const xml = async (path) => { if (path in cache) return cache[path]; const f = zip.file(path); cache[path] = f ? parser.parseFromString(await f.async("string"), "application/xml") : null; return cache[path]; };
    const kids = (el, name) => el ? [...el.children].filter((c) => c.localName === name) : [];
    const kid = (el, name) => kids(el, name)[0] || null;
    const path = (el, ...names) => names.reduce((e, n) => kid(e, n), el);
    const desc = (el, name) => el ? [...el.getElementsByTagNameNS("*", name)] : [];
    const resolve = (base, target) => { const parts = base.split("/").slice(0, -1); target.split("/").forEach((s) => { if (s === "..") parts.pop(); else if (s !== ".") parts.push(s); }); return parts.join("/"); };
    const rels = async (p) => { const d = await xml(p.replace(/([^/]+)$/, "_rels/$1.rels")); const m = {}; desc(d, "Relationship").forEach((r) => { m[r.getAttribute("Id")] = { target: r.getAttribute("TargetMode") === "External" ? null : resolve(p, r.getAttribute("Target")), type: r.getAttribute("Type") || "" }; }); return m; };
    const rid = (el, name) => el && (el.getAttribute("r:" + name) || el.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", name));

    const pres = await xml("ppt/presentation.xml"); if (!pres) throw new Error("This PowerPoint file has no slides.");
    const sz = desc(pres, "sldSz")[0]; const CX = Number(sz.getAttribute("cx")), CY = Number(sz.getAttribute("cy"));
    const presRels = await rels("ppt/presentation.xml");
    const slidePaths = desc(pres, "sldId").map((s) => presRels[rid(s, "id")]).filter((x) => x && x.target).map((x) => x.target);
    const out = { kind: "pptx", w: CX, h: CY, pages: [], textKnown: true, styleKnown: true, notes: [], total: slidePaths.length };
    const bitmaps = {};
    const imageSize = async (p) => {
      if (p in bitmaps) return bitmaps[p];
      bitmaps[p] = null; const f = zip.file(p);
      if (f && /\.(png|jpe?g|gif|webp|bmp)$/i.test(p)) { try { const b = await createImageBitmap(await f.async("blob")); bitmaps[p] = [b.width, b.height]; b.close && b.close(); } catch (e) {} }
      return bitmaps[p];
    };

    // Theme colours and fonts, per master.
    const masters = {};
    async function master(p) {
      if (masters[p]) return masters[p];
      const d = await xml(p); const r = await rels(p);
      const themeP = Object.values(r).find((x) => /\/theme$/.test(x.type)); const th = themeP ? await xml(themeP.target) : null;
      const scheme = {}; const cs = desc(th, "clrScheme")[0];
      if (cs) [...cs.children].forEach((c) => { const v = c.firstElementChild; if (v) scheme[c.localName] = (v.localName === "sysClr" ? v.getAttribute("lastClr") || (v.getAttribute("val") === "window" ? "FFFFFF" : "000000") : v.getAttribute("val") || "000000").toUpperCase(); });
      const map = {}; const cm = desc(d, "clrMap")[0]; if (cm) [...cm.attributes].forEach((a) => { map[a.name] = a.value; });
      const major = (desc(desc(th, "majorFont")[0], "latin")[0] || { getAttribute: () => "" }).getAttribute("typeface") || "";
      const minor = (desc(desc(th, "minorFont")[0], "latin")[0] || { getAttribute: () => "" }).getAttribute("typeface") || "";
      const tx = path(d && d.documentElement, "txStyles");
      const style = (n) => defaults(path(kid(tx, n), "lvl1pPr", "defRPr"));
      return (masters[p] = { d, p, scheme, map, major, minor, styles: { title: style("titleStyle"), body: style("bodyStyle"), other: style("otherStyle") } });
    }
    const PRESET = { black: "000000", white: "FFFFFF", red: "FF0000", green: "008000", blue: "0000FF", yellow: "FFFF00", gray: "808080", grey: "808080" };
    function colour(fillEl, M) {                                       // a solidFill (or gs) element → {hex, alpha}
      if (!fillEl) return null;
      const c = fillEl.firstElementChild ? [...fillEl.children].find((x) => /^(srgbClr|schemeClr|sysClr|prstClr|scrgbClr)$/.test(x.localName)) : null; if (!c) return null;
      let hex;
      if (c.localName === "srgbClr") hex = c.getAttribute("val");
      else if (c.localName === "sysClr") hex = c.getAttribute("lastClr") || (c.getAttribute("val") === "window" ? "FFFFFF" : "000000");
      else if (c.localName === "prstClr") hex = PRESET[c.getAttribute("val")] || "000000";
      else if (c.localName === "scrgbClr") hex = toHex(...["r", "g", "b"].map((k) => 255 * Math.pow(Number(c.getAttribute(k)) / 100000, 1 / 2.2))).slice(1);
      else { let v = c.getAttribute("val"); if (v === "phClr") v = "tx1"; v = (M.map[v] || v); v = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" }[v] || v; hex = M.scheme[v] || "000000"; }
      let [r, g, b] = rgb("#" + hex); let alpha = 1;
      // lumMod/lumOff in HSL, tint and shade towards white or black: what PowerPoint shows for theme colour variations.
      let hsl = null; const toHsl = () => { const R = r / 255, G = g / 255, B = b / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === R ? (G - B) / d + (G < B ? 6 : 0) : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; h /= 6; } return [h, s, l]; };
      const fromHsl = ([h, s, l]) => { if (!s) { r = g = b = l * 255; return; } const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p2 = 2 * l - q; const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p2 + (q - p2) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p2 + (q - p2) * (2 / 3 - t) * 6 : p2; }; r = f(h + 1 / 3) * 255; g = f(h) * 255; b = f(h - 1 / 3) * 255; };
      [...c.children].forEach((m) => {
        const v = Number(m.getAttribute("val")) / 100000;
        if (m.localName === "lumMod") { hsl = toHsl(); hsl[2] *= v; fromHsl(hsl); }
        else if (m.localName === "lumOff") { hsl = toHsl(); hsl[2] = Math.min(1, hsl[2] + v); fromHsl(hsl); }
        else if (m.localName === "tint") { r = 255 - (255 - r) * v; g = 255 - (255 - g) * v; b = 255 - (255 - b) * v; }
        else if (m.localName === "shade") { r *= v; g *= v; b *= v; }
        else if (m.localName === "alpha") alpha = v;
      });
      return { hex: toHex(r, g, b), alpha };
    }
    function defaults(rPr) {                                            // text defaults from a defRPr/rPr element
      if (!rPr) return {};
      const o = {}; const latin = kid(rPr, "latin"); if (latin && latin.getAttribute("typeface")) o.font = latin.getAttribute("typeface");
      if (rPr.getAttribute("sz")) o.sz = Number(rPr.getAttribute("sz")) / 100;
      if (rPr.getAttribute("b") != null) o.b = rPr.getAttribute("b") === "1" || rPr.getAttribute("b") === "true";
      const sf = kid(rPr, "solidFill"); if (sf) o.fill = sf;
      return o;
    }
    const fontName = (f, M) => f === "+mj-lt" || f === "+mj-ea" ? M.major : f === "+mn-lt" || f === "+mn-ea" ? M.minor : f;

    // Placeholders of a layout and its master, for position and style inheritance.
    function placeholders(d) {
      const list = [];
      desc(d, "sp").forEach((sp) => { const ph = desc(path(sp, "nvSpPr", "nvPr"), "ph")[0]; if (!ph) return; list.push({ type: ph.getAttribute("type") || "body", idx: ph.getAttribute("idx"), xfrm: path(sp, "spPr", "xfrm"), lst: defaults(path(sp, "txBody", "lstStyle", "lvl1pPr", "defRPr")) }); });
      return list;
    }
    const findPh = (lists, type, idx) => { for (const l of lists) { const hit = l.find((x) => idx != null && x.idx === idx) || l.find((x) => x.type === type || (type === "ctrTitle" && x.type === "title") || (type === "subTitle" && x.type === "body")); if (hit) return hit; } return null; };
    const rect = (xfrm, T) => { if (!xfrm) return null; const off = kid(xfrm, "off"), ext = kid(xfrm, "ext"); if (!off || !ext) return null; return T(Number(off.getAttribute("x")), Number(off.getAttribute("y")), Number(ext.getAttribute("cx")), Number(ext.getAttribute("cy"))); };
    const ID = (x, y, w, h) => ({ x, y, w, h });

    let paraN = 0;
    async function walk(d, partPath, M, phLists, inherited, pg) {
      const r = await rels(partPath);
      const visit = async (parent, T) => {
        for (const el of [...parent.children]) {
          const ln = el.localName;
          if (ln === "grpSp") {
            const x = path(el, "grpSpPr", "xfrm"); let T2 = T;
            if (x && kid(x, "off") && kid(x, "chOff")) {
              const o = kid(x, "off"), e = kid(x, "ext"), co = kid(x, "chOff"), ce = kid(x, "chExt");
              const ox = +o.getAttribute("x"), oy = +o.getAttribute("y"), sx = (+e.getAttribute("cx")) / Math.max(1, +ce.getAttribute("cx")), sy = (+e.getAttribute("cy")) / Math.max(1, +ce.getAttribute("cy")), cx = +co.getAttribute("x"), cy = +co.getAttribute("y");
              T2 = (a, b, w, h) => T(ox + (a - cx) * sx, oy + (b - cy) * sy, w * sx, h * sy);
            }
            await visit(el, T2); continue;
          }
          if (ln === "sp" || ln === "cxnSp") {
            const ph = desc(path(el, ln === "sp" ? "nvSpPr" : "nvCxnSpPr", "nvPr"), "ph")[0];
            if (ph && inherited) continue;                             // layout/master placeholders are prompts, not content
            const type = ph ? ph.getAttribute("type") || "body" : null; const php = ph ? findPh(phLists, type, ph.getAttribute("idx")) : null;
            const spPr = kid(el, "spPr"); let box = rect(kid(spPr, "xfrm"), T) || (php && rect(php.xfrm, ID)); if (!box) box = { x: 0, y: 0, w: 0, h: 0 };
            const b = { x: box.x / CX, y: box.y / CY, w: box.w / CX, h: box.h / CY };
            let shapeFill = null;
            const sf = kid(spPr, "solidFill"), gf = kid(spPr, "gradFill"), nf = kid(spPr, "noFill"), bf = kid(spPr, "blipFill");
            const styleFill = path(el, "style", "fillRef");
            if (sf) shapeFill = colour(sf, M);
            else if (gf) pg.gradients.push({ stops: desc(gf, "gs").map((gs) => (colour(gs, M) || {}).hex).filter(Boolean), where: b });
            else if (!nf && !bf && styleFill && Number(styleFill.getAttribute("idx")) > 0 && ln === "sp") shapeFill = colour(styleFill, M);
            if (shapeFill && shapeFill.alpha >= 0.5) pg.fills.push({ hex: shapeFill.hex, area: Math.min(1, b.w * b.h), box: b });
            const lnFill = path(spPr, "ln", "solidFill"); if (lnFill) { const c = colour(lnFill, M); if (c && c.alpha >= 0.5) pg.fills.push({ hex: c.hex, area: 0.001, line: 1 }); }
            if (bf) pg.images.push(Object.assign({ embed: rid(desc(bf, "blip")[0], "embed"), rels: r, xfrm: kid(spPr, "xfrm") }, b));
            const tb = kid(el, "txBody"); if (!tb) continue; paraN++;
            const isTitle = type === "title" || type === "ctrTitle";
            const ms = isTitle ? M.styles.title : ph ? M.styles.body : M.styles.other;
            const lst = defaults(path(tb, "lstStyle", "lvl1pPr", "defRPr"));
            const fontRef = path(el, "style", "fontRef");
            const base = Object.assign({}, ms, php ? php.lst : {}, lst);
            const baseFill = base.fill ? colour(base.fill, M) : fontRef ? colour(fontRef, M) : { hex: "#" + (M.scheme[M.map.tx1 || "dk1"] || "000000"), alpha: 1 };
            kids(tb, "p").forEach((p, pi) => {
              const pDef = defaults(path(p, "pPr", "defRPr"));
              [...p.children].filter((x) => x.localName === "r" || x.localName === "fld").forEach((run) => {
                const t = (kid(run, "t") || {}).textContent || ""; if (!t.trim()) return;
                const rPr = kid(run, "rPr"); const own = defaults(rPr); const st = Object.assign({}, base, pDef, own);
                const font = fontName(st.font || (isTitle ? "+mj-lt" : "+mn-lt"), M);
                const fill = own.fill ? colour(own.fill, M) : pDef.fill ? colour(pDef.fill, M) : baseFill;
                if (fill && fill.alpha >= 0.5) pg.fills.push({ hex: fill.hex, area: 0, text: t.replace(/\s/g, "").length });
                pg.texts.push({ str: t, para: partPath + ":" + paraN + ":" + pi, x: b.x, y: b.y, w: b.w, h: b.h, size: (st.sz || (isTitle ? 44 : 18)) / (CY / 12700), pt: st.sz || (isTitle ? 44 : 18), font, weight: weightOf(font, st.b), colour: fill && fill.hex,
                  caps: rPr && rPr.getAttribute("cap") === "all", underline: !!(rPr && rPr.getAttribute("u") && rPr.getAttribute("u") !== "none" && !kid(rPr, "hlinkClick")),
                  outline: !!(rPr && kid(rPr, "ln") && !kid(kid(rPr, "ln"), "noFill")), shadow: !!(rPr && desc(kid(rPr, "effectLst"), "outerShdw").length),
                  title: isTitle, inherited, footer: type === "ftr" || type === "sldNum" || type === "dt" || FOOTER.test(t), behind: shapeFill && shapeFill.alpha >= 0.9 ? shapeFill.hex : null });
              });
            });
            continue;
          }
          if (ln === "pic") {
            const spPr = kid(el, "spPr"); const box = rect(kid(spPr, "xfrm"), T); if (!box) continue;
            const blip = desc(kid(el, "blipFill"), "blip")[0]; const src = desc(kid(el, "blipFill"), "srcRect")[0];
            const x = kid(spPr, "xfrm");
            pg.images.push({ x: box.x / CX, y: box.y / CY, w: box.w / CX, h: box.h / CY, embed: rid(blip, "embed"), rels: r, crop: src ? ["l", "t", "r", "b"].map((k) => Number(src.getAttribute(k) || 0) / 100000) : [0, 0, 0, 0],
              rot: !!(x && Number(x.getAttribute("rot") || 0) % 21600000), flip: !!(x && (x.getAttribute("flipH") === "1" || x.getAttribute("flipV") === "1")), inherited });
            continue;
          }
          if (ln === "graphicFrame") {
            const box = rect(kid(el, "xfrm"), T) || { x: 0, y: 0, w: 0, h: 0 };
            const tbl = desc(el, "tbl")[0];
            if (tbl) desc(tbl, "tc").forEach((tc) => desc(tc, "r").forEach((run) => {
              const t = (kid(run, "t") || {}).textContent || ""; if (!t.trim()) return; const own = defaults(kid(run, "rPr")); const font = fontName(own.font || M.styles.other.font || "+mn-lt", M);
              const c = own.fill ? colour(own.fill, M) : null;
              pg.texts.push({ str: t, x: box.x / CX, y: box.y / CY, w: box.w / CX, h: box.h / CY, size: (own.sz || 14) / (CY / 12700), pt: own.sz || 14, font, weight: weightOf(font, own.b), colour: c && c.hex, inherited, table: 1 });
            }));
            else if (desc(el, "chart").length) pg.charts = (pg.charts || 0) + 1;
          }
        }
      };
      const tree = desc(d, "spTree")[0]; if (tree) await visit(tree, ID);
    }
    function background(d, M) {
      const bg = desc(d, "bg")[0]; if (!bg) return undefined;
      const pr = kid(bg, "bgPr"), ref = kid(bg, "bgRef");
      if (pr) { const sf = kid(pr, "solidFill"); if (sf) return { hex: colour(sf, M).hex }; if (kid(pr, "gradFill")) return { gradient: desc(kid(pr, "gradFill"), "gs").map((gs) => colour(gs, M).hex) }; if (kid(pr, "blipFill")) return { picture: 1 }; }
      if (ref) { const c = colour(ref, M); if (c) return { hex: c.hex }; }
      return undefined;
    }

    for (let i = 0; i < slidePaths.length && i < 80; i++) {
      onStage && onStage(`Reading slide ${i + 1} of ${slidePaths.length}`);
      const sp = slidePaths[i]; const d = await xml(sp); if (!d) continue;
      if (d.documentElement.getAttribute("show") === "0") { out.notes.push(`Slide ${i + 1} is hidden and wasn't checked.`); continue; }
      const sr = await rels(sp); const layoutP = Object.values(sr).find((x) => /\/slideLayout$/.test(x.type));
      const ld = layoutP ? await xml(layoutP.target) : null; const lr = layoutP ? await rels(layoutP.target) : {};
      const masterP = Object.values(lr).find((x) => /\/slideMaster$/.test(x.type)); const M = await master(masterP ? masterP.target : "");
      const pg = { n: out.pages.length + 1, slide: i + 1, texts: [], images: [], fills: [], gradients: [], raster: 0 };
      const phLists = [placeholders(ld), placeholders(M.d)];
      await walk(d, sp, M, phLists, false, pg);
      if (ld && d.documentElement.getAttribute("showMasterSp") !== "0") { await walk(ld, layoutP.target, M, [], true, pg); if (ld.documentElement.getAttribute("showMasterSp") !== "0" && M.d) await walk(M.d, M.p, M, [], true, pg); }
      const bg = background(d, M) || background(ld, M) || background(M.d, M) || { hex: "#FFFFFF" };
      pg.bg = bg.hex ? bg.hex.toUpperCase() : null; pg.bgPicture = !!bg.picture;
      if (bg.gradient) pg.gradients.push({ stops: bg.gradient, where: { x: 0, y: 0, w: 1, h: 1 } });
      if (pg.bg) pg.fills.push({ hex: pg.bg, area: 1, bg: 1 });
      for (const im of pg.images) {
        const target = im.rels && im.rels[im.embed] && im.rels[im.embed].target; im.file = target || ""; delete im.rels;
        const s = target ? await imageSize(target) : null;
        if (s) { const c = im.crop || [0, 0, 0, 0]; const cw = s[0] * (1 - c[0] - c[2]), ch = s[1] * (1 - c[1] - c[3]); im.pxW = cw; im.pxH = ch; if (im.w > 0 && im.h > 0) im.distort = Math.abs((cw / ch) / ((im.w * CX) / (im.h * CY)) - 1); }
      }
      pg.raster = Math.min(1, pg.images.reduce((s, im) => s + Math.min(1, im.w * im.h), 0) + (pg.bgPicture ? 1 : 0));
      out.pages.push(pg);
    }
    if (slidePaths.length > 80) out.notes.push(`Only the first 80 of ${slidePaths.length} slides were checked.`);
    return out;
  }

  async function read(file, onStage) {
    const name = file.name || "";
    const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    if (/\.pptx$/i.test(name) || /presentationml/.test(file.type) || (head[0] === 0x50 && head[1] === 0x4B && !/\.pdf$/i.test(name))) return readPptx(file, onStage);
    if (file.type === "application/pdf" || /\.pdf$/i.test(name) || (head[0] === 0x25 && head[1] === 0x50)) return readPdf(file, onStage);
    if (/^image\//.test(file.type) || /\.(png|jpe?g|webp)$/i.test(name)) return readImage(file);
    if (/\.(ppt|key)$/i.test(name)) throw new Error("Save the deck as .pptx (PowerPoint 2007 or later) or export it as PDF, then upload that.");
    throw new Error("Upload a PowerPoint (.pptx), a PDF, or a PNG, JPG or WEBP image.");
  }

  // ---------- the rules ----------
  /** Check a file. → { qc, score, decision, needsHuman, report } — decision "pending" means no measured rule stops it and the brand team confirms the rest. */
  async function run(file, opts) {
    opts = opts || {};
    const format = RATIO[opts.format] || opts.format === "other" ? opts.format : "other";
    const audience = opts.audience === "Internal" ? "Internal" : "External";
    const onStage = opts.onStage;
    onStage && onStage("Opening your file");
    const doc = await read(file, onStage);
    onStage && onStage("Checking every rule");
    const m = {}; const set = (id, status, evidence, where, fix) => { if (m[id] && m[id].status === "fail" && status !== "fail") return; if (m[id] && m[id].status === "fail") { m[id].evidence += " " + evidence; return; } m[id] = { status, evidence: evidence || "", where: where || "", fix: fix || "" }; };
    const pages = doc.pages; const n = pages.length;
    const isSlides = format === "slide";
    const pageText = (pg) => pg.texts.map((t, i) => { const nx = pg.texts[i + 1]; return t.str + (!nx ? "" : t.para ? (nx.para === t.para ? "" : "\n") : t.eol ? "\n" : " "); }).join("");
    const allText = pages.map(pageText).join("\n\n");
    const extra = [opts.title || "", file.name || "", opts.copy || ""].join(" ");
    const ctxFor = (w) => { const k = Number(String(w).replace(/\D/g, "")); const pg = pages.find((p) => p.n === k); return (pg ? pageText(pg) : allText) + " " + extra; };
    const label = (pg) => (doc.kind === "pptx" ? "slide " : "page ") + (pg.slide || pg.n);
    const facts = { kind: doc.kind, pages: doc.total || n, notes: doc.notes.slice() };
    const W = doc.w, H = doc.h; const ratio = W && H ? W / H : null;
    facts.ratio = ratio ? Number(ratio.toFixed(3)) : null;
    if (doc.kind === "image") facts.size = `${W} × ${H} px`;

    // Y1 · size and ratio (and, for exported images, enough pixels)
    const want = RATIO[format];
    if (want && ratio) {
      const ok = Math.abs(ratio - want) / want < 0.02;
      set("Y1", ok ? "pass" : "fail", `Page ratio ${ratio.toFixed(3)}${doc.kind === "image" ? ` (${W} × ${H} px)` : ""}; ${FORMAT_NAME(format)} needs ${want.toFixed(3)} (${PX[format].join(" × ")}).`, "", ok ? "" : `Set the page size to ${PX[format].join(" × ")} and export again.`);
      if (ok && doc.kind === "image" && W < PX[format][0] * 0.9) set("Y1", "fail", `The export is only ${W} × ${H} px; it needs ${PX[format].join(" × ")} so it stays sharp.`, "", `Export at ${PX[format].join(" × ")} px or larger.`);
    }
    // Pages of a deck with different sizes
    if (doc.kind === "pdf") { /* pdf.js gives each page's size; the first page decides Y1 */ }

    // C1, C2 · colours: exact design colours from the file, plus flat pixel areas covering 3% or more of a page
    const list = [];
    pages.forEach((pg) => {
      const w = label(pg);
      pg.fills.forEach((f) => { if (f.area >= 0.002 || f.text || f.line || f.bg) list.push({ hex: f.hex, where: w, count: f.text ? f.text / 100 : f.area * 100 || 0.1 }); });
      (pg.colours || []).filter((c) => c.pct >= BRAND.PIXEL_MIN_PCT).forEach((c) => list.push({ hex: c.hex, where: w, count: c.pct }));
    });
    const cf = BRAND.colourFindings(list, ctxFor);
    m.C1 = cf.measured.C1; m.C2 = cf.measured.C2;
    const sources = doc.kind === "pptx" ? "text, shapes, lines and backgrounds in the slide file" : doc.kind === "pdf" ? "text and shape colours in the PDF, plus flat areas covering 3% or more of a page" : "flat areas covering 3% or more of the image";
    m.C1.evidence += ` Checked: ${sources}.` + (doc.kind === "pptx" && pages.some((p) => p.images.length) ? " Colours inside pictures aren't measured." : "");
    const smallOff = []; pages.forEach((pg) => smallOff.push(...BRAND.smallOffPalette(pg.colours || [], () => ctxFor(label(pg)))));
    if (smallOff.length) m.C1.evidence += ` Smaller off-palette areas (under 3%, may be a photo): ${smallOff.slice(0, 6).map((o) => `${o.hex} (${o.count}%)`).join(", ")}.`;
    facts.offPalette = cf.rows.filter((r) => r.kind !== "near").slice(0, 10); facts.nearPalette = cf.rows.filter((r) => r.kind === "near").slice(0, 6); facts.smallPalette = smallOff.slice(0, 8);

    // C3 · gradients
    if (doc.kind !== "image") {
      const bad = [];
      pages.forEach((pg) => pg.gradients.forEach((g) => {
        const rethink = /rethink\s?\+?/i.test(ctxFor(label(pg))) && g.stops.length && g.stops.every((s) => BRAND.gradients.some((ok) => BRAND.dist(s, ok.from) <= 15 || BRAND.dist(s, ok.to) <= 15));
        const plain = g.stops.length && g.stops.every((s) => BRAND.dist(s, g.stops[0]) <= 6);   // a "gradient" of one colour is a solid fill
        if (!rethink && !plain) bad.push([label(pg), g.stops]);
      }));
      if (bad.length) set("C3", "fail", `${plural(bad.length, "gradient")} found: ${bad.slice(0, 4).map(([w, s]) => `${w} (${s.slice(0, 3).join(" → ") || "colours not readable"})`).join(", ")}.`, [...new Set(bad.map((b) => b[0]))].slice(0, 6).join(", "), "Use solid palette colours. The only approved gradient is Rethink+ purple #6E5CFA to coral #DF6347, on Rethink+ material.");
      else if (pages.some((pg) => pg.raster > 0.4)) m.C3 = { status: "unsure", evidence: "No gradient in the design itself, but large pictures cover part of it; a gradient inside a picture can't be measured.", where: "", fix: "" };
      else set("C3", "pass", "No gradients in the file.");
    }

    // C4 · contrast: text colour against what's behind it
    const lowC = [];
    pages.forEach((pg) => {
      pg.texts.forEach((t) => {
        if (t.footer || t.str.replace(/\W/g, "").length < 3 || lowC.length > 40) return;
        let fg = null, bg = null;
        if (doc.kind === "pdf") { fg = t.fg; bg = t.bg; } else if (doc.kind === "pptx" && t.colour) {
          if (t.behind) bg = t.behind;
          else { const under = pg.fills.filter((f) => f.box && !f.bg && t.x >= f.box.x - 0.005 && t.y >= f.box.y - 0.005 && t.x + t.w <= f.box.x + f.box.w + 0.005 && t.y + t.h <= f.box.y + f.box.h + 0.005).pop(); bg = under ? under.hex : pg.bgPicture || pg.images.some((im) => !im.inherited && im.x <= t.x && im.y <= t.y && im.x + im.w >= t.x + t.w && im.y + im.h >= t.y + t.h) ? null : pg.bg; }
          fg = t.colour;
        }
        if (!fg || !bg) return;
        const got = contrast(fg, bg);
        if (got < 3 * (doc.kind === "pdf" ? 0.92 : 1)) lowC.push({ w: label(pg), got, need: 3, str: t.str.trim().slice(0, 40), fg, bg });
      });
    });
    const contrastKnown = doc.kind === "pptx" || (doc.kind === "pdf" && pages.some((p) => p.px));
    if (lowC.length) { lowC.sort((a, b) => a.got / a.need - b.got / b.need);
      set("C4", "fail", `Hard to read: ${lowC.slice(0, 4).map((x) => `“${x.str}” ${x.fg} on ${x.bg}, ${x.got.toFixed(1)}:1`).join("; ")}. Text needs at least 3:1 against its background (4.5:1 for body text is the target).`, [...new Set(lowC.map((x) => x.w))].slice(0, 6).join(", "), "Use black or white text on coloured backgrounds, or a darker palette colour, to reach 4.5:1 (3:1 for large headlines).");
      facts.contrast = lowC.slice(0, 6).map((x) => ({ where: x.w, ratio: Number(x.got.toFixed(1)), need: x.need, text: x.str })); }
    else if (contrastKnown && pages.some((p) => p.texts.length)) set("C4", "pass", "All text measured has at least 3:1 contrast with its background.");

    // T1 · Poppins only;  T2 · hierarchy;  T3 · faux styling
    if (doc.styleKnown) {
      const fonts = {};
      let artwork = 0;
      const inArtwork = (pg, t) => pg.images.some((im) => im.w <= 0.25 && im.h <= 0.3 && t.x >= im.x - 0.01 && t.y >= im.y - 0.01 && t.x + t.w <= im.x + im.w + 0.01 && t.y + t.h <= im.y + im.h + 0.01);
      pages.forEach((pg) => pg.texts.forEach((t) => { if (!hasWords(t.str) || !t.font) return; if (!isPoppins(t.font) && inArtwork(pg, t)) { artwork += t.str.length; return; } const f = fonts[t.font] = fonts[t.font] || { count: 0, where: new Set() }; f.count += t.str.replace(/\s/g, "").length; f.where.add(label(pg)); }));
      if (artwork) facts.notes.push(`${plural(artwork, "character")} of non-Poppins text sit inside small pictures (badges or partner logos) and weren't counted.`);
      const names = Object.keys(fonts); const total = names.reduce((s, f) => s + fonts[f].count, 0);
      facts.fonts = names.map((f) => ({ name: f, count: fonts[f].count, ok: isPoppins(f) })).sort((a, b) => b.count - a.count).slice(0, 8);
      const bad = names.filter((f) => !isPoppins(f));
      if (!names.length) { if (pages.some((p) => p.raster > 0.6)) m.T1 = { status: "unsure", evidence: "No live text: the pages are pictures, so the fonts can't be read.", where: "", fix: "" }; }
      else if (bad.length && bad.reduce((s2, f) => s2 + fonts[f].count, 0) <= Math.min(40, total * 0.01))
        m.T1 = { status: "unsure", evidence: `Only ${bad.map((f) => `${f} (${plural(fonts[f].count, "character")}: “${pages.flatMap((pg) => pg.texts.filter((t) => t.font === f).map((t) => t.str.trim())).slice(0, 4).join(" ")}”)`).join(", ")} isn't Poppins, out of ${total} characters. That's usually text inside an award badge or partner logo; check it by eye.`, where: pagesLabel([...new Set(bad.flatMap((f) => [...fonts[f].where]))].map((w) => w.replace(/\D/g, "")).sort((a, b) => a - b), doc.kind === "pptx" ? "slide" : "page"), fix: "" };
      else if (bad.length) set("T1", "fail", `Not Poppins: ${bad.map((f) => `${f} (${plural(fonts[f].count, "character")})`).join(", ")}, out of ${total} characters.`, pagesLabel([...new Set(bad.flatMap((f) => [...fonts[f].where]))].map((w) => w.replace(/\D/g, "")).sort((a, b) => a - b), doc.kind === "pptx" ? "slide" : "page"), "Select all text and set the font to Poppins (Light to ExtraBold).");
      else set("T1", "pass", `All ${total} characters are set in Poppins.`);
      if (names.length && pages.some((p) => p.raster > 0.6)) m.T1.evidence += " Text inside pictures can't be read.";

      const hierBad = [];
      pages.forEach((pg) => {
        const ts = pg.texts.filter((t) => !t.footer && hasWords(t.str) && t.size > 0); if (ts.length < 2) return;
        const top = Math.max(...ts.map((t) => t.size)); const head = ts.filter((t) => t.size >= top * 0.92);
        if (!head.some((t) => isBold(t.weight))) hierBad.push(`${label(pg)}: the headline isn't Bold or SemiBold`);
      });
      if (hierBad.length) set("T2", "fail", hierBad.slice(0, 4).join("; ") + (hierBad.length > 4 ? ` and ${hierBad.length - 4} more.` : "."), "", "Headlines in Poppins Bold or SemiBold (titles pair a light word with a bold word); body text in Regular or Medium.");
      else if (pages.some((p) => p.texts.filter((t) => !t.footer).length >= 2)) set("T2", "pass", "The largest text on every page carries a Bold or SemiBold weight.");

      const faux = [];
      pages.forEach((pg) => pg.texts.forEach((t) => {
        if (t.footer) return;
        if (t.underline) faux.push(`underlined “${t.str.trim().slice(0, 30)}” (${label(pg)})`);
        if (t.outline) faux.push(`outlined “${t.str.trim().slice(0, 30)}” (${label(pg)})`);
        if (t.shadow) faux.push(`shadowed “${t.str.trim().slice(0, 30)}” (${label(pg)})`);
        if (t.caps && t.str.trim().split(/\s+/).length >= 4) faux.push(`all-caps “${t.str.trim().slice(0, 30)}” (${label(pg)})`);
      }));
      pages.forEach((pg) => { if (pg.outlineText) faux.push(`outlined text (${label(pg)})`); });
      allCaps(allText).forEach((s) => faux.push(`all-caps “${s}”`));
      if (faux.length) set("T3", "fail", `Found ${[...new Set(faux)].slice(0, 5).join(", ")}.`, "", "Use Poppins Bold for emphasis instead of capitals, underlines, outlines or shadows.");
      else if (pages.some((p) => p.texts.length)) set("T3", "pass", "No all-caps paragraphs, underlines, outlines or shadows on text.");
    }

    // Slides: master deck structure (Y2), footer (Y3), accents (Y4)
    const markOf = (pg) => {
      if (pg.images.some((im) => im.x >= 0.75 && im.y <= 0.2 && im.w <= 0.2 && im.w > 0.01)) return true;
      if (pg.px) { const rg = region(pg.px, 0.86, 0.02, 0.985, 0.16); return !!rg && rg.content >= 0.015; }
      return doc.kind === "pptx" ? pg.fills.some((f) => f.box && !f.bg && f.box.x >= 0.8 && f.box.y <= 0.15 && f.box.w <= 0.15) : false;
    };
    const inner = n >= 3 ? pages.slice(1, -1) : n === 2 ? pages.slice(1) : pages;
    if (isSlides) {
      const probs = []; let unsure = false;
      if (n >= 2) {
        const c = pages[0]; let black = null;
        if (doc.kind === "pptx") black = c.bgPicture ? null : c.bg ? lightness(c.bg) < 15 : null;
        else if (c.px) { const rg = region(c.px, 0, 0, 1, 1); black = rg ? lightness(rg.bg) < 15 : null; }
        if (black === false) probs.push(`the cover (${label(c)}) isn't on black`); if (black === null) unsure = true;
      }
      if (n >= 3 && doc.textKnown) {
        const last = pages[n - 1]; const t = pageText(last);
        if (!/thank\s*you/i.test(t)) probs.push(`the last slide isn't the “Thank You!” closing slide`);
        else { const miss = [["www.recykal.com", /www\.recykal\.com/i], ["marketing@recykal.com", /marketing@recykal\.com/i], ["+91 7799996255", /7799996255|77999\s?96255/]].filter(([, re]) => !re.test(t.replace(/\s+(?=\d)/g, ""))).map(([s]) => s); if (miss.length) probs.push(`the closing slide is missing ${miss.join(", ")}`); }
      }
      const noTitle = [], noMark = [];
      const dark = (pg) => doc.kind === "pptx" ? !!pg.bg && lightness(pg.bg) < 15 : pg.px ? (() => { const rg = region(pg.px, 0, 0, 1, 1); return !!rg && lightness(rg.bg) < 15; })() : false;
      inner.forEach((pg) => {
        if (n >= 3 && dark(pg)) return;                    // a black section divider: the title sits mid-left and there's no mark, by design
        if (doc.textKnown) { const ts = pg.texts.filter((t) => !t.footer && hasWords(t.str)); if (ts.length) { const top = ts.reduce((a, b) => (b.size > a.size ? b : a)); if (!(top.y < 0.3 && top.x < 0.5)) noTitle.push(pg.slide || pg.n); } }
        if (!markOf(pg)) noMark.push(pg.slide || pg.n);
      });
      if (noTitle.length) probs.push(`the title isn't top-left on ${pagesLabel(noTitle, "slide")}`);
      if (noMark.length) probs.push(`no Recykal mark top-right on ${pagesLabel(noMark, "slide")}`);
      facts.markMissing = noMark;
      if (probs.length) set("Y2", "fail", probs.join("; ").replace(/^./, (c) => c.toUpperCase()) + ".", "", "Rebuild on the master deck: cover on black with the full logo, title top-left and the Recykal mark top-right on inner slides, and the “Thank You!” closing slide with the contact details.");
      else if (!unsure && (doc.textKnown || n === 1)) set("Y2", n === 1 && !doc.textKnown ? "unsure" : "pass", n === 1 ? "The Recykal mark is top-right" + (doc.textKnown ? " and the title is top-left." : "; the title position can't be read from an image.") : "Cover on black, titles top-left, Recykal mark top-right and a “Thank You!” closing slide.");

      if (doc.textKnown) {
        const missing = (n >= 3 ? pages.slice(0, -1) : pages).filter((pg) => { const t = pageText(pg); return !(/Private\s*(&|and)\s*Confidential/i.test(t) && /©\s*\d{4}/.test(t)); }).map((pg) => pg.slide || pg.n);
        facts.footerMissing = missing;
        if (missing.length) set("Y3", "fail", `No “Private & Confidential” / “© ${BRAND.year}, All rights reserved” footer on ${pagesLabel(missing, "slide")}.`, pagesLabel(missing, "slide"), "Rebuild these slides on the master deck layouts, or add the footer exactly as in the master deck.");
        else set("Y3", "pass", "Every slide carries the footer.");
      }

      const noAccent = []; let accentUnsure = false;
      inner.forEach((pg) => {
        let tl, br;
        if (pg.px) { const a = region(pg.px, 0, 0, 0.14, 0.2), b = region(pg.px, 0.86, 0.8, 1, 1); tl = a && a.share(ACCENT_GREEN, 18) >= 0.008; br = b && b.share(ACCENT_PURPLE, 18) >= 0.008; }   // the 2026 template's accents are slim
        else {
          const at = (x0, y0, x1, y1, cols) => pg.fills.some((f) => f.box && !f.bg && f.box.x < x1 && f.box.x + f.box.w > x0 && f.box.y < y1 && f.box.y + f.box.h > y0 && cols.some((c) => BRAND.dist(c, f.hex) <= 18)) ? true : pg.images.some((im) => im.x < x1 && im.x + im.w > x0 && im.y < y1 && im.y + im.h > y0 && im.w < 0.5) ? null : false;
          tl = at(0, 0, 0.14, 0.2, ACCENT_GREEN); br = at(0.86, 0.8, 1, 1, ACCENT_PURPLE);
        }
        if (tl === false || br === false) noAccent.push(pg.slide || pg.n); else if (tl == null || br == null) accentUnsure = true;
      });
      if (noAccent.length) set("Y4", "fail", `The green diagonal top-left or the purple diagonal bottom-right is missing on ${pagesLabel(noAccent, "slide")}.`, pagesLabel(noAccent, "slide"), "Use the master deck layouts, which carry both accents.");
      else if (!accentUnsure && inner.length) set("Y4", "pass", "The master deck accents are in place.");
    }

    // Y5 · digital template placement (posts, stories, banners)
    if (["square", "portrait", "story", "landscape"].includes(format) && pages[0] && pages[0].px) {
      const pg = pages[0]; const mg = MARGIN[format]; const logo = region(pg.px, mg * 0.6, mg * 0.6 * (W / H), 0.45, 0.2);
      const txt = doc.textKnown ? pageText(pg) + " " + (opts.copy || "") : opts.copy || "";
      const url = /www\.recykal\.com/i.test(txt); const bar = findBar(pg.px, mg);
      const probs = [];
      if (!logo || logo.content < 0.02) probs.push("nothing sits in the top-left logo position");
      if ((doc.textKnown || opts.copy) && !url) probs.push("www.recykal.com isn't on it");
      if (probs.length) set("Y5", "fail", probs.join("; ").replace(/^./, (c) => c.toUpperCase()) + ".", "", "Start from the digital template: logo with tagline top-left inside the margin, www.recykal.com bottom-left with the short black bar beneath it.");
      else if (url && bar) set("Y5", "pass", "Something sits in the logo position top-left, and www.recykal.com with its bar sits bottom-left.");
      else m.Y5 = { status: "unsure", evidence: `${bar ? "The bar is bottom-left" : "No short bar found bottom-left"}${url ? " and www.recykal.com is in the text" : "; www.recykal.com couldn't be read from the image"}. Check the logo and website placement by eye.`, where: "", fix: "" };
    }

    // Y6 · margins and safe zones (text positions)
    if (doc.textKnown && doc.kind === "pdf") {
      const mg = MARGIN[format] || 0.03; const mgY = mg * (W / H); const out = [];
      pages.forEach((pg) => pg.texts.forEach((t) => {
        if (t.footer || !hasWords(t.str) || (isSlides && (t.y > 0.9 || /www\.|@|\+91/.test(t.str)))) return;
        if (t.x < mg * 0.8 || t.x + t.w > 1 - mg * 0.8 || t.y < mgY * 0.8 || (t.y + t.h > 1 - mgY * 0.8 && !isSlides)) out.push(`“${t.str.trim().slice(0, 24)}” (${label(pg)})`);
        else if (format === "story" && (t.y < 250 / 1920 || t.y + t.h > 1 - 250 / 1920)) out.push(`“${t.str.trim().slice(0, 24)}” in the story's top or bottom 250 px (${label(pg)})`);
      }));
      if (out.length) set("Y6", "fail", `Text outside the margins: ${[...new Set(out)].slice(0, 4).join(", ")}.`, "", `Keep text at least ${Math.round(mg * PX[format === "other" ? "slide" : format][0])} px from the edges${format === "story" ? ", and out of the top and bottom 250 px" : ""}.`);
      else if (pages.some((p) => p.texts.length)) set("Y6", "pass", "All text sits inside the margins.");
    } else if (doc.kind === "pptx") {
      const out = []; pages.forEach((pg) => pg.texts.forEach((t) => { if (!t.inherited && hasWords(t.str) && (t.x < -0.002 || t.y < -0.002 || t.x + t.w > 1.002 || t.y + t.h > 1.002)) out.push(`“${t.str.trim().slice(0, 24)}” (${label(pg)})`); }));
      if (out.length) set("Y6", "fail", `Text boxes run off the slide: ${[...new Set(out)].slice(0, 4).join(", ")}.`, "", "Move these text boxes inside the slide margins.");
    }

    // I1 · sharp, undistorted pictures;  L3 · the logo mark not distorted
    if (doc.kind !== "image") {
      const target = PX[format === "other" ? "slide" : format][0]; const low = [], stretched = [], logoBad = [];
      const allImgs = pages.flatMap((pg) => pg.images.filter((im) => im.pxW >= 16 && im.pxH >= 16 && (im.vis == null || im.vis > 0.0004)).map((im) => [pg, im]));
      allImgs.forEach(([pg, im]) => {
        const shown = im.w * target; const corner = im.w <= 0.2 && im.y <= 0.2 && (im.x >= 0.75 || im.x <= 0.1);
        const photo = (im.vis != null ? im.vis : im.w * im.h) >= 0.02 && im.pxW >= 200 && im.pxH >= 200;
        if (im.distort > 0.06 && photo) stretched.push(`${label(pg)} (${Math.round(im.distort * 100)}% out of proportion)`);
        else if (corner && im.distort > 0.06 && im.w >= 0.02) logoBad.push(`${label(pg)} (${Math.round(im.distort * 100)}% out of proportion)`);
        else if (corner && (im.rot || im.flip)) logoBad.push(`${label(pg)} (rotated or flipped)`);
        if (photo && im.w <= 1.5 && shown >= 150 && im.pxW < shown * 0.7) low.push(`${label(pg)} (${Math.round(im.pxW)} px wide, shown at about ${Math.round(shown)} px)`);
      });
      facts.images = { count: allImgs.length, low: low.length, stretched: stretched.length };
      // A PDF doesn't say which pictures are photos (stretched flat frames and shapes look fine), so there the brand team confirms.
      if ((low.length || stretched.length) && doc.kind === "pdf") m.I1 = { status: "unsure", evidence: "Check these pictures by eye; they may be photos shown " + [stretched.length ? `out of proportion: ${stretched.slice(0, 4).join(", ")}` : "", low.length ? `at low resolution: ${low.slice(0, 4).join(", ")}` : ""].filter(String).join(", or ") + ". Flat shapes and frames stretched this way look fine.", where: "", fix: "" };
      else if (low.length || stretched.length) set("I1", "fail", [stretched.length ? `Stretched or squashed: ${stretched.slice(0, 4).join(", ")}.` : "", low.length ? `Low resolution: ${low.slice(0, 4).join(", ")}.` : ""].filter(String).join(" "), "", "Reset the picture's proportions (hold Shift while resizing) and replace low-resolution pictures with larger originals.");
      else if (allImgs.length) set("I1", "pass", `${plural(allImgs.length, "picture")} checked: none stretched or low resolution.`);
      else if (pages.every((p) => !p.images.length)) set("I1", "na", "No pictures in the file.");
      if (logoBad.length) set("L3", "fail", `The small corner image (usually the Recykal mark) is distorted: ${logoBad.slice(0, 4).join(", ")}.`, "", "Delete it and place the supplied logo file again without stretching, rotating or flipping it.");
    }

    // I5 · stock watermarks in the text layer
    const stock = (allText + " " + (opts.copy || "")).match(STOCK);
    if (stock) set("I5", "fail", `“${stock[0]}” appears in the file: a stock-photo watermark or credit.`, "", "Replace it with a licensed or Recykal-owned image.");

    // W1–W10 · copy: the file's text plus anything pasted
    const text = [allText, opts.copy || ""].join("\n");
    const copyHits = BRAND.copyMeasured(text, format, audience, m);
    if (text.trim()) {
      const claims = text.split(/\n+|(?<=[.!?])\s+/).filter((s) => /\b(world[- ]class|revolutionary|game[- ]chang(ing|er)|cutting[- ]edge|best[- ]in[- ]class|the best|number one|unmatched|unparalleled)\b/i.test(s) && !/\d|award|source|ranked|according/i.test(s));
      if (claims.length) set("W8", "fail", `Claims without a number, award or source: ${[...new Set(claims.map((c) => c.trim()))].slice(0, 3).map((s) => `“${s.trim().slice(0, 70)}”`).join(", ")}.`, "", "Back each claim with a figure from the fact sheet, an award or a source, or remove it.");
      else set("W8", "pass", "No unsupported superlatives.");
    }
    facts.copy = copyHits.slice(0, 15);
    if (!doc.textKnown && !opts.copy) facts.notes.push("Images have no readable text: paste the key copy to check names, figures and spelling, or upload a PDF export.");

    // Everything else: the brand team checks it by eye.
    const results = {}, checks = [];
    BRAND.rules.forEach((r) => {
      let res;
      if (r.f.indexOf(format) < 0) res = { status: "na", evidence: "Not used for this format.", where: "", fix: "", by: "rule" };
      else if (m[r.id] && m[r.id].status !== "unsure") res = Object.assign({ by: "measured" }, m[r.id]);
      else res = { status: "unsure", evidence: m[r.id] ? m[r.id].evidence : HOW[r.id] || r.d, where: "", fix: "", by: "reviewer" };
      results[r.id] = res;
      checks.push({ id: r.id, status: res.status, evidence: String(res.evidence).slice(0, 600), where: String(res.where || "").slice(0, 160), fix: String(res.fix || "").slice(0, 400), by: res.by });
    });
    const ev = BRAND.evaluate(format, results);
    const fails = checks.filter((c) => c.status === "fail").sort((a, b) => SEV[R[a.id].sev] - SEV[R[b.id].sev]);
    const eye = checks.filter((c) => c.by === "reviewer");
    const measured = checks.filter((c) => c.by === "measured");
    const criteria = {}; BRAND.groups.forEach(([g]) => { criteria[g] = { rating: ev.qc[g], feedback: fails.filter((c) => R[c.id].g === g).map((c) => c.evidence).join(" ").slice(0, 600) || "No measured problem." }; });
    const decision = ev.score < 85 ? ev.decision : "pending";
    const summary = fails.length
      ? `${plural(fails.length, "rule")} failed on exact measurements, most importantly “${R[fails[0].id].t}”. ${eye.length ? `The brand team checks ${plural(eye.length, "more rule")} by eye.` : ""}`
      : `All ${measured.length} measured rules pass. ${eye.length ? `The brand team checks the other ${plural(eye.length, "rule")} (logo, imagery and layout details) by eye before it's approved.` : ""}`;
    const report = { v: 3, mode: "auto", format, audience, summary: summary.trim(), checks, criteria,
      fixes: fails.map((c) => (c.where ? c.where + ": " : "") + (c.fix || c.evidence)).slice(0, 8),
      deductions: ev.deductions, needsHuman: ev.needsHuman, eye: eye.map((c) => c.id), facts, checkedAt: new Date().toISOString(), file: String(file.name || "").slice(0, 120) };
    return { qc: ev.qc, score: ev.score, decision, needsHuman: ev.needsHuman, report };
  }
  const SEV = { critical: 0, major: 1, minor: 2 };
  const FORMAT_NAME = (f) => ({ slide: "a presentation", landscape: "a banner", square: "a social post", portrait: "a portrait post", story: "a story" })[f] || "this format";
  function allCaps(text) {
    const out = [];
    String(text || "").split(/[\n.!?]+/).forEach((s) => { const words = s.trim().split(/\s+/).filter((w) => /[A-Za-z]{2,}/.test(w)); if (words.length >= 4 && words.every((w) => w === w.toUpperCase()) && words.filter((w) => !BRAND.ACRONYMS.has(w.replace(/[^A-Z0-9]/g, ""))).length >= 3) out.push(s.trim().slice(0, 40)); });
    return out.slice(0, 3);
  }
  // What the brand team looks for on the rules a computer can't decide.
  const HOW = {
    L1: "Check the logo is the supplied artwork: the Recykal mark with the lowercase “recykal” wordmark, not retyped or redrawn.",
    L2: "Check the logo is black on white or light backgrounds, or white on black; never on a brand colour, a gradient or a photo.",
    L3: "Check the logo isn't stretched, squashed, rotated or tilted.",
    L4: "Check the mark sits left of the wordmark (or above it), with the original spacing and sizes.",
    L5: "Check the space around the logo is clear of text and graphics, and it isn't on a busy photo.",
    L6: "Check covers, closing slides, posts and banners use the full logo with the “Sustainable Circularity” tagline, and inner slides the mark alone.",
    L7: "Check any product logos and app icons are exactly as supplied.",
    I2: "Check the pictures show real Recykal context: people, facilities, devices, products. No clip art.",
    I3: "Check the icons share one outline style and colour.",
    I4: "Check partner and client logos are unaltered, evenly sized and smaller than the Recykal logo.",
    I5: "Check for stock-photo watermarks and anything copied from another brand's campaign.",
    Y7: "Check elements line up on a grid with even spacing and one clear focal point.",
    W9: "Proofread: typos, grammar and numbers that don't agree. (Placeholder text is checked automatically.)",
  };

  return { run, read, flatColours, pixelsOf, contrast, HOW };
})();

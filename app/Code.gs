// ---------- Recykal brand rulebook ----------
// The single source of truth for Brand QC. build.py puts this file at the top of Code.gs (scoring and saving results)
// and inside the page script (the automatic check in check.js, the Brand kit and the demo), so both always use the same rules.
// Sources: "Recykal Marketing Brand Guidelines" (26 pages, cited as p.N) and the Recykal company deck
// (Recykal_Deck-3, 17 slides, cited as Deck N). Change a rule here, run build.py, and both sides pick it up.

const BRAND = (() => {
  const BRAND_ = { get primary() { return primary; }, get products() { return products; }, get gradients() { return gradients; }, get facts() { return facts; }, get contact() { return contact; }, get groups() { return groups; }, get rules() { return rules; } };
  const primary = [
    ["Black", "#000000"], ["Bright Blue", "#005DFF"], ["Midnight Blue", "#024C8A"], ["Medium Purple", "#8460D4"], ["Blue", "#567DE8"],
    ["Bright Green", "#1DC797"], ["Dark Green", "#049769"], ["Duke Blue", "#0000AF"], ["Fern Green", "#3E7D44"],
  ];
  // Product palettes (p.11–21). A product's colours are allowed only on material about that product.
  const products = [
    { name: "Recykal Marketplace", short: "Marketplace", re: /\b(recykal\.?\s?market(place)?|marketplace|recommerce|infra business)\b/i, primary: ["#1DC797", "#567DE8"], secondary: ["#CAFFF0", "#C8D8FF"], ref: "p.11–12" },
    { name: "EPR Platform", short: "EPR", re: /\b(EPR|extended producer responsibility)\b/i, primary: ["#005DFF"], secondary: ["#FB4A59", "#F5EFB9", "#48B16E"], ref: "p.13–14" },
    { name: "dDRS", short: "DRS", re: /\b(d?DRS|deposit refund|retearn|reklaim)\b/i, primary: ["#049769"], secondary: ["#FFC484", "#FEF4EB", "#FC8B61"], ref: "p.15–16" },
    { name: "Restyle", short: "Restyle", re: /\brestyle\b/i, primary: ["#0000AF", "#3E7D44", "#6A7F8A"], secondary: ["#02A0DD", "#03BADF", "#E5FF76", "#BACCD3"], pastel: ["#96E8FB", "#C0F2F9"], ref: "p.17–19" },
    { name: "Rethink+", short: "Rethink+", re: /\brethink\s?\+?/i, primary: ["#6E5CFA", "#DF6347"], secondary: ["#468646", "#FFC20D", "#FFA800"], ref: "p.20–21" },
    // Not in the Marketing Brand Guidelines; kept from the earlier Recykal brand kit at the brand team's request.
    { name: "Rezolv", short: "Rezolv", re: /\brezolv\b/i, primary: ["#024CBA"], secondary: ["#3AABDD", "#14B8A6", "#B6E3C3"], ref: "earlier brand kit" },
    { name: "Smart Center", short: "Smart Center", re: /\bsmart cent(er|re)s?\b/i, primary: ["#2F8D6A"], secondary: ["#48B16E", "#C2E7DD", "#B4D7B9"], ref: "earlier brand kit" },
  ];
  // Accents built into the master deck itself (Deck 1–17): allowed everywhere.
  const templateAccents = ["#FFFFFF", "#6E5CE1", "#6E5CFA", "#34AB8B", "#F6F8FB", "#F3F3F3"];   // master deck and 2026 template accents
  const gradients = [{ from: "#6E5CFA", to: "#DF6347", product: "Rethink+" }];
  const contact = { web: "www.recykal.com", email: "marketing@recykal.com", phone: "+91 7799996255" };
  const year = new Date().getFullYear();

  const groups = [
    ["logo", "Logo"], ["colour", "Colour"], ["type", "Typography"], ["layout", "Template & layout"], ["imagery", "Imagery"], ["copy", "Copy & facts"],
  ];
  const ALL = ["slide", "square", "portrait", "story", "landscape", "other"];
  const DIGITAL = ["square", "portrait", "story", "landscape"];
  // sev: critical (−25, caps the score at 59) · major (−10, caps at 84) · minor (−3). m: measured exactly by code where the file allows it.
  const rules = [
    { id: "L1", g: "logo", sev: "critical", t: "Official logo artwork", d: "Use the supplied logo: the Recykal mark with the lowercase “recykal” wordmark. Never retype the wordmark in another font or redraw the mark.", ref: "p.2–5, p.9" },
    { id: "L2", g: "logo", sev: "critical", t: "Black or white logo only", d: "Black logo on white or light backgrounds, white logo on black. A logo on Bright Blue, Midnight Blue, Blue, Bright Green, Dark Green, Duke Blue, Fern Green or a gradient is a listed misuse.", ref: "p.7–8" },
    { id: "L3", g: "logo", sev: "critical", t: "Logo not distorted", d: "Never stretch, squash, rotate, tilt or skew the logo.", ref: "p.9" },
    { id: "L4", g: "logo", sev: "major", t: "Lockup unchanged", d: "Mark left of the wordmark (primary) or above it (secondary). Never swap sides, re-space or resize the mark against the wordmark, set the name in capitals, or outline it.", ref: "p.2–5, p.9" },
    { id: "L5", g: "logo", sev: "major", t: "Safe space and clean background", d: "Keep the safe space around the logo free of text and graphics. Never place it on a busy photo.", ref: "p.6, p.9" },
    { id: "L6", g: "logo", sev: "minor", t: "Right logo version for the format", d: "Full logo with the “Sustainable Circularity” tagline on covers, closing slides, posts and banners; the mark alone, top-right, on inner slides.", ref: "p.3, Deck 1–17" },
    { id: "L7", g: "logo", sev: "major", t: "Product logos as supplied", d: "Product lockups and app icons (Marketplace Seller/Buyer, EPR Platform, dDRS, Restyle, Rethink+) used exactly as supplied, with the product name in its product colour. Mark n/a if none appear.", ref: "p.11–21" },

    { id: "C1", g: "colour", sev: "critical", m: true, t: "Recykal palette only", d: "Every colour comes from the primary palette, white, neutral greys, or the palette of the product being shown.", ref: "p.10" },
    { id: "C2", g: "colour", sev: "major", m: true, t: "Product colours stay with their product", d: "A product palette is used only on that product's material, e.g. the EPR Platform red #FB4A59 doesn't belong on a Marketplace slide.", ref: "p.12–21; Rezolv and Smart Center from the earlier brand kit" },
    { id: "C3", g: "colour", sev: "major", m: true, t: "No unapproved gradients", d: "Solid colours only. The one approved gradient is Rethink+ purple #6E5CFA to coral #DF6347, on Rethink+ material.", ref: "p.8, p.21" },
    { id: "C4", g: "colour", sev: "minor", m: true, t: "Readable contrast", d: "Text is easy to read against its background (aim for 4.5:1 for body text).", ref: "p.10" },

    { id: "T1", g: "type", sev: "critical", m: true, t: "Poppins only", d: "All text in Poppins (Light, Regular, Medium, SemiBold, Bold or ExtraBold). No Arial, Calibri, Times, Montserrat or any other font.", ref: "p.22" },
    { id: "T2", g: "type", sev: "minor", m: true, t: "Clear type hierarchy", d: "Headlines in Bold or SemiBold, body in Regular or Medium; slide titles pair a light word with a bold word, as in “Our Solutions”.", ref: "p.22, Deck 3–16" },
    { id: "T3", g: "type", sev: "minor", m: true, t: "No faux styling", d: "No all-caps paragraphs, underlines for emphasis, outlined, shadowed or stretched type.", ref: "p.22" },

    { id: "Y1", g: "layout", sev: "critical", m: true, t: "Right size and ratio", d: "Presentation 16:9 (1920×1080) · post 1080×1080 · portrait 1080×1350 · story 1080×1920 · banner 1920×1080.", ref: "p.23–26" },
    { id: "Y2", g: "layout", sev: "major", m: true, f: ["slide"], t: "Master deck structure", d: "Cover on black with the full logo and tagline; inner slides with the title top-left and the Recykal mark top-right; a closing “Thank You!” slide with www.recykal.com, marketing@recykal.com and +91 7799996255.", ref: "Deck 1, 2–16, 17" },
    { id: "Y3", g: "layout", sev: "major", m: true, f: ["slide"], t: "Footer on every slide", d: `“Private & Confidential” bottom-left and “© ${year}, All rights reserved” bottom-right, with the current year.`, ref: "Deck 1–16" },
    { id: "Y4", g: "layout", sev: "minor", m: true, f: ["slide"], t: "Master deck accents", d: "The green diagonal top-left and purple diagonal bottom-right from the master deck; no extra decorative shapes.", ref: "Deck 2–16" },
    { id: "Y5", g: "layout", sev: "major", m: true, f: DIGITAL, t: "Digital template placement", d: "Logo with tagline top-left inside the margin (50 px posts, 60 px banners, 100 px stories); www.recykal.com bottom-left with the short black bar beneath it.", ref: "p.24–26" },
    { id: "Y6", g: "layout", sev: "minor", m: true, t: "Margins and safe zones", d: "Text inside the margins; nothing important in the top or bottom 250 px of a story.", ref: "p.24–26" },
    { id: "Y7", g: "layout", sev: "minor", t: "Clean alignment", d: "Elements aligned to a grid with consistent spacing and one clear focal point; no clutter or overlapping elements.", ref: "Deck 2–16" },

    { id: "I1", g: "imagery", sev: "major", m: true, t: "Sharp images", d: "No pixelated, stretched or badly cropped photos, screenshots or icons. Mark n/a if there are no images.", ref: "Deck 7–16" },
    { id: "I2", g: "imagery", sev: "minor", t: "Relevant, real context", d: "Real waste-management and circular-economy context: Recykal people, facilities, devices and products. No cheesy clip art.", ref: "Deck 1, 7–16" },
    { id: "I3", g: "imagery", sev: "minor", t: "Consistent icons", d: "Icons in one outline style and colour, as in the master deck.", ref: "Deck 4–16" },
    { id: "I4", g: "imagery", sev: "major", t: "Partner and client logos", d: "Partner, client and award logos unaltered, evenly sized and never larger than the Recykal logo. Mark n/a if none appear.", ref: "Deck 2–3" },
    { id: "I5", g: "imagery", sev: "critical", t: "Rights-safe imagery", d: "No stock-photo watermarks and nothing copied from another brand's campaign.", ref: "" },

    { id: "W1", g: "copy", sev: "major", m: true, t: "Company name", d: "“Recykal” with a capital R in text, never misspelled or in capitals. The lowercase form belongs only to the logo.", ref: "p.2" },
    { id: "W2", g: "copy", sev: "critical", m: true, t: "Funding figure", d: "The only funding figure is “$68M+ raised to date”.", ref: "Deck 3" },
    { id: "W3", g: "copy", sev: "major", m: true, t: "Approved figures", d: "Every company figure matches the approved fact sheet.", ref: "Deck 2–9" },
    { id: "W4", g: "copy", sev: "major", m: true, t: "Product names", d: "Recykal.Market, Marketplace, Recommerce, Infra Business, Deposit Refund System (DRS), DRS Platform, Retearn, reklaim Ace/Pro/Neo/Mini/Go, Sustainability Suite, EPR, AFR, dDRS, Restyle, Rethink+, Rezolv, Smart Center.", ref: "Deck 4–16, p.11–21" },
    { id: "W5", g: "copy", sev: "major", m: true, t: "Respectful language", d: "Say “waste collectors” or “informal waste workers” and “waste”; never rag pickers, garbage or trash.", ref: "Deck 6" },
    { id: "W6", g: "copy", sev: "minor", m: true, t: "Indian/British spelling", d: "behaviour, colour, organisation, recognise.", ref: "Deck 4" },
    { id: "W7", g: "copy", sev: "minor", m: true, t: "Acronyms spelled out", d: "“Extended Producer Responsibility (EPR)”, “Deposit Refund System (DRS)” and “Alternative Fuel & Raw Material (AFR)” on first use for external audiences.", ref: "Deck 7, 14" },
    { id: "W8", g: "copy", sev: "minor", m: true, t: "Claims backed up", d: "No superlatives such as world-class, best or revolutionary without a number, award or source.", ref: "Deck 2" },
    { id: "W9", g: "copy", sev: "major", t: "Proofread", d: "No typos, grammar errors, placeholder text (Lorem ipsum, XX, TBD) or inconsistent numbers.", ref: "" },
    { id: "W10", g: "copy", sev: "minor", m: true, t: "Contact details", d: "www.recykal.com, marketing@recykal.com and +91 7799996255 exactly as in the deck.", ref: "Deck 17" },
  ];
  rules.forEach((r) => { r.f = r.f || ALL; });
  const ruleById = {}; rules.forEach((r) => { ruleById[r.id] = r; });
  const POINTS = { critical: 25, major: 10, minor: 3 };
  const CAP = { critical: 59, major: 84 };

  // Approved facts (Deck slides; a few from recykal.com, marked).
  const facts = [
    ["Mission", "Drive behavioural change for 1 billion people towards responsible waste management", "Deck 2, 4"],
    ["Funding", "$68M+ raised to date, the only figure to use", "Deck 3"],
    ["Material channelised", "Over 3 million MT", "Deck 5"],
    ["Ecosystem", "650+ brands · 675+ recyclers & co-processors · 5000+ service providers & aggregators", "Deck 5"],
    ["Enterprises", "Trusted sustainability partner of 600+ enterprises", "Deck 2"],
    ["Impact", "94,50,000+ MT CO₂ eq mitigated · 7,80,00,000+ m³ water · 1,50,00,000+ MWh electricity · 84,00,000+ MT coal saved", "Deck 5"],
    ["DRS", "India's first digital DRS, Digital India Awards 2022, deployed at Kedarnath, Uttarakhand", "Deck 7"],
    ["DRS Platform", "2x faster returns · 85% lower infra cost · 100% fraud prevention", "Deck 8"],
    ["Retearn", "9 design rights · 4* patent rights · 2 countries · 3 Indian states · ~90% collection rate · 1 Cr+ bottles collected · fastest 1 million collection in the Himalayan region in 53 days", "Deck 9"],
    ["Recykal.Market", "Three pillars, one brand: Marketplace (recyclables), Recommerce (asset liquidation), Infra Business (trading & processing)", "Deck 10"],
    ["Contact", "www.recykal.com · marketing@recykal.com · +91 7799996255", "Deck 17"],
    ["Recykal.Market (website)", "10K+ verified businesses · ₹2,500 Cr+ value generated · 28+ states and UTs", "recykal.market"],
    ["Team (website)", "600+ employees", "recykal.com/about-us"],
  ];
  const num = (s) => Number(String(s).replace(/[,\s]/g, ""));
  // Company-figure claims: "<n>+ <noun>" or "+<n> <noun>" must match the approved number.
  const claim = (noun) => new RegExp(`(?:\\+\\s?(\\d[\\d,]*)|(\\d[\\d,]*)\\s?\\+)\\s*(?:${noun})\\b`, "gi");
  const factChecks = [
    { re: claim("brands"), ok: 650, say: "650+ brands", ref: "Deck 5" },
    { re: claim("recyclers"), ok: 675, say: "675+ recyclers & co-processors", ref: "Deck 5" },
    { re: claim("service providers|aggregators"), ok: 5000, say: "5000+ service providers & aggregators", ref: "Deck 5" },
    { re: claim("enterprises"), ok: 600, say: "600+ enterprises", ref: "Deck 2" },
    { re: /(\d[\d.]*)\s*(?:million|mn|m)\s*\+?\s*(?:MT|metric tonnes|tonnes|tons)\b/gi, ok: 3, say: "over 3 million MT channelised", ref: "Deck 5" },
    { re: /(\d[\d.]*)\s*(?:cr|crore)\s*\+?\s*bottles\b/gi, ok: 1, say: "1 Cr+ bottles collected", ref: "Deck 9" },
    { re: /~?\s?(\d+)\s*%\s*collection rate/gi, ok: 90, say: "~90% collection rate", ref: "Deck 9" },
  ];

  // Copy rules. Each hit points at a rule; "tip" hits are shown but never fail a rule.
  const copyRules = [
    { r: "W1", re: /\b(recycal|recykle|recykel|recykall|rekykal|re-kykal|recykl|recykel)\b/gi, sev: "error", msg: (m) => `Spell the company name “Recykal”, not “${m}”.` },
    { r: "W1", re: /(?<![\w.@/-])recykal(?![\w.@])/g, sev: "warn", msg: () => "Write “Recykal” with a capital R. The lowercase form belongs only to the logo." },
    { r: "W1", re: /\bRECYKAL\b/g, sev: "warn", msg: () => "Don't set the company name in capitals. Write “Recykal”." },
    // Funding claims only: an amount next to raised / funding / investment.
    { r: "W2", re: /(?:raised|funding|funded|investment|invested|series [a-f])[^.\n]{0,40}?(?:USD\s?|US\$|\$|₹|INR\s?)\s?\d[\d.,]*\s?(?:M|Mn|million|Cr|crore|B|bn|billion)\b\+?|(?:USD\s?|US\$|\$|₹|INR\s?)\s?\d[\d.,]*\s?(?:M|Mn|million|Cr|crore|B|bn|billion)\b\+?[^.\n]{0,25}?(?:raised|funding|investment)/gi, sev: "error", test: (m) => !/\$\s?68\s?(M|Mn|million)/i.test(m), msg: (m) => `“${m}” isn't the approved funding figure. Use “$68M+ raised to date”.` },
    { r: "W2", re: /\$\s?68\s?(M|Mn|million)(?!\+)/gi, sev: "warn", msg: () => "Write the funding figure exactly as “$68M+ raised to date”." },
    { r: "W4", re: /\bdeposit[- ]return (system|scheme)s?\b/gi, sev: "error", msg: () => "The product is the “Deposit Refund System (DRS)”." },
    { r: "W4", re: /\bRe-?tearn\b|\bRETEARN\b|\bReTearn\b/g, sev: "warn", test: (m) => m !== "Retearn", msg: () => "The hardware arm is written “Retearn”." },
    { r: "W4", re: /\bReklaim\b|\bRe-klaim\b|\bRECLAIM (Ace|Pro|Neo|Mini|Go)\b|\breclaim (Ace|Pro|Neo|Mini|Go)\b/g, sev: "warn", msg: () => "Device names are lowercase “reklaim”: reklaim Ace, Pro, Neo, Mini, Go." },
    { r: "W4", re: /\bRecykal ?Market(?!place)\b|\brecykal market\b|\bRecykal\. Market\b/gi, sev: "warn", test: (m) => m !== "Recykal.Market", msg: () => "The marketplace brand is written “Recykal.Market”." },
    { r: "W4", re: /\bRe-think\s?\+|\bReThink\s?\+?|\bRETHINK\s?\+|\bRethink \+/g, sev: "warn", msg: () => "The product is written “Rethink+”." },
    { r: "W4", re: /\bRe-?style\b|\bRESTYLE\b/g, sev: "warn", test: (m) => m !== "Restyle" && m !== "restyle", msg: () => "The product is written “Restyle”." },
    { r: "W4", re: /\bDDRS\b|\bD-DRS\b/g, sev: "warn", msg: () => "The product is written “dDRS”." },
    { r: "W4", re: /\b(Rezolve|Resolv|ReZolv|REZOLV)\b/g, sev: "warn", msg: () => "The product is spelled “Rezolv”." },
    { r: "W4", re: /\bE-?P-?R Loop\b/gi, sev: "tip", msg: () => "Product logos call it “EPR Platform”." },
    { r: "W5", re: /\brag[- ]?pickers?\b|\bkabadiwala?s?\b/gi, sev: "error", msg: () => "Say “waste collectors” or “informal waste workers”." },
    { r: "W5", re: /\b(garbage|trash|rubbish|junk)\b/gi, sev: "warn", msg: (m) => `Say “waste” instead of “${m}”.` },
    { r: "W6", re: /\bbehavior(al|s)?\b/gi, sev: "warn", msg: (m) => `Use “${m.replace(/behavior/i, (x) => x[0] + "ehaviour")}”.` },
    { r: "W6", re: /\bcolor(s|ed|ful)?\b/gi, sev: "warn", msg: (m) => `Use “${m.replace(/olor/i, "olour")}”.` },
    { r: "W6", re: /\b(organiz|recogniz|utiliz|prioritiz|optimiz|digitiz|minimiz|maximiz)(e|es|ed|ing|ation|ations)\b/gi, sev: "warn", msg: (m) => `Use the -ise spelling: “${m.replace(/iz/i, "is")}”.` },
    { r: "W6", re: /\b(center|centers|fiber|liter|meter)\b/gi, sev: "tip", msg: (m) => `Indian/British spelling: “${m.replace(/er(s?)$/i, "re$1")}” (ignore if it's a proper name).` },
    { r: "W8", re: /\b(world[- ]class|revolutionary|game[- ]chang(ing|er)|cutting[- ]edge|best[- ]in[- ]class|the best|number one|unmatched|unparalleled)\b/gi, sev: "tip", msg: (m) => `Back “${m}” with a number, award or source.` },
    { r: "W8", re: /\b(eco[- ]friendly|100% green|go green)\b/gi, sev: "tip", msg: (m) => `“${m}” is vague. Say what changes: tonnes recovered, CO₂ avoided, containers returned.` },
    { r: "W9", re: /\b(lorem ipsum|dolor sit amet|TBD|TBC|placeholder|insert (text|image|logo) here)\b|\[[^\]]{0,30}(insert|add|tbd)[^\]]{0,30}\]|\bXX+\b|\b00\/00\b/gi, sev: "error", msg: (m) => `Placeholder text left in: “${m}”.` },
    { r: "W9", re: /!{2,}|\?{2,}/g, sev: "warn", msg: () => "Use one exclamation or question mark at most." },
    { r: "W9", re: /\b(\w+) \1\b/g, sev: "warn", test: (m) => !/^(\d+) \1$/.test(m) && !/^(that that|had had)$/i.test(m), msg: (m) => `Repeated word: “${m}”.` },
    { r: "W10", re: /\b(?:www\.)?recykal\.(?!com\b|market\b)[a-z]{2,}\b/gi, sev: "warn", msg: (m) => `The website is “www.recykal.com”, not “${m}”.` },
    { r: "W10", re: /\bmarketing@recykal\.(?!com\b)[a-z]+\b|\b(?:info|contact|hello)@recykal\.com\b/gi, sev: "warn", msg: () => "Use “marketing@recykal.com” as the contact email." },
    { r: "W10", re: /(?:\+91|\b91)[\s-]?\d[\d\s-]{8,12}\d/g, sev: "warn", test: (m) => m.replace(/\D/g, "").slice(-10) !== "7799996255", msg: (m) => `“${m}” isn't the company number. Use “+91 7799996255”, or check it's meant to be a personal number.` },
    { r: "Y3", re: /\bPrivate (and|&amp;) Confidential\b|\bprivate & confidential\b|\bPRIVATE & CONFIDENTIAL\b/g, sev: "warn", msg: () => "Write the footer exactly as “Private & Confidential”." },
    { r: "Y3", re: /©\s?(\d{4})/g, sev: "error", test: (m) => Number(m.replace(/\D/g, "")) !== year, msg: (m) => `The copyright year is out of date: “${m}”. Use “© ${year}, All rights reserved”.` },
  ];
  const ACRONYMS = new Set(["RECYKAL", "EPR", "DRS", "DDRS", "AFR", "MRF", "MRFS", "ESG", "CPCB", "MOEFCC", "GST", "OEM", "OEMS", "IOT", "CSR", "PET", "HDPE", "RDF", "ELV", "APAC", "FMCG", "B2B", "SKU", "QR", "GS1", "PPT", "CEO", "COO", "CFO", "CSO", "CBO", "CIO", "CPO", "USD", "INR", "MEITY", "NULP", "ABBY", "HSBC", "SAMSUNG", "PEPSICO", "THANK", "YOU", "USPS"]);

  /** Copy check: hits [{r, sev, quote, msg}] for a text, for one format and audience. */
  function checkCopy(text, opts) {
    const out = []; opts = opts || {};
    if (!text || !String(text).trim()) return out;
    text = String(text);
    const applies = (id) => !opts.format || ruleById[id].f.indexOf(opts.format) >= 0;
    copyRules.forEach((cr) => {
      cr.re.lastIndex = 0; const seen = {}; let m;
      while ((m = cr.re.exec(text))) {
        const w = m[0].trim();
        if (m.index === cr.re.lastIndex) cr.re.lastIndex++;
        if (cr.test && !cr.test(w)) continue;
        if (seen[w.toLowerCase()]) continue; seen[w.toLowerCase()] = 1;
        out.push({ r: cr.r, sev: applies(cr.r) ? cr.sev : "tip", quote: w, msg: cr.msg(w) });
      }
    });
    factChecks.forEach((fc) => {
      fc.re.lastIndex = 0; let m; const seen = {};
      while ((m = fc.re.exec(text))) {
        const n = num(m[1] || m[2]); if (!n || n === fc.ok || seen[m[0]]) continue; seen[m[0]] = 1;
        out.push({ r: "W3", sev: "error", quote: m[0].trim(), msg: `Doesn't match the approved figure “${fc.say}” (${fc.ref}).` });
      }
    });
    if (opts.audience !== "Internal") {
      [["EPR", /extended producer responsibility/i], ["AFR", /alternative fuel/i], ["DRS", /deposit refund system/i]].forEach(([a, full]) => {
        if (new RegExp("\\b" + a + "\\b").test(text) && !full.test(text)) out.push({ r: "W7", sev: "warn", quote: a, msg: `Spell out “${{ EPR: "Extended Producer Responsibility (EPR)", AFR: "Alternative Fuel & Raw Material (AFR)", DRS: "Deposit Refund System (DRS)" }[a]}” on first use.` });
      });
    }
    const caps = (text.match(/\b[A-Z]{5,}\b/g) || []).filter((w) => !ACRONYMS.has(w));
    if (caps.length > 2) out.push({ r: "T3", sev: "tip", quote: caps[0], msg: "Avoid all-caps words for emphasis. Use Poppins Bold instead." });
    return out.slice(0, 40);
  }

  // ---------- colour ----------
  const hexRgb = (h) => { h = String(h).replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  // Perceptual distance (CIE76 ΔE in Lab): about 2 is barely visible, 6 is "the same colour" after export, 15+ is a different colour.
  const lab = (hex) => {
    const c = hexRgb(hex).map((v) => { v /= 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; });
    const f = (t) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    const x = f((c[0] * 0.4124 + c[1] * 0.3576 + c[2] * 0.1805) / 0.95047), y = f(c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722), z = f((c[0] * 0.0193 + c[1] * 0.1192 + c[2] * 0.9505) / 1.08883);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  };
  const dist = (a, b) => { const p = lab(a), q = lab(b); return Math.sqrt(Math.pow(p[0] - q[0], 2) + Math.pow(p[1] - q[1], 2) + Math.pow(p[2] - q[2], 2)); };
  const nearest = (hex, list) => { let best = null, bd = 1e9; list.forEach((p) => { const d = dist(hex, p); if (d < bd) { bd = d; best = p; } }); return { hex: best, dist: bd }; };
  // Neutral = a true grey, white or black: Lab chroma at most 10. (A very dark green such as #0F241C is NOT neutral.)
  const isNeutral = (hex) => { const l = lab(hex); return Math.hypot(l[1], l[2]) <= 10; };
  const productColours = (p) => p.primary.concat(p.secondary, p.pastel || []);
  const primaryHex = primary.map((p) => p[1]);
  /** Classify one colour used in a place whose text is `context`. → {kind: ok|near|product|off, nearest, product} */
  function classifyColour(hex, context) {
    hex = String(hex).toUpperCase();
    if (isNeutral(hex)) return { kind: "ok" };
    const here = products.filter((p) => p.re.test(context || ""));
    const allowed = primaryHex.concat(templateAccents, [].concat.apply([], here.map(productColours)));
    const n = nearest(hex, allowed);
    if (n.dist <= 8) return { kind: "ok" };                                  // within ΔE 8: the same colour after export and colour profiles
    for (const p of products) { if (here.indexOf(p) >= 0) continue; const q = nearest(hex, productColours(p)); if (q.dist <= 6) return { kind: "product", product: p.name, nearest: nearest(hex, primaryHex).hex }; }
    if (n.dist <= 15) return { kind: "near", nearest: n.hex };
    const np = nearest(hex, primaryHex);
    return { kind: "off", nearest: np.dist <= 30 ? np.hex : null };         // no honest "closest" for a colour far from all of them
  }

  /** Colour findings from measured colours [{hex, where, count}] → rows for the report and measured C1/C2 results. */
  function colourFindings(list, contextFor) {
    const byHex = {};
    list.forEach((c) => { const hx = String(c.hex).toUpperCase(); const e = byHex[hx] = byHex[hx] || { hex: hx, count: 0, where: [] }; e.count += c.count || 1; if (c.where && e.where.indexOf(c.where) < 0) e.where.push(c.where); });
    const rows = [];
    Object.keys(byHex).forEach((hx) => {
      const e = byHex[hx]; const wh = e.where.length ? e.where : [""];
      const cls = wh.map((w) => classifyColour(hx, contextFor(w)));
      const worst = ["off", "product", "near", "ok"].filter((k) => cls.some((x) => x.kind === k))[0];
      if (worst === "ok") return;
      const c = cls.filter((x) => x.kind === worst)[0];
      rows.push({ hex: hx, kind: worst, nearest: c.nearest || null, product: c.product || "", count: e.count, where: wh.filter((w, i) => cls[i].kind === worst && w).filter((w, i, a) => a.indexOf(w) === i).slice(0, 6).join(", ") });
    });
    rows.sort((a, b) => b.count - a.count);
    const off = rows.filter((r) => r.kind === "off"), prod = rows.filter((r) => r.kind === "product");
    const m = {};
    m.C1 = off.length ? { status: "fail", evidence: "Off-palette colours: " + off.slice(0, 6).map((o) => o.hex + (o.share ? "" : "") + (o.nearest ? ` (closest brand colour ${o.nearest})` : " (no Recykal colour is close)")).join(", ") + ".", where: off.map((o) => o.where).join(", ").split(", ").filter((w, i, a) => w && a.indexOf(w) === i).slice(0, 6).join(", "),
      fix: "Replace " + off.slice(0, 4).map((o) => o.hex + " with " + (o.nearest || "a primary palette colour, such as Bright Green #1DC797 or Bright Blue #005DFF")).join("; ") + "." }
      : { status: "pass", evidence: "Every measured colour is on the Recykal palette or neutral.", where: "", fix: "" };
    m.C2 = prod.length ? { status: "fail", evidence: prod.slice(0, 4).map((p) => `${p.hex} comes from the ${p.product} palette but is used where the subject isn't ${p.product}`).join("; ") + ".", where: prod.map((p) => p.where).filter(String).slice(0, 4).join("; "), fix: "Use primary palette colours there, or keep product colours on that product's material." }
      : { status: "pass", evidence: "Product colours appear only on their own product's material.", where: "", fix: "" };
    return { rows: rows, measured: m };
  }

  /** Run the exact copy rules on a text and record measured results in m (a failure always overrides a pass). Returns the hits. */
  const COPY_RULE_IDS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W9", "W10", "Y3"];
  function copyMeasured(text, format, audience, m) {
    const hits = checkCopy(text, { format: format, audience: audience });
    COPY_RULE_IDS.forEach((id) => {
      if (ruleById[id].f.indexOf(format) < 0) return;
      const fails = hits.filter((x) => x.r === id && x.sev !== "tip");
      if (fails.length) m[id] = { status: "fail", evidence: "Found " + fails.slice(0, 6).map((x) => x.quote ? `“${x.quote}”` : x.msg).join(", ") + ".", where: (m[id] && m[id].where) || "",
        fix: fails.slice(0, 4).map((x) => x.msg).filter((v, i, a) => a.indexOf(v) === i).join(" ") };
      else if (!m[id] && id !== "W9" && id !== "Y3" && String(text || "").trim()) m[id] = { status: "pass", evidence: "No issues in the text.", where: "", fix: "" };
    });
    return hits;
  }
  // Pixel-measured colours count as a measured failure only when they cover at least this share of the page (backgrounds, panels,
  // boxes); smaller areas, such as a photo's sky, are reported but don't fail the rule.
  const PIXEL_MIN_PCT = 3;
  /** Off-palette colours in smaller flat areas (0.5% to 3% of a page): reported, but not failed automatically. */
  function smallOffPalette(colours, contextFor) {
    const small = colours.filter((x) => x.pct >= 0.5 && x.pct < PIXEL_MIN_PCT);
    return colourFindings(small.map((x) => ({ hex: x.hex, where: x.where, count: x.pct })), contextFor).rows.filter((x) => x.kind !== "near");
  }

  /** Score a checklist. results: {ruleId: {status: pass|fail|unsure|na}} → score, decision, six-group ratings. */
  function evaluate(format, results, cfg) {
    cfg = cfg || {}; const approveAt = cfg.approveAt || 85, changesAt = cfg.changesAt || 60;
    let score = 100, cap = 100; const deductions = [], needsHuman = [], qc = {};
    groups.forEach(([g]) => { qc[g] = "pass"; });
    rules.forEach((r) => {
      const res = results[r.id]; const st = r.f.indexOf(format || "other") < 0 ? "na" : res ? res.status : "unsure";
      if (st === "fail") {
        score -= POINTS[r.sev]; deductions.push({ id: r.id, sev: r.sev, pts: POINTS[r.sev] });
        if (CAP[r.sev]) cap = Math.min(cap, CAP[r.sev]);
        qc[r.g] = r.sev === "minor" ? (qc[r.g] === "fail" ? "fail" : "minor") : "fail";
      } else if (st === "unsure" && r.sev !== "minor") needsHuman.push(r.id);
    });
    score = Math.max(0, Math.min(score, cap));
    const decision = score >= approveAt ? "approved" : score >= changesAt ? "changes" : "rejected";
    return { score: score, decision: decision, qc: qc, deductions: deductions, needsHuman: needsHuman };
  }

  return { colourFindings, copyMeasured, PIXEL_MIN_PCT, smallOffPalette, primary, products, templateAccents, gradients, contact, year, groups, rules, ruleById, POINTS, CAP, facts, copyRules, ACRONYMS,
    checkCopy, classifyColour, evaluate, hexRgb, dist, nearest, isNeutral, productColours };
})();

/**
 * Brand Astra — Recykal's brand review portal, as a Google Apps Script web app.
 *
 * Everyone signs in with their @recykal.com Google account (Google handles the login), then picks
 * Employee or Marketing team on the sign-in page. Only people on the marketing team (the owners below,
 * plus anyone the team adds under Team & access) get the marketing views; the server checks every call.
 * Data lives in a Google Sheet owned by the account that deploys this script.
 * Every request is checked here on the server: employees only ever receive and change
 * their own submissions and conversations; requests, reviews, the Showcase and template
 * links can only be changed by the admins below.
 */

// ---------- Settings: edit these ----------
const CONFIG = {
  DOMAIN: "recykal.com",
  // Marketing team owners: always on the marketing team (review queue, every submission, reports, requests,
  // Team & access). More members can be added in the app under Team & access; only owners are listed here.
  ADMINS: [
    "marketing@recykal.com",
    "vinod.mylavarapu@recykal.com",
    "alokesh.sinha@recykal.com",
    "ramakrishna.ivaturi@recykal.com",
    "ayesha.ishrat@recykal.com",
    "chetan.baregar@recykal.com",
    "shreyas.devershetty@recykal.com",
  ],
  APP_NAME: "Brand Astra",
  // Brand Astra check: runs in each person's browser on the file itself. No AI, no API key, no running cost.
  APPROVE_AT: 85,                  // QC score at or above this passes the automatic check and goes to the brand team for the eye check
  CHANGES_AT: 60,                  // at or above this (but below APPROVE_AT) → changes requested; below → not approved
  // Email alerts (sent from the deploying account). Set any to false to turn it off.
  EMAIL_ADMINS_ON_SUBMIT: false,   // new or revised submission → all admins (off: the morning digest lists them)
  EMAIL_EMPLOYEE_ON_REVIEW: true,  // decision made → the employee
  EMAIL_ON_COMMENT: true,          // new message in a conversation → the other side
  DAILY_DIGEST_HOUR: 9,            // admins get a queue summary every morning (0–23, sheet time zone)
  EMAIL_ON_ASSIGN: true,           // a request assigned to specific people or teams → those people
  REMIND_DAYS_BEFORE: [2, 0],      // deadline reminders to assignees who haven't submitted (sent with the morning digest)
  SLA_WORKING_DAYS: 2,
};

// ---------- Web app entry ----------
function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle(CONFIG.APP_NAME)
    .addMetaTag("viewport", "width=device-width, initial-scale=1, viewport-fit=cover");
}

// ---------- Sheet storage ----------
const SHEETS = {
  Requests: ["id", "title", "type", "deadline", "templateUrl", "brief", "closed", "createdBy", "updatedAt", "data"],
  Submissions: ["id", "email", "name", "team", "title", "type", "format", "channel", "audience", "neededBy", "link", "description", "request", "submittedAt", "version", "precheckScore", "data"],
  Reviews: ["submissionId", "email", "title", "status", "qcScore", "logo", "colour", "type", "layout", "imagery", "copy", "comment", "reviewer", "reviewedAt", "data"],
  Comments: ["submissionId", "email", "messages", "lastFrom", "lastAt", "data"],
  Showcase: ["submissionId", "title", "type", "team", "link", "qcScore", "note", "approvedAt", "data"],
  Settings: ["key", "value", "updatedAt", "data"],
  People: ["email", "name", "team", "firstSeen", "lastSeen", "data"],
};

function book_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("SHEET_ID");
  if (id) return SpreadsheetApp.openById(id);
  const ss = SpreadsheetApp.create(CONFIG.APP_NAME + " — Data");
  props.setProperty("SHEET_ID", ss.getId());
  ss.getSheets()[0].setName("Requests");
  initSheet_(ss.getSheetByName("Requests"), "Requests");
  return ss;
}
function initSheet_(sh, name) {
  sh.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]).setFontWeight("bold");
  sh.setFrozenRows(1);
  sh.getRange(1, 1, sh.getMaxRows(), SHEETS[name].length).setNumberFormat("@");
  return sh;
}
function sheet_(name) {
  const ss = book_();
  return ss.getSheetByName(name) || initSheet_(ss.insertSheet(name), name);
}

/** All rows of a sheet as {row, key, obj} using the JSON in the last column. */
function rows_(name) {
  const sh = sheet_(name);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const width = SHEETS[name].length;
  return sh.getRange(2, 1, n, width).getValues().map((r, i) => {
    let obj = null;
    try { obj = JSON.parse(r[width - 1] || "null"); } catch (e) { obj = null; }
    return { row: i + 2, key: String(r[0]), obj };
  }).filter((x) => x.obj);
}
function writeRow_(name, rowIndex, values) {
  const sh = sheet_(name);
  const width = SHEETS[name].length;
  const vals = values.map((v) => (v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v)));
  if (rowIndex) sh.getRange(rowIndex, 1, 1, width).setValues([vals]);
  else { const r = sh.getLastRow() + 1; sh.getRange(r, 1, 1, width).setNumberFormat("@").setValues([vals]); }
}
function deleteRows_(name, rowIndexes) {
  const sh = sheet_(name);
  rowIndexes.sort((a, b) => b - a).forEach((r) => sh.deleteRow(r));
}

// ---------- Identity ----------
function email_() {
  const email = String(Session.getActiveUser().getEmail() || "").toLowerCase();
  if (!email || !email.endsWith("@" + CONFIG.DOMAIN)) {
    throw new Error("Sign in with your @" + CONFIG.DOMAIN + " Google account to use Brand Astra.");
  }
  return email;
}
// The marketing team: the owners in CONFIG.ADMINS plus the members added in the app (Settings → "marketingTeam").
let TEAM_CACHE_ = null;                                   // one sheet read per call
function owners_() { return CONFIG.ADMINS.map((a) => a.toLowerCase().trim()).filter(Boolean); }
function addedAdmins_() {
  const r = rows_("Settings").filter((x) => x.key === "marketingTeam")[0];
  return r && Array.isArray(r.obj.emails) ? r.obj.emails : [];
}
function admins_() {
  if (!TEAM_CACHE_) TEAM_CACHE_ = owners_().concat(addedAdmins_().filter((e) => owners_().indexOf(e) < 0));
  return TEAM_CACHE_;
}
function isAdmin_(email) { return admins_().indexOf(email) >= 0; }
function teamInfo_() { const o = owners_(); return { owners: o, added: admins_().filter((e) => o.indexOf(e) < 0), domain: CONFIG.DOMAIN }; }

/** Add someone to the marketing team, or move them back to employee. Marketing team only. */
function setMarketing(target, on) {
  const email = email_();
  if (!isAdmin_(email)) throw new Error("Only the marketing team can change who's on it.");
  const t = String(target || "").toLowerCase().trim();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+$/.test(t) || !t.endsWith("@" + CONFIG.DOMAIN)) throw new Error("Use a @" + CONFIG.DOMAIN + " email address.");
  if (!on && owners_().indexOf(t) >= 0) throw new Error("This person is an owner, listed in Code.gs (CONFIG.ADMINS). Remove them there.");
  if (!on && t === email) throw new Error("You can't remove yourself. Ask another member of the marketing team.");
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  let added = false;
  try {
    const row = rows_("Settings").filter((r) => r.key === "marketingTeam")[0];
    let list = row && Array.isArray(row.obj.emails) ? row.obj.emails.slice() : [];
    if (on && list.indexOf(t) < 0 && owners_().indexOf(t) < 0) { list.push(t); added = true; }
    if (!on) list = list.filter((e) => e !== t);
    writeRow_("Settings", row && row.row, ["marketingTeam", list.join(", "), new Date().toISOString(), { emails: list, updatedBy: email }]);
    TEAM_CACHE_ = null;
  } finally { lock.releaseLock(); }
  if (added) sendMail_({ to: t, subject: "You're on the marketing team",
    body: `<p>${esc_(nameOf_(email))} added you to the marketing team in ${CONFIG.APP_NAME}.</p><p>Open the app, choose <b>Marketing team</b> on the sign-in page, and you'll see the review queue, every submission, requests and the compliance reports.</p>` });
  return teamInfo_();
}

/** An employee asks the marketing team for marketing access (at most once a day). */
function requestMarketingAccess() {
  const email = email_();
  if (isAdmin_(email)) return { already: true };
  const cache = CacheService.getScriptCache(); const key = "access:" + email;
  if (cache.get(key)) return { sent: true };
  sendMail_({ to: admins_().join(","), subject: `Marketing access request: ${nameOf_(email)}`,
    body: `<p><b>${esc_(nameOf_(email))}</b> (${esc_(email)}) asked for marketing team access in ${CONFIG.APP_NAME}.</p><p>If they should review work, open the app as the marketing team and add them under <b>Team &amp; access</b>.</p>` });
  cache.put(key, "1", 60 * 60 * 24);
  return { sent: true };
}
function nameFromEmail_(email) {
  return email.split("@")[0].split(/[._-]+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function nameOf_(email) {
  if (email === "ai") return "Brand Astra check";   // "ai": the stored reviewer id of the automatic check
  const p = rows_("People").filter((x) => x.key === email)[0];
  return p ? p.obj.name : nameFromEmail_(email);
}

// ---------- Validation ----------
function str_(v, max) { return String(v == null ? "" : v).slice(0, max); }
function isGoogleLink_(v) { return /^https:\/\/(docs|drive)\.google\.com\//i.test(String(v || "")); }
function isDate_(v) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")); }
function cleanSubmission_(e) {
  if (!e || typeof e !== "object") throw new Error("Invalid submission.");
  if (!str_(e.title, 120).trim()) throw new Error("A title is required.");
  if (!isGoogleLink_(e.link)) throw new Error("Use a Google Slides, Docs or Drive link.");
  const checks = {};
  Object.keys(e.checks || {}).slice(0, 12).forEach((k) => { checks[str_(k, 3)] = !!e.checks[k]; });
  const pre = e.precheck || {};
  return {
    briefId: str_(e.briefId, 60), title: str_(e.title, 120).trim(), kind: str_(e.kind, 40), team: str_(e.team, 60),
    link: str_(e.link, 500), notes: str_(e.notes, 2000), format: str_(e.format, 20), checks: checks, copy: str_(e.copy, 3000),
    channel: str_(e.channel, 60), audience: e.audience === "Internal" ? "Internal" : "External", neededBy: isDate_(e.neededBy) ? e.neededBy : "",
    precheck: { score: Math.max(0, Math.min(100, Number(pre.score) || 0)), issues: (pre.issues || []).slice(0, 12).map((i) => ({ sev: str_(i.sev, 8), quote: str_(i.quote, 120), msg: str_(i.msg, 300) })) },
    submittedAt: str_(e.submittedAt, 40), firstSubmittedAt: str_(e.firstSubmittedAt, 40), version: Math.max(1, Math.min(99, Number(e.version) || 1)),
  };
}
const QC_KEYS = ["logo", "colour", "type", "layout", "imagery", "copy"];
function cleanReview_(r, email) {
  const history = (r.history || []).slice(-20).map((h) => ({ status: str_(h.status, 12), score: Number(h.score) || 0, at: str_(h.at, 40), by: str_(h.by, 120), version: Number(h.version) || 1 }));
  if (r.status === "inreview") return { status: "inreview", at: new Date().toISOString(), by: email, version: Number(r.version) || 1, history: history };
  const qc = {};
  QC_KEYS.forEach((k) => { qc[k] = ["pass", "minor", "fail"].indexOf(r.qc && r.qc[k]) >= 0 ? r.qc[k] : "pass"; });
  if (["approved", "changes", "rejected"].indexOf(r.status) < 0) throw new Error("Invalid review status.");
  // Per-rule verdicts from the rulebook scorecard; the score is recomputed here so it can't be edited by hand.
  const rules = {}; let score = Math.max(0, Math.min(100, Number(r.score) || 0));
  if (r.rules && typeof r.rules === "object") {
    BRAND.rules.forEach((x) => { const v = r.rules[x.id]; rules[x.id] = ["pass", "fail", "na"].indexOf(v) >= 0 ? v : "pass"; });
    const ev = BRAND.evaluate(r.format || "other", Object.keys(rules).reduce((o, k) => { o[k] = { status: rules[k] }; return o; }, {}));
    score = ev.score; QC_KEYS.forEach((k) => { qc[k] = ev.qc[k]; });
  }
  return { status: r.status, qc: qc, rules: r.rules ? rules : undefined, score: score, comment: str_(r.comment, 3000),
    at: new Date().toISOString(), by: email, version: Number(r.version) || 1, history: history };
}

// ---------- API called from the page ----------
function getState() {
  const email = email_();
  const admin = isAdmin_(email);
  const people = {};
  rows_("People").forEach((p) => { people[p.key] = { name: p.obj.name, team: p.obj.team, lastSeen: admin ? p.obj.lastSeen || "" : undefined }; });
  touch_(email);
  const briefs = {};
  rows_("Requests").forEach((r) => { briefs[r.key] = r.obj; });
  const subs = {}, owner = {};
  rows_("Submissions").forEach((r) => {
    const who = r.obj.email; owner[r.key] = who;
    if (!admin && who !== email) return;
    (subs[who] = subs[who] || { items: {} }).items[r.key] = r.obj.entry;
  });
  const reviews = {};
  rows_("Reviews").forEach((r) => {
    const who = owner[r.key]; if (!who) return;
    if (!admin && who !== email) return;
    (reviews[who] = reviews[who] || { items: {} }).items[r.key] = r.obj.review;
  });
  const threads = {};
  rows_("Comments").forEach((r) => {
    const who = owner[r.key]; if (!who) return;
    if (!admin && who !== email) return;
    (threads[who] = threads[who] || { items: {} }).items[r.key] = r.obj.messages;
  });
  const showcase = {};
  rows_("Showcase").forEach((r) => { showcase[r.key] = r.obj; });
  const settings = {};
  rows_("Settings").forEach((r) => { settings[r.key] = r.obj; });
  const me = people[email];
  // Employees see names of admins (reviewers) and of Showcase authors; admins see everyone.
  const visible = {};
  if (admin) Object.assign(visible, people);
  else {
    visible[email] = people[email] || { name: nameFromEmail_(email), team: "" };
    admins_().forEach((a) => { visible[a] = people[a] || { name: nameFromEmail_(a), team: "" }; });
    Object.keys(showcase).forEach((k) => { const o = showcase[k].owner; if (o) visible[o] = people[o] || { name: nameFromEmail_(o), team: "" }; });
  }
  return {
    me: { email: email, name: me ? me.name : nameFromEmail_(email), team: me ? me.team : "", isAdmin: admin, isNew: !me },
    people: visible, briefs: briefs, subs: subs, reviews: reviews, threads: threads, showcase: showcase, settings: settings,
    team: admin ? teamInfo_() : null,
    sheetUrl: admin ? book_().getUrl() : null,
    appUrl: ScriptApp.getService().getUrl(),
  };
}

/** Records when someone last opened the app (at most every 6 hours), for Team & access. */
function touch_(email) {
  const p = rows_("People").filter((x) => x.key === email)[0];
  if (!p || (p.obj.lastSeen && Date.now() - new Date(p.obj.lastSeen).getTime() < 6 * 3600000)) return;
  const obj = Object.assign({}, p.obj, { lastSeen: new Date().toISOString() });
  try { writeRow_("People", p.row, [email, obj.name, obj.team, obj.firstSeen, obj.lastSeen, obj]); } catch (e) {}
}

function saveProfile(name, team) {
  const email = email_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const now = new Date().toISOString();
    const existing = rows_("People").filter((p) => p.key === email)[0];
    const obj = { email: email, name: str_(name, 80).trim() || nameFromEmail_(email), team: str_(team, 60).trim(), firstSeen: existing ? existing.obj.firstSeen : now, lastSeen: now };
    writeRow_("People", existing && existing.row, [email, obj.name, obj.team, obj.firstSeen, obj.lastSeen, obj]);
    return { name: obj.name, team: obj.team };
  } finally { lock.releaseLock(); }
}

/** One write from the page. Paths: briefs/<id>, subs/<email>, reviews/<email>, threads/<email>, showcase/<id>, settings/<key>. */
function write(path, op, data) {
  const email = email_();
  const admin = isAdmin_(email);
  const parts = String(path).split("/");
  const col = parts[0], id = parts.slice(1).join("/");
  const mails = [];
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    if (col === "briefs") {
      if (!admin) throw new Error("Only brand admins can change requests.");
      const existing = rows_("Requests").filter((r) => r.key === id)[0];
      if (op === "delete") { if (existing) deleteRows_("Requests", [existing.row]); return true; }
      const d = data || {};
      const stage = ["todo", "doing", "review", "done"].indexOf(d.stage) >= 0 ? d.stage : d.closed ? "done" : "todo";
      const obj = { title: str_(d.title, 120), kind: str_(d.kind, 40), deadline: str_(d.deadline, 10), templateUrl: str_(d.templateUrl, 500), description: str_(d.description, 1500),
        priority: ["high", "normal", "low"].indexOf(d.priority) >= 0 ? d.priority : "normal", stage: stage, closed: stage === "done",
        teams: (Array.isArray(d.teams) ? d.teams : []).slice(0, 20).map((t) => str_(t, 60)).filter(String),
        people: (Array.isArray(d.people) ? d.people : []).slice(0, 300).map((p) => str_(p, 120).toLowerCase().trim()).filter((p) => /^[^@\s]+@[^@\s]+$/.test(p) && p.endsWith("@" + CONFIG.DOMAIN)),
        createdAt: str_(d.createdAt, 40) || new Date().toISOString(), createdBy: existing ? existing.obj.createdBy : email, updatedAt: new Date().toISOString() };
      if (!obj.title || !isDate_(obj.deadline)) throw new Error("A request needs a title and a deadline.");
      if (CONFIG.EMAIL_ON_ASSIGN && !obj.closed) {
        const before = existing ? assignees_(existing.obj) : [];
        const added = assignees_(obj).filter((a) => before.indexOf(a) < 0 && a !== email);
        if (added.length) mails.push({ to: added.join(","), subject: `New request for you: ${obj.title}`,
          body: `<p><b>${esc_(nameOf_(email))}</b> assigned you a request${obj.priority === "high" ? " (high priority)" : ""}:</p><p><b>${esc_(obj.title)}</b> · ${esc_(obj.kind)} · due <b>${obj.deadline}</b></p>${obj.description ? "<p>" + esc_(obj.description).replace(/\n/g, "<br>") + "</p>" : ""}${obj.templateUrl ? '<p><a href="' + esc_(obj.templateUrl) + '">Open the template</a></p>' : ""}<p>Submit your work against this request in Brand Astra.</p>` });
      }
      writeRow_("Requests", existing && existing.row, [id, obj.title, obj.kind, obj.deadline, obj.templateUrl, obj.description, { todo: "To do", doing: "In progress", review: "In review", done: "Closed" }[obj.stage], obj.createdBy, obj.updatedAt, obj]);
      return true;
    }
    if (col === "subs") {
      if (id !== email) throw new Error("You can only change your own submissions.");
      if (op !== "set") throw new Error("Unsupported operation.");
      const items = (data && data.items) || {};
      const sids = Object.keys(items).slice(0, 300);
      const name = nameOf_(email);
      const briefs = {}; rows_("Requests").forEach((r) => { briefs[r.key] = r.obj.title; });
      const all = rows_("Submissions");
      const mine = all.filter((r) => r.obj.email === email);
      const before = {}; mine.forEach((r) => { before[r.key] = r.obj.entry; });
      deleteRows_("Submissions", mine.filter((r) => sids.indexOf(r.key) < 0).map((r) => r.row));
      const fresh = rows_("Submissions");
      sids.forEach((sid) => {
        if (!/^[A-Za-z0-9-]{1,60}$/.test(sid)) throw new Error("Invalid submission id.");
        if (all.filter((r) => r.key === sid && r.obj.email !== email)[0]) throw new Error("Invalid submission id.");
        const e = cleanSubmission_(items[sid]);
        const row = fresh.filter((r) => r.key === sid)[0];
        writeRow_("Submissions", row && row.row, [sid, email, name, e.team, e.title, e.kind, e.format, e.channel, e.audience, e.neededBy, e.link, e.notes, briefs[e.briefId] || "", e.submittedAt, e.version, e.precheck.score, { email: email, entry: e }]);
        const prev = before[sid];
        if (CONFIG.EMAIL_ADMINS_ON_SUBMIT && (!prev || e.version > (prev.version || 1))) {
          mails.push({ to: admins_().join(","), subject: `${prev ? "Revised" : "New"} for brand review: ${e.title}`,
            body: `<p><b>${esc_(name)}</b> (${esc_(e.team || "no team")}) ${prev ? "submitted version " + e.version + " of" : "submitted"} <b>${esc_(e.title)}</b> for a brand check.</p>
              <p>${esc_(e.kind)} · ${esc_(e.channel)} · ${esc_(e.audience)}${e.neededBy ? " · needed by <b>" + e.neededBy + "</b>" : ""} · pre-check ${e.precheck.score}/100</p>
              <p>${esc_(e.notes)}</p>` });
        }
      });
      return true;
    }
    if (col === "reviews") {
      if (!admin) throw new Error("Only brand admins can review work.");
      const items = (data && data.items) || {};
      const subs = {}; rows_("Submissions").forEach((r) => { subs[r.key] = r.obj; });
      const existing = rows_("Reviews");
      Object.keys(items).forEach((sid) => {
        const s = subs[sid];
        if (!s || s.email !== id) throw new Error("That submission no longer exists.");
        const rv = cleanReview_(Object.assign({}, items[sid], { format: s.entry.format }), email);
        const row = existing.filter((r) => r.key === sid)[0];
        if (row && row.obj.review.ai && row.obj.review.version === rv.version) rv.ai = row.obj.review.ai;
        writeRow_("Reviews", row && row.row, [sid, s.email, s.entry.title, rv.status, rv.status === "inreview" ? "" : rv.score].concat(QC_KEYS.map((k) => rv.qc ? rv.qc[k] : ""), [rv.comment || "", email, rv.at, { review: rv }]));
        if (CONFIG.EMAIL_EMPLOYEE_ON_REVIEW && rv.status !== "inreview") mails.push(reviewMail_(sid, s, rv));
      });
      return true;
    }
    if (col === "threads") {
      if (id !== email && !admin) throw new Error("You can only post in your own conversations.");
      const items = (data && data.items) || {};
      const subs = {}; rows_("Submissions").forEach((r) => { subs[r.key] = r.obj; });
      const existing = rows_("Comments");
      Object.keys(items).forEach((sid) => {
        const s = subs[sid];
        if (!s || s.email !== id) throw new Error("That submission no longer exists.");
        const row = existing.filter((r) => r.key === sid)[0];
        const old = row ? row.obj.messages : [];
        const seen = {}; old.forEach((m) => { seen[m.id] = true; });
        // Only append: earlier messages can't be edited, and authorship is always the signed-in user.
        const added = (items[sid] || []).filter((m) => m && m.id && !seen[m.id] && str_(m.text, 2000).trim()).slice(0, 5)
          .map((m) => ({ id: str_(m.id, 60), by: email, text: str_(m.text, 2000).trim(), at: new Date().toISOString() }));
        if (!added.length) return;
        const msgs = old.concat(added).slice(-200);
        writeRow_("Comments", row && row.row, [sid, s.email, msgs.length, email, added[added.length - 1].at, { messages: msgs }]);
        if (CONFIG.EMAIL_ON_COMMENT) {
          let to;
          if (email === s.email) {
            const rv = rows_("Reviews").filter((r) => r.key === sid)[0];
            const by = rv && rv.obj.review.by;
            to = by && by !== "ai" && by.indexOf("@") > 0 ? by : admins_().join(",");
          } else to = s.email;
          mails.push({ to: to, subject: `New message on “${s.entry.title}”`,
            body: `<p><b>${esc_(nameOf_(email))}</b> wrote:</p><blockquote>${esc_(added.map((m) => m.text).join("\n\n")).replace(/\n/g, "<br>")}</blockquote><p>Reply in Brand Astra.</p>` });
        }
      });
      return true;
    }
    if (col === "showcase") {
      if (!admin) throw new Error("Only brand admins can change the Showcase.");
      const existing = rows_("Showcase").filter((r) => r.key === id)[0];
      if (op === "delete") { if (existing) deleteRows_("Showcase", [existing.row]); return true; }
      const d = data || {};
      const s = rows_("Submissions").filter((r) => r.key === id)[0];
      if (!s) throw new Error("That submission no longer exists.");
      const obj = { title: str_(d.title, 120), kind: str_(d.kind, 40), format: str_(d.format, 20), team: str_(d.team, 60), link: s.obj.entry.link,
        score: Math.max(0, Math.min(100, Number(d.score) || 0)), note: str_(d.note, 160), owner: s.obj.email, approvedAt: new Date().toISOString(), by: email };
      writeRow_("Showcase", existing && existing.row, [id, obj.title, obj.kind, obj.team, obj.link, obj.score, obj.note, obj.approvedAt, obj]);
      return true;
    }
    if (col === "settings") {
      if (!admin) throw new Error("Only brand admins can change settings.");
      if (id !== "templates") throw new Error("Unknown setting.");
      const links = {};
      const src = (data && data.links) || {};
      Object.keys(src).slice(0, 20).forEach((k) => { const v = str_(src[k], 500); if (/^https:\/\//i.test(v)) links[str_(k, 20)] = v; });
      const existing = rows_("Settings").filter((r) => r.key === id)[0];
      writeRow_("Settings", existing && existing.row, [id, JSON.stringify(links), new Date().toISOString(), { links: links }]);
      return true;
    }
    throw new Error("Unknown data path.");
  } finally {
    lock.releaseLock();
    mails.forEach(sendMail_);
  }
}

// ---------- Email ----------
function reviewMail_(sid, s, rv) {
  const label = { approved: "Approved", changes: "Changes requested", rejected: "Not approved" }[rv.status];
  const flagged = QC_KEYS.filter((k) => rv.qc[k] !== "pass").map((k) => k + ": " + rv.qc[k]).join(", ");
  const who = rv.by === "ai" ? "The automatic brand check" : "The brand team";
  const fixes = rv.ai && rv.ai.fixes && rv.ai.fixes.length ? "<p><b>Fix these first</b></p><ol>" + rv.ai.fixes.map((f) => "<li>" + esc_(f) + "</li>").join("") + "</ol>" : "";
  return { to: s.email, subject: `${label}: ${s.entry.title}`,
    body: `<p>Hi ${esc_(nameOf_(s.email).split(" ")[0])},</p><p>${who} reviewed <b>${esc_(s.entry.title)}</b>: <b>${label}</b> · QC score ${rv.score}/100.</p>
      ${flagged ? "<p>Flagged: " + esc_(flagged) + "</p>" : ""}${rv.comment ? "<p>" + esc_(rv.comment).replace(/\n/g, "<br>") + "</p>" : ""}${fixes}
      ${rv.status === "approved" ? "<p>Approval ID: <b>" + approvalId_(sid, rv.at) + "</b>. Quote it when you publish or share this externally.</p>" : "<p>Open Brand Astra to submit a revised version. If you think the check got it wrong, ask for a human review from your submission.</p>"}` };
}
function esc_(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function approvalId_(sid, at) {
  const d = new Date(at);
  return "BA-" + String(d.getFullYear()).slice(2) + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + sid.replace(/[^A-Za-z0-9]/g, "").slice(0, 5).toUpperCase();
}
function sendMail_(m) {
  if (!m || !m.to) return;
  try {
    const url = ScriptApp.getService().getUrl();
    MailApp.sendEmail({
      to: m.to, subject: "[Brand Astra] " + m.subject, name: CONFIG.APP_NAME,
      htmlBody: `<div style="font-family:Poppins,Arial,sans-serif;font-size:14px;color:#0B0F17;max-width:560px">${m.body}
        <p style="margin-top:20px"><a href="${url}" style="background:#005DFF;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Open Brand Astra</a></p>
        <p style="color:#8C95A6;font-size:12px;margin-top:24px">Recykal · Sustainable Circularity</p></div>`,
    });
  } catch (e) { console.warn("Email not sent: " + e); }
}
function workDays_(fromIso, toMs) {
  let t = new Date(fromIso).getTime(), ms = 0;
  while (t < toMs) { const d = new Date(t); const nx = Math.min(toMs, new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime()); if (d.getDay() !== 0 && d.getDay() !== 6) ms += nx - t; t = nx; }
  return ms / 86400000;
}

/** Emails of the people a request is assigned to (named people plus everyone in the named teams). Empty = everyone. */
function assignees_(b) {
  const out = {}; (b.people || []).forEach((p) => { out[p] = 1; });
  if (b.teams && b.teams.length) rows_("People").forEach((p) => { if (b.teams.indexOf(p.obj.team) >= 0) out[p.key] = 1; });
  return Object.keys(out);
}
/** Deadline reminders: assigned people who haven't submitted yet, REMIND_DAYS_BEFORE days before the deadline. Requests for everyone aren't mass-emailed. */
function remindAssignees_() {
  if (!CONFIG.REMIND_DAYS_BEFORE || !CONFIG.REMIND_DAYS_BEFORE.length) return;
  const tz = Session.getScriptTimeZone();
  const today = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  const daysTo = (d) => Math.round((new Date(d + "T00:00:00Z") - new Date(today + "T00:00:00Z")) / 86400000);
  const submitted = {}; rows_("Submissions").forEach((r) => { const e = r.obj.entry; if (e.briefId) (submitted[e.briefId] = submitted[e.briefId] || {})[r.obj.email] = 1; });
  rows_("Requests").forEach((r) => {
    const b = r.obj; if (!b || b.closed || !isDate_(b.deadline)) return;
    const n = daysTo(b.deadline); if (CONFIG.REMIND_DAYS_BEFORE.indexOf(n) < 0) return;
    const to = assignees_(b).filter((a) => !(submitted[r.key] || {})[a]);
    if (!to.length) return;
    sendMail_({ to: to.join(","), subject: `${n === 0 ? "Due today" : "Due in " + n + " days"}: ${b.title}`,
      body: `<p>A reminder: <b>${esc_(b.title)}</b> is due <b>${n === 0 ? "today" : "on " + b.deadline}</b> and we haven't received your submission yet.</p>${b.templateUrl ? '<p><a href="' + esc_(b.templateUrl) + '">Open the template</a></p>' : ""}<p>Run it through Brand QC, then submit it against the request in Brand Astra.</p>` });
  });
}

/** Runs every morning: deadline reminders, then a summary of the review queue for admins. */
function dailyDigest() {
  try { remindAssignees_(); } catch (e) { console.warn("Reminders failed: " + e); }
  const reviews = {}; rows_("Reviews").forEach((r) => { reviews[r.key] = r.obj.review; });
  const now = Date.now();
  const open = rows_("Submissions").map((r) => ({ sid: r.key, email: r.obj.email, e: r.obj.entry, rv: reviews[r.key] }))
    .filter((x) => !x.rv || x.rv.at < x.e.submittedAt || x.rv.status === "inreview");
  if (!open.length) return;
  const over = open.filter((x) => workDays_(x.e.submittedAt, now) > CONFIG.SLA_WORKING_DAYS);
  const urgent = open.filter((x) => x.e.neededBy && (new Date(x.e.neededBy + "T23:59:59").getTime() - now) < 2 * 86400000);
  const line = (x) => `<li><b>${esc_(x.e.title)}</b> · ${esc_(nameOf_(x.email))} · waiting ${workDays_(x.e.submittedAt, now).toFixed(1)} working days${x.e.neededBy ? " · needed by " + x.e.neededBy : ""}${x.rv && x.rv.status === "inreview" && x.rv.at >= x.e.submittedAt ? (x.rv.by === "ai" ? " · <b>passed the automatic check, needs the eye check</b>" : " · being reviewed by " + esc_(nameOf_(x.rv.by))) : ""}</li>`;
  sendMail_({ to: admins_().join(","), subject: `${open.length} waiting for review${over.length ? " · " + over.length + " over SLA" : ""}`,
    body: `<p>Good morning. <b>${open.length}</b> submission(s) are waiting for a brand check.</p>
      ${urgent.length ? "<p><b>Urgent (needed within 2 days)</b></p><ul>" + urgent.map(line).join("") + "</ul>" : ""}
      ${over.length ? "<p><b>Over the " + CONFIG.SLA_WORKING_DAYS + "-working-day SLA</b></p><ul>" + over.map(line).join("") + "</ul>" : ""}
      ${!urgent.length && !over.length ? "<ul>" + open.slice(0, 10).map(line).join("") + "</ul>" : ""}` });
}

/** Run once from the editor: creates the data sheet, approves permissions and schedules the daily digest. */
function setup() {
  const ss = book_();
  Object.keys(SHEETS).forEach((n) => sheet_(n));
  ScriptApp.getProjectTriggers().filter((t) => ["dailyDigest", "processPendingAi"].indexOf(t.getHandlerFunction()) >= 0).forEach((t) => ScriptApp.deleteTrigger(t));
  if (CONFIG.DAILY_DIGEST_HOUR != null && CONFIG.DAILY_DIGEST_HOUR !== false) {
    ScriptApp.newTrigger("dailyDigest").timeBased().everyDays(1).atHour(CONFIG.DAILY_DIGEST_HOUR).create();
  }
  Logger.log("Data sheet: " + ss.getUrl());
}

// =====================================================================
// Brand Astra check — automatic brand QC with no AI, against the rulebook in BRAND (rules.js).
//   The page runs the check (BRAND_CHECK in check.js) on the file itself, in the employee's browser: uploads are read
//   straight from their computer; for a Google link, fileForQc hands the page the file (Slides and Docs exported as PDF).
//   saveAutoCheck stores the result and rescores it here with BRAND.evaluate. The check never approves: measured
//   failures go straight back to the employee, and work that passes goes to the brand team, who check the rules a
//   computer can't judge (logo artwork, imagery, alignment, proofreading) by eye.
// =====================================================================

const FORMAT_KEYS_ = ["slide", "square", "portrait", "story", "landscape", "other"];
const SEV_ORDER_ = { critical: 0, major: 1, minor: 2 };
const PPTX_MIME_ = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const QC_FILE_LIMIT_ = 15 * 1024 * 1024;

function fileIdFromLink_(link) {
  const m = String(link).match(/\/d\/([A-Za-z0-9_-]{20,})/) || String(link).match(/[?&]id=([A-Za-z0-9_-]{20,})/);
  return m ? m[1] : null;
}
function openLinkedFile_(link) {
  const id = fileIdFromLink_(link);
  if (!id) throw new Error("Brand Astra couldn't find a file in that link. Copy it from the Share button in Google Slides, Docs or Drive.");
  try { return DriveApp.getFileById(id); }
  catch (e) { throw new Error("Brand Astra can't open this file. In Google Drive, click Share → General access → “Anyone at Recykal with the link” (Viewer), then try again."); }
}

/** A linked file for the page to check: { name, mime, b64 }. Google Slides and Docs come as PDF. Nothing is saved. */
function fileForQc(link) {
  email_();
  if (!isGoogleLink_(link)) throw new Error("Use a Google Slides, Docs or Drive link.");
  const file = openLinkedFile_(link); const mime = file.getMimeType();
  let blob;
  if (mime === MimeType.GOOGLE_SLIDES || mime === MimeType.GOOGLE_DOCS) blob = file.getAs(MimeType.PDF);
  else if (mime === MimeType.PDF || mime === PPTX_MIME_ || /^image\/(png|jpeg|webp)$/.test(mime)) blob = file.getBlob();
  else throw new Error("Brand Astra can check Google Slides, Google Docs, PowerPoint (.pptx), PDF and PNG, JPG or WEBP files. Export this file to one of those and share the link.");
  const bytes = blob.getBytes();
  if (bytes.length > QC_FILE_LIMIT_) throw new Error("This file is over 15 MB. Compress the pictures or split it, then try again.");
  const converted = blob.getContentType() === MimeType.PDF && mime !== MimeType.PDF;
  return { name: file.getName() + (converted ? ".pdf" : ""), mime: blob.getContentType(), b64: Utilities.base64Encode(bytes) };
}

/** The page's check result → the rule results and a clean report (only known rules, statuses and capped text are kept). */
function cleanCheck_(x, format) {
  if (!x || !Array.isArray(x.checks)) throw new Error("The check result is incomplete. Run the check again.");
  const given = {}; x.checks.forEach((c) => { if (c && BRAND.ruleById[c.id]) given[c.id] = c; });
  const results = {}, checks = [];
  BRAND.rules.forEach((r) => {
    const c = given[r.id] || {};
    let st = ["pass", "fail", "na", "unsure"].indexOf(c.status) >= 0 ? c.status : "unsure";
    if (r.f.indexOf(format) < 0) st = "na";
    results[r.id] = { status: st };
    checks.push({ id: r.id, status: st, evidence: str_(c.evidence, 600), where: str_(c.where, 160), fix: str_(c.fix, 400), by: st === "unsure" ? "reviewer" : r.f.indexOf(format) < 0 ? "rule" : "measured" });
  });
  let facts = {}; try { facts = JSON.parse(JSON.stringify(x.facts || {})); } catch (e) {}
  if (JSON.stringify(facts).length > 20000) facts = { kind: str_(facts.kind, 10), pages: Number(facts.pages) || 0, ratio: Number(facts.ratio) || null };
  return { results: results, report: { v: 3, mode: "auto", format: format, summary: str_(x.summary, 600), checks: checks, facts: facts, file: str_(x.file, 120), checkedAt: new Date().toISOString() } };
}

/** Saves the automatic check of a submission (run by the page) and decides what happens next. */
function saveAutoCheck(uid, sid, report) {
  const email = email_();
  const sub = rows_("Submissions").filter((r) => r.key === sid)[0];
  if (!sub || sub.obj.email !== uid || (uid !== email && !isAdmin_(email))) throw new Error("You can only check your own submissions.");
  const entry = sub.obj.entry;
  const format = FORMAT_KEYS_.indexOf(entry.format) >= 0 ? entry.format : "other";
  const clean = cleanCheck_(report, format);
  const ev = BRAND.evaluate(format, clean.results, { approveAt: CONFIG.APPROVE_AT, changesAt: CONFIG.CHANGES_AT });
  const rep = clean.report;
  const fails = rep.checks.filter((c) => c.status === "fail").sort((a, b) => SEV_ORDER_[BRAND.ruleById[a.id].sev] - SEV_ORDER_[BRAND.ruleById[b.id].sev]);
  rep.fixes = fails.map((c) => (c.where ? c.where + ": " : "") + (c.fix || c.evidence)).slice(0, 8);
  rep.deductions = ev.deductions; rep.needsHuman = ev.needsHuman; rep.eye = rep.checks.filter((c) => c.by === "reviewer").map((c) => c.id);
  rep.criteria = {}; BRAND.groups.forEach(([g]) => { rep.criteria[g] = { rating: ev.qc[g], feedback: fails.filter((c) => BRAND.ruleById[c.id].g === g).map((c) => c.evidence).join(" ").slice(0, 600) || "No measured problem." }; });
  // Measured failures go straight back; everything else waits for the brand team's eye check.
  const status = ev.score < CONFIG.APPROVE_AT ? ev.decision : "inreview";
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  let rv;
  try {
    const row = rows_("Reviews").filter((r) => r.key === sid)[0];
    const prev = row && row.obj.review;
    if (prev && prev.by !== "ai" && prev.at >= entry.submittedAt && prev.status !== "inreview" && !isAdmin_(email)) return { skipped: true, status: prev.status, score: prev.score };
    const at = new Date().toISOString();
    rv = { status: status, qc: ev.qc, score: ev.score, comment: rep.summary, at: at, by: "ai", version: entry.version || 1, ai: rep,
      history: ((prev && prev.history) || []).concat(status === "inreview" ? [] : [{ status: status, score: ev.score, at: at, by: "ai", version: entry.version || 1 }]).slice(-20) };
    writeRow_("Reviews", row && row.row, [sid, sub.obj.email, entry.title, rv.status, rv.status === "inreview" ? "" : rv.score].concat(QC_KEYS.map((k) => rv.qc[k]), [rv.comment, "Brand Astra check", rv.at, { review: rv }]));
  } finally { lock.releaseLock(); }
  if (CONFIG.EMAIL_EMPLOYEE_ON_REVIEW && rv.status !== "inreview") sendMail_(reviewMail_(sid, sub.obj, rv));
  return { status: rv.status, score: rv.score };
}

// ---------- Uploads (Brand QC "Upload image or PDF") ----------
// Uploaded files are saved to a "Brand Astra — Uploads" folder in the deploying account's Drive and
// shared view-only with Recykal, so the brand team opens them exactly like a pasted link.
function uploadsFolder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("UPLOAD_FOLDER_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const folder = DriveApp.createFolder(CONFIG.APP_NAME + " — Uploads");
  props.setProperty("UPLOAD_FOLDER_ID", folder.getId());
  return folder;
}
function uploadForQc(name, mime, b64) {
  const email = email_();
  const types = { "image/png": 5, "image/jpeg": 5, "image/webp": 5, "application/pdf": 15, [PPTX_MIME_]: 15 };
  if (!types[mime]) throw new Error("Upload a PowerPoint (.pptx), a PDF, or a PNG, JPG or WEBP image.");
  const bytes = Utilities.base64Decode(String(b64 || ""));
  if (!bytes.length) throw new Error("That file is empty.");
  if (bytes.length > types[mime] * 1024 * 1024) throw new Error(types[mime] === 15 ? "This file is over 15 MB. Compress it, or share it as a Google Drive link instead." : "This image is over 5 MB. Export a smaller version.");
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmm");
  const file = uploadsFolder_().createFile(Utilities.newBlob(bytes, mime, `${stamp} · ${email.split("@")[0]} · ${str_(name, 80) || "upload"}`));
  file.setDescription("Uploaded to Brand Astra by " + email);
  try { file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { console.warn("Could not share upload with the domain: " + e); }
  return "https://drive.google.com/file/d/" + file.getId() + "/view";
}

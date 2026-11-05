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

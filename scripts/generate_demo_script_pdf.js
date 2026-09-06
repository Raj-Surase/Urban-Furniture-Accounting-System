const { jsPDF } = require('../frontend/node_modules/jspdf');
const fs = require('fs');
const path = require('path');

function createScriptPdf() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const totalPagesExp = '{total_pages_count_string}';

  const pageWidth = doc.internal.pageSize.getWidth();   // 595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
  const marginLeft = 38;
  const marginRight = 38;
  const contentWidth = pageWidth - marginLeft - marginRight; // 519.28 pt
  const marginTop = 38;
  const marginBottom = 36;

  let currY = marginTop;

  // Refined Corporate Color Palette
  const C_INDIGO = [79, 70, 229];      // #4F46E5 Primary Brand
  const C_VIOLET = [124, 58, 237];     // #7C3AED Accent Purple
  const C_EMERALD = [5, 150, 105];     // #059669 Action Emerald
  const C_DARK = [15, 23, 42];         // #0F172A Deep Slate Title
  const C_BODY = [51, 65, 85];         // #334155 Slate Body
  const C_MUTED = [100, 116, 139];     // #64748B Subtitle
  const C_BORDER = [226, 232, 240];    // #E2E8F0 Subtle Border
  const C_BG_CARD = [248, 250, 252];   // #F8FAFC Card Background
  const C_SPEECH_BG = [245, 243, 255]; // #F5F3FF Soft Lavender Fill
  const C_AMBER_TXT = [180, 83, 9];    // #B45309 Amber Callout Text
  const C_AMBER_BG = [254, 243, 199];   // #FEF3C7 Amber Fill

  function forcePageBreak() {
    doc.addPage();
    currY = marginTop;
  }

  function drawTopAccent() {
    doc.setFillColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
    doc.rect(0, 0, pageWidth, 4.5, 'F');
  }

  // =========================================================================
  // PAGE 1: TITLE, METADATA CARD, TIMELINE MAP & SCENE 01
  // =========================================================================
  drawTopAccent();

  // Top Org & Event Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
  doc.text('URBAN FURNITURE ACCOUNTING SYSTEM', marginLeft, currY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
  doc.text('ODOO HACKATHON 2026  •  OFFICIAL RECORDING SCREENPLAY', pageWidth - marginRight, currY + 4, { align: 'right' });
  currY += 17;

  // Main Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
  doc.text('Master Video Demo Recording Script', marginLeft, currY);
  currY += 14;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
  doc.text('Complete Page-to-Page Screenplay: Operational Context, UI Navigation, Visual Actions & Timed Gaps', marginLeft, currY);
  currY += 12;

  // Two-Column Balanced Metadata Card
  const metaCardH = 54;
  doc.setFillColor(C_BG_CARD[0], C_BG_CARD[1], C_BG_CARD[2]);
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
  doc.setLineWidth(0.75);
  doc.roundedRect(marginLeft, currY, contentWidth, metaCardH, 4, 4, 'FD');

  const metaSplitX = marginLeft + 330;
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
  doc.line(metaSplitX, currY + 5, metaSplitX, currY + metaCardH - 5);

  // Left Column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
  doc.text('Target Runtime:', marginLeft + 10, currY + 15);
  doc.text('API & Backend:', marginLeft + 10, currY + 29);
  doc.text('Frontend & WS:', marginLeft + 10, currY + 43);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C_BODY[0], C_BODY[1], C_BODY[2]);
  doc.text('12 to 15 Minutes (11 Structured Operational Scenes)', marginLeft + 80, currY + 15);
  doc.text('Laravel 13 REST API with Sanctum, RBAC & SQLite Persistence', marginLeft + 80, currY + 29);
  doc.text('React 18 (TypeScript + HeroUI + Tailwind) & Node.js Socket.io', marginLeft + 80, currY + 43);

  // Right Column
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
  doc.text('Display:', metaSplitX + 12, currY + 15);
  doc.text('Theme:', metaSplitX + 12, currY + 29);
  doc.text('Blueprint:', metaSplitX + 12, currY + 43);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C_BODY[0], C_BODY[1], C_BODY[2]);
  doc.text('1920x1080 (1080p, 100% Zoom)', metaSplitX + 56, currY + 15);
  doc.text('Obsidian Dark (with Light toggle)', metaSplitX + 56, currY + 29);
  doc.text('24-Hour Excalidraw Wireframe', metaSplitX + 56, currY + 43);

  currY += metaCardH + 11;

  // --- Production Timeline Matrix Table ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
  doc.text('PRODUCTION TIMELINE & SCENE MAP', marginLeft, currY);
  currY += 7;

  // Table Columns
  const colX = [marginLeft, marginLeft + 46, marginLeft + 110, marginLeft + 230];

  doc.setFillColor(C_DARK[0], C_DARK[1], C_DARK[2]);
  doc.rect(marginLeft, currY, contentWidth, 15, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('SCENE', colX[0] + 5, currY + 10.5);
  doc.text('TIMECODE', colX[1] + 5, currY + 10.5);
  doc.text('MODULE / ROUTE', colX[2] + 5, currY + 10.5);
  doc.text('PRIMARY OPERATIONS & FOCUS', colX[3] + 5, currY + 10.5);
  currY += 15;

  const timelineRows = [
    ['Scene 01', '00:00 - 00:50', '/login', 'Architecture, Tech Stack, Live WS Status, Instant 1-Click Demo Logins'],
    ['Scene 02', '00:50 - 01:45', '/register', 'Strict Excalidraw Password Complexity, Login ID Bounds, Validation Parity'],
    ['Scene 03', '01:45 - 03:00', 'Masters (/contacts, etc)', 'Unified Contacts (Kanban/List), Product Master, Chart of Accounts, Journals'],
    ['Scene 04', '03:00 - 04:30', '/budgets', 'Analytical Budgets, Formulas (Achieved %), Revision Bi-Links, Drill-Down Modal'],
    ['Scene 05', '04:30 - 06:00', '/sales-orders -> /invoices', 'SO Creation, 1-Click "Create Invoice", Automated Balanced GL Entry, Vector PDF'],
    ['Scene 06', '06:00 - 07:15', '/purchase-orders -> /bills', 'PO Creation, 1-Click "Create Bill", Purchase Expense Default, Settlement Modal'],
    ['Scene 07', '07:15 - 08:30', '/journal & /reports', 'General Ledger Balanced Parity Rule, Profit & Loss Statement, Balanced Balance Sheet'],
    ['Scene 08', '08:30 - 10:15', '/workshop (3D Studio)', 'Procedural 3D Visualizer, Wood/Fabric Swatches, Dimensions -> Direct PO to ERP'],
    ['Scene 09', '10:15 - 11:30', '/invoices -> Razorpay', 'Razorpay Checkout Modal, Webhook Callback, Automated GL Bank Reconciliation'],
    ['Scene 10', '11:30 - 12:30', '/portal (Client Portal)', 'Contact-Scoped RBAC Isolation, Invoice Table, 1-Click "Pay Now" Flow'],
    ['Scene 11', '12:30 - 13:30', '/ (Dashboard Wrap-up)', 'Light/Dark Theme Toggle, Field Filters, Infinite Scroll, Concluding Pitch'],
  ];

  timelineRows.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(marginLeft, currY, contentWidth, 11.5, 'F');
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, currY + 11.5, marginLeft + contentWidth, currY + 11.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
    doc.text(row[0], colX[0] + 5, currY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
    doc.text(row[1], colX[1] + 5, currY + 8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
    doc.text(row[2], colX[2] + 5, currY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(C_BODY[0], C_BODY[1], C_BODY[2]);
    doc.text(row[3], colX[3] + 5, currY + 8);

    currY += 11.5;
  });

  currY += 12;

  // Section Banner Helper
  function drawSectionBanner(partNum, title, isEmerald = false) {
    const color = isEmerald ? C_EMERALD : C_INDIGO;

    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(marginLeft, currY, 3.5, 20, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(partNum.toUpperCase(), marginLeft + 8, currY + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
    doc.text(title, marginLeft + 8, currY + 18);

    currY += 25;
  }

  // Optimized Render Scene Card
  function renderSceneCard({
    sceneNum,
    title,
    timeCode,
    route,
    description,
    actions,
    dialogueParagraphs,
  }) {
    // 1. Scene Header
    doc.setFillColor(C_BG_CARD[0], C_BG_CARD[1], C_BG_CARD[2]);
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
    doc.setLineWidth(0.75);
    doc.roundedRect(marginLeft, currY, contentWidth, 20, 3, 3, 'FD');

    // Accent strip
    doc.setFillColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
    doc.rect(marginLeft, currY, 3, 20, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
    doc.text(`${sceneNum}: ${title}`, marginLeft + 8, currY + 13);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
    doc.text(`[ ${timeCode} ]`, pageWidth - marginRight - 8, currY + 13, { align: 'right' });
    currY += 23;

    // 2. Route & Context (Stacked with zero overflow!)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
    doc.text('Target Route:', marginLeft + 4, currY + 6);

    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    const routeTextW = doc.getTextWidth(route);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(marginLeft + 54, currY - 2, routeTextW + 12, 10, 2, 2, 'F');
    doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
    doc.text(route, marginLeft + 60, currY + 5.5);
    currY += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
    doc.text('Visual Setup:', marginLeft + 4, currY + 5.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.8);
    doc.setTextColor(C_BODY[0], C_BODY[1], C_BODY[2]);
    doc.text(description, marginLeft + 54, currY + 5.5);
    currY += 11;

    // 3. Actions Box
    const actionH = actions.length * 10 + 16;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(marginLeft, currY, contentWidth, actionH, 3, 3, 'FD');

    doc.setFillColor(236, 253, 245);
    doc.rect(marginLeft, currY, contentWidth, 11, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(C_EMERALD[0], C_EMERALD[1], C_EMERALD[2]);
    doc.text('ACTIONS TO PERFORM WHILE SPEAKING', marginLeft + 8, currY + 8);

    let actY = currY + 17;
    actions.forEach((act) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
      doc.text('•', marginLeft + 8, actY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(C_BODY[0], C_BODY[1], C_BODY[2]);
      doc.text(act, marginLeft + 15, actY);
      actY += 10;
    });
    currY += actionH + 5;

    // 4. Dialogue Box
    // Calculate exact height
    let dialogueH = 14;
    dialogueParagraphs.forEach((p) => {
      if (p.isPause) {
        dialogueH += 12;
      } else {
        const lines = doc.splitTextToSize(p.text, contentWidth - 20);
        dialogueH += lines.length * 9.2;
      }
    });

    doc.setFillColor(C_SPEECH_BG[0], C_SPEECH_BG[1], C_SPEECH_BG[2]);
    doc.setDrawColor(221, 214, 254);
    doc.setLineWidth(0.5);
    doc.roundedRect(marginLeft, currY, contentWidth, dialogueH, 3, 3, 'FD');

    doc.setFillColor(C_VIOLET[0], C_VIOLET[1], C_VIOLET[2]);
    doc.rect(marginLeft, currY, 2.5, dialogueH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(C_VIOLET[0], C_VIOLET[1], C_VIOLET[2]);
    doc.text('SPOKEN SCRIPT & TIMED PAUSES', marginLeft + 8, currY + 8);

    let spkY = currY + 17;
    dialogueParagraphs.forEach((p) => {
      if (p.isPause) {
        const pauseW = doc.getTextWidth(p.text) + 12;
        doc.setFillColor(C_AMBER_BG[0], C_AMBER_BG[1], C_AMBER_BG[2]);
        doc.roundedRect(marginLeft + 8, spkY - 6.5, pauseW, 9.5, 2, 2, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(C_AMBER_TXT[0], C_AMBER_TXT[1], C_AMBER_TXT[2]);
        doc.text(p.text, marginLeft + 14, spkY);
        spkY += 11.5;
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
        const lines = doc.splitTextToSize(p.text, contentWidth - 20);
        lines.forEach((l) => {
          doc.text(l, marginLeft + 8, spkY);
          spkY += 9.2;
        });
      }
    });

    currY += dialogueH + 11;
  }

  // Draw Part 1 Banner
  drawSectionBanner('PART 1', 'Excalidraw Core Accounting Architecture & Workflows');

  // Scene 01 (Page 1)
  renderSceneCard({
    sceneNum: 'SCENE 01',
    title: 'System Overview, Architecture & RBAC Setup',
    timeCode: '00:00 - 00:50',
    route: '/login',
    description: 'Login screen with Instant Demo Logins, animated brand mark, and Socket.io badge',
    actions: [
      'Hover mouse over the animated Urban Furniture Accounting System logo and tagline.',
      'Pan cursor slowly across the three 1-Click Instant Demo Login cards: Admin, Accountant, and Contact.',
      'Click "Forgot Password?" to display the credential recovery modal, highlight helper text, and cancel.',
      'Click the "Sign Up" link at the bottom right to navigate smoothly to the registration screen.',
    ],
    dialogueParagraphs: [
      { isPause: false, text: '"Hello everyone, and welcome to the official demonstration of the Urban Furniture Accounting System, engineered for the 2026 Odoo Hackathon. Urban Furniture is a high-volume manufacturing and civic contracting enterprise. Managing bespoke architectural woodwork alongside rigid double-entry financial standards requires more than a simple ledger—it demands end-to-end operational traceability.' },
      { isPause: true, text: '[PAUSE: 2s — let viewer absorb login interface]' },
      { isPause: false, text: 'Our stack is engineered for speed, strict double-entry integrity, and real-time agility. The backend is built on a Laravel 13 REST API with Sanctum authentication, fine-grained Role-Based Access Control, and SQLite database persistence. On the frontend, we have React 18 with TypeScript, Vite, Tailwind CSS, HeroUI, and Framer Motion. Furthermore, a standalone Node.js Socket.io server broadcasts live ledger events across all active clients.' },
      { isPause: true, text: '[PAUSE: 2s — hover over 1-Click Demo pills]' },
      { isPause: false, text: 'Notice the Instant 1-Click Demo Login buttons on the login screen. We have pre-configured three distinct RBAC personas: Admin with full master data and ledger authority; Accountant for financial reporting and reconciliation; and Contact representing client portal isolation. Let us first review our registration security."' },
    ],
  });

  // =========================================================================
  // PAGE 2: SCENE 02 & SCENE 03
  // =========================================================================
  forcePageBreak();

  renderSceneCard({
    sceneNum: 'SCENE 02',
    title: 'Strict Authentication & Sign-Up Validations',
    timeCode: '00:50 - 01:45',
    route: '/register',
    description: 'Registration form with strict character limits, regex validation, and parity check',
    actions: [
      'Type short login ID "abc" in the Login ID field to show character constraint feedback.',
      'Enter mismatched passwords ("pass1" vs "pass2") to demonstrate instant confirmation validation.',
      'Type valid entries: Login ID "odoo_lead", Password "Urban@2026!", meeting all security criteria.',
      'Hover over password tooltip: mandatory uppercase, lowercase, digit, and special character.',
      'Click "Return to Sign In", and on /login click the "Admin" Demo Login button (admin@example.com).',
    ],
    dialogueParagraphs: [
      { isPause: false, text: '"As laid out in our Excalidraw blueprint, user onboarding adheres to enterprise security standards.' },
      { isPause: true, text: '[PAUSE: 1s — click into Login ID field]' },
      { isPause: false, text: 'The Login ID is strictly enforced between 6 and 12 alphanumeric characters. Furthermore, our password engine mandates a minimum of eight characters containing an uppercase letter, a lowercase letter, a digit, and a special symbol, backed by strict confirmation parity.' },
      { isPause: true, text: '[PAUSE: 2s — click Return to Sign In, then click Admin Demo button]' },
      { isPause: false, text: 'Now, let us authenticate with one click as the System Administrator and step directly into the live operations dashboard."' },
    ],
  });

  renderSceneCard({
    sceneNum: 'SCENE 03',
    title: 'Master Settings: Contacts, Products, COA & Journals',
    timeCode: '01:45 - 03:00',
    route: '/contacts, /products, /accounts, /journals',
    description: 'Unified Contact Master, Product Master (Goods/Service/Combo), Chart of Accounts, and Journals',
    actions: [
      'On Dashboard, point out the green Socket.io "Connected" badge and top Excalidraw operational cards.',
      'Click "Contact Master" in sidebar; toggle between dense List View and Kanban card view.',
      'Open contact "Joey Wills" to show Form View: Street, City, State, Country, Pincode, and avatar.',
      'Click "Product Master"; show items categorized as Goods, Service, Combo with Sales & Cost prices.',
      'Click "Chart of Accounts"; review pre-configured Asset, Liability, Capital, Income, and Expense codes.',
      'Click "Journals"; display pre-configured Sales, Purchase, Bank, and Cash journals with linked accounts.',
    ],
    dialogueParagraphs: [
      { isPause: false, text: '"We land on the executive dashboard. In the top navbar, our WebSocket indicator confirms real-time bidirectional synchronization with our Node.js broadcast service.' },
      { isPause: true, text: '[PAUSE: 2s — glance over Sales, Purchase, and Budget summary cards]' },
      { isPause: false, text: 'To support an accounting ERP, foundational master data must be pristine. Let us review the four core settings specified in our wireframe.' },
      { isPause: true, text: '[PAUSE: 1s — click Contact Master in sidebar]' },
      { isPause: false, text: 'First, our Contact Master. The system unifies customers, suppliers, and municipal clients in a single directory. We can toggle seamlessly between a dense tabular list and an intuitive Kanban card view.' },
      { isPause: true, text: '[PAUSE: 2s — click Kanban toggle, then click Joey Wills]' },
      { isPause: false, text: 'Clicking any contact loads their full form profile—including complete billing addresses, state, GST jurisdiction, and pincode.' },
      { isPause: true, text: '[PAUSE: 1s — click Product Master in sidebar]' },
      { isPause: false, text: 'Next is the Product Master. Here we manage our street and commercial furniture lines: Teak Benches, Ergonomic Chairs, and Modular Shelving. Each product is classified as Goods, Services, or Combos, with its default sales price and cost of goods sold. Categories can be created on-the-fly directly from the entry form.' },
      { isPause: true, text: '[PAUSE: 2s — click Chart of Accounts in sidebar]' },
      { isPause: false, text: 'Under Chart of Accounts, every ledger account adheres to standard Indian Accounting & GST norms: Asset accounts like Bank and Accounts Receivable; Liability accounts like Creditors; Equity Capital; Sales Income; and Purchase Expenses.' },
      { isPause: true, text: '[PAUSE: 1s — click Journals in sidebar]' },
      { isPause: false, text: 'And finally, the Journals Master. All transactions flow through dedicated journals—Sales, Purchase, Bank, and Cash—automatically pre-configured with their default debit and credit offset accounts."' },
    ],
  });

  // =========================================================================
  // PAGE 3: SCENE 04 & SCENE 05
  // =========================================================================
  forcePageBreak();

  renderSceneCard({
    sceneNum: 'SCENE 04',
    title: 'Analytical Budgeting, Excalidraw Revision Lifecycle & Drill-Down',
    timeCode: '03:00 - 04:30',
    route: '/budgets',
    description: 'Analytical Cost Centers, live mathematical formulas, revision audit chain, and drill-down',
    actions: [
      'Navigate to /budgets; highlight multi-field filters (Status, Date Range, Name).',
      'Open confirmed budget "January 2026"; inspect Responsible Contact, Date Range, and Status.',
      'Review Budget Lines: Analytic Account (Furniture, Project 1), Committed, Achieved, and Variance.',
      'Explain dynamic math: Achieved % = (Achieved / Committed) * 100, and Amount to Achieve.',
      'Demonstrate Excalidraw Revise button: original archives to "Revised", child adds "Revised" suffix.',
      'Click directly on the Achieved Amount Rs. value to trigger the real-time Drill-Down Modal of invoices.',
    ],
    dialogueParagraphs: [
      { isPause: false, text: '"Now let us explore one of the crowning features of our Excalidraw blueprint: Analytical Budgeting and Cost Center Tracking.' },
      { isPause: true, text: '[PAUSE: 2s — open January 2026 budget detail]' },
      { isPause: false, text: 'Every budget is assigned a Responsible partner and a designated accounting timeframe. Inside the budget lines, we link directly to our Analytic Accounts—such as Project 1 or Furniture Operations.' },
      { isPause: true, text: '[PAUSE: 2s — move cursor over Committed Amount, Achieved Amount, and Achieved %]' },
      { isPause: false, text: 'Notice the dynamic mathematical formulas running in real time: Achieved Percentage equals Achieved Amount divided by Committed Amount times 100. Amount to Achieve calculates the remaining variance.' },
      { isPause: true, text: '[PAUSE: 2s — hover over the Revise action button and Revision metadata banner]' },
      { isPause: false, text: 'As mandated by our specification, when a project scope changes, an accountant does not overwrite an existing audit trail. Clicking Revise archives the current budget into Revised state, creates a linked child budget titled January 2026 Revised, and establishes bidirectional hyperlinks between both records.' },
      { isPause: true, text: '[PAUSE: 2s — click on Achieved Amount Rs. value to trigger drill-down modal]' },
      { isPause: false, text: 'And look at this: clicking directly on the Achieved Amount opens an instant transaction audit modal! It queries every vendor bill and sales invoice carrying this analytic account within the budget date range, giving financial controllers instantaneous visibility."' },
    ],
  });

  renderSceneCard({
    sceneNum: 'SCENE 05',
    title: 'Sales Workflow: SO -> Customer Invoice -> Balanced GL Entry -> PDF',
    timeCode: '04:30 - 06:00',
    route: '/sales-orders -> /invoices',
    description: 'End-to-end commercial lifecycle: Order entry, automated invoice generation, balanced GL, PDF',
    actions: [
      'In sidebar under Sales, click "Sales order"; open confirmed order SO-2026-0001 for Mr. Rahul.',
      'Point out line items: Teak Desks, Unit Prices, Tax Rates, and Analytic Account (Income).',
      'Click prominent "Create Invoice" button; show instant transition to pre-filled invoice form.',
      'Highlight auto-sequence (INV/2026/0001) and clickable "Source SO" badge button linking back.',
      'Click "Approve & Post"; observe status flip to Approved/Posted and automated balanced GL indicator.',
      'Click "Print PDF"; view the vector Tax Invoice with HSN breakdown, QR code, and bank details.',
    ],
    dialogueParagraphs: [
      { isPause: false, text: '"Next, let us execute the primary commercial workflow: from quote to cash.' },
      { isPause: true, text: '[PAUSE: 1s — click Sales order in the sidebar]' },
      { isPause: false, text: 'Here in Sales Orders, we have our customer orders. Let us open an order for Mr. Rahul.' },
      { isPause: true, text: '[PAUSE: 2s — point out line items and linked Analytic Account]' },
      { isPause: false, text: 'Notice that each line item carries its designated Analytic Account mapped to Income. With a single click on Create Invoice, our system generates a new Customer Invoice.' },
      { isPause: true, text: '[PAUSE: 2s — click Create Invoice, let invoice screen appear]' },
      { isPause: false, text: 'The invoice number is sequenced automatically. All partner data, line items, and prices transfer without re-entry. Notice this badge in the header: clicking it takes you right back to the originating Sales Order.' },
      { isPause: true, text: '[PAUSE: 2s — click Approve & Post]' },
      { isPause: false, text: 'As soon as the invoice is confirmed, our automated accounting listener triggers. Behind the scenes, it immediately posts a balanced double-entry transaction: Debiting our Debtors Account and crediting our Sales Income Account.' },
      { isPause: true, text: '[PAUSE: 2s — click Print / Vector PDF button]' },
      { isPause: false, text: 'We can immediately generate and print a GST-compliant vector PDF invoice, complete with line-by-line tax computations, HSN codes, and payment instructions."' },
    ],
  });

  // =========================================================================
  // PAGE 4: SCENE 06 & SCENE 07
  // =========================================================================
  forcePageBreak();

  renderSceneCard({
    sceneNum: 'SCENE 06',
    title: 'Procurement Workflow: PO -> Vendor Bill -> Purchase GL Entry -> Settlement',
    timeCode: '06:00 - 07:15',
    route: '/purchase-orders -> /bills',
    description: 'Raw material procurement, automated bill creation with default Purchase A/c, and settlement',
    actions: [
      'In sidebar under Purchase, click "Purchase Order"; open order PO-2026-0001 for Timber Craft Ltd.',
      'Click "Create Bill"; observe seamless transition into Vendor Bill (BILL/2026/0001).',
      'Show Bill Reference field (ABC-26-001) and origin PO badge button.',
      'Highlight that lines automatically default Chart of Accounts to "Purchase Expense A/c".',
      'Click "Approve & Post"; show automated GL posting: Debit Purchase Expense, Credit Creditors.',
      'Click "Pay" on the bill; verify pre-filled Vendor, Amount Due, select Bank, and confirm settlement.',
      'Show bill status instantly update to green PAID badge with Balance Due at Rs. 0.00.',
    ],
    dialogueParagraphs: [
      { isPause: false, text: '"Now let us turn to procurement: raw timber and hardware sourcing.' },
      { isPause: true, text: '[PAUSE: 1s — click Purchase Order in the sidebar]' },
      { isPause: false, text: 'Opening our Purchase Order, we click Create Bill.' },
      { isPause: true, text: '[PAUSE: 2s — click Create Bill, show the bill form]' },
      { isPause: false, text: 'As specified in our Excalidraw design, the Vendor Bill automatically assigns the default Purchase Expense Account to each line. The vendor details and agreed pricing are carried over, and a badge provides a permanent reference back to the original Purchase Order.' },
      { isPause: true, text: '[PAUSE: 2s — click Approve & Post]' },
      { isPause: false, text: 'Upon confirming the bill, our double-entry engine posts an automatic journal: Debiting Purchase Expense and crediting Creditors Liability.' },
      { isPause: true, text: '[PAUSE: 2s — click the PAY button on the bill]' },
      { isPause: false, text: 'When the accounts department issues payment, clicking Pay opens our settlement modal. The partner name, due amount, and outbound payment classification are auto-populated. We select Bank, enter an optional reference note, and confirm.' },
      { isPause: true, text: '[PAUSE: 2s — confirm payment and show the green PAID status badge]' },
      { isPause: false, text: 'The invoice status updates to Paid, the balance due drops to zero, and the bank ledger reflects the disbursement."' },
    ],
  });

  renderSceneCard({
    sceneNum: 'SCENE 07',
    title: 'General Ledger Audit & Core Financial Statements (P&L, Balance Sheet)',
    timeCode: '07:15 - 08:30',
    route: '/journal, /reports/profit-loss, /reports/balance-sheet',
    description: 'Double-entry parity validation, Fiscal Year Profit & Loss statement, and balanced Balance Sheet',
    actions: [
      'Navigate to /journal; inspect list of entries showing Entry No, Date, Partner, and Status (Posted).',
      'Open an entry; highlight strict debit/credit equality (Total Debit = Total Credit = Rs. 10,500).',
      'Point out the core rule: blocking validation prevents unbalanced entry submission.',
      'Navigate to /reports/profit-loss; review Income, Income from Sales, Expenses, and Net Income.',
      'Navigate to /reports/balance-sheet; review Assets (Bank, Debtors) vs Liabilities & Equity (Creditors, Capital).',
      'Point out the verified bottom line: Total Assets == Total Liabilities & Equity (Balanced: Rs. 0.00).',
    ],
    dialogueParagraphs: [
      { isPause: false, text: '"Let us look under the hood at the General Ledger.' },
      { isPause: true, text: '[PAUSE: 1s — click Journal Entries in the sidebar]' },
      { isPause: false, text: 'Every transaction in the system creates an immutable double-entry journal entry. Notice how every single entry enforces strict parity: Total Debits must equal Total Credits down to the paisa. Our system throws a blocking validation if unbalanced entries are attempted.' },
      { isPause: true, text: '[PAUSE: 2s — click Profit and Loss in the sidebar]' },
      { isPause: false, text: 'Now, let us review our core financial statements. Here is the Profit & Loss Report for FY 2026, matching our blueprint formulas precisely: Total Operating Income, broken down by Sales Income; Total Operating Expenses, broken down by Purchase and Operational costs; yielding our Net Income.' },
      { isPause: true, text: '[PAUSE: 2s — click Balancesheet in the sidebar]' },
      { isPause: false, text: 'And here is the Balance Sheet. On the left: our Liquid Bank balances, Petty Cash, and Debtors. On the right: Creditors, Statutory GST Liabilities, and Equity Capital. Look at the verification banner at the bottom: Total Assets strictly match Total Liabilities and Equity. The entire chart of accounts is fully balanced."' },
    ],
  });

  // =========================================================================
  // PAGE 5: PART 2 BANNER + SCENE 08 + SCENE 09
  // =========================================================================
  forcePageBreak();

  // Draw Part 2 Banner
  drawSectionBanner('PART 2', 'Advanced Implementations: 3D Joinery Studio & Razorpay Gateway', true);

  renderSceneCard({
    sceneNum: 'SCENE 08',
    title: '3D Workshop & Joinery Studio: Real-Time Parametric 3D to ERP',
    timeCode: '08:30 - 10:15',
    route: '/workshop',
    description: 'Procedural 3D visualizer, wood species/fabrics, parametric dimension sliders, and live ERP PO generation',
    actions: [
      'In sidebar under Overview & Studio, click "3D Workshop Studio" (/workshop).',
      'Toggle 3D perspective modes: Isometric, Front Elevation, Top View, and AR Room Preview.',
      'Switch between models: Executive Teak Desk, Woodcraft Chair, Heritage Dining Table, Lounge Armchair.',
      'Select wood finishes: Burmese Teak, English Oak, American Walnut, Rosewood; watch color & grain update.',
      'Select upholstery swatches: Cognac Leather, Emerald Velvet, Charcoal Bouclé.',
      'Adjust Width, Depth, Height sliders; demonstrate real-time parametric price, cost, GST, and margin recalculation.',
      'Click "Procure Custom Timber & Specs (PO)"; show automatic PO generation with exact 3D specs pre-filled!',
    ],
    dialogueParagraphs: [
      { isPause: false, text: '"Now, let us unveil our major innovation beyond standard accounting: the 3D Workshop & Joinery Studio.' },
      { isPause: true, text: '[PAUSE: 2s — let the studio interface load]' },
      { isPause: false, text: 'In the furniture industry, clients rarely buy generic SKUs off a shelf. They commission custom timber furniture with bespoke dimensions. Usually, this creates an operational disconnect between designers and the accounting department. We bridged this gap completely.' },
      { isPause: true, text: '[PAUSE: 2s — click Front view, then Top view, then back to Isometric]' },
      { isPause: false, text: 'On the left is our procedural 3D visualizer with multiple perspective views, including an Augmented Reality room mode.' },
      { isPause: true, text: '[PAUSE: 2s — click through American Walnut and Indian Rosewood]' },
      { isPause: false, text: 'On the right, clients or sales engineers configure the piece in real time. We select our architectural timber—Burmese Teak, American Walnut, or Ebonized Ash—and pair it with premium Italian leather or Emerald Velvet upholstery.' },
      { isPause: true, text: '[PAUSE: 2s — adjust width and depth sliders]' },
      { isPause: false, text: 'Watch what happens as I adjust the width, depth, and height sliders. Our parametric pricing engine recalculates the raw material consumption factor, labor overhead, GST tax liability, and projected gross profit margin in real time!' },
      { isPause: true, text: '[PAUSE: 2s — click Procure Custom Timber & Specs (PO)]' },
      { isPause: false, text: 'And here is the magic: with one click on Procure Custom Timber, our 3D configurator converts these physical dimensions directly into a live Purchase Order in the backend! Wood species, millimeter dimensions, and material costs are transferred directly into procurement lines ready for vendor dispatch."' },
    ],
  });

  renderSceneCard({
    sceneNum: 'SCENE 09',
    title: 'Razorpay Payment Gateway, Webhooks & Automated GL Reconciliation',
    timeCode: '10:15 - 11:30',
    route: '/invoices, /portal, /payments',
    description: 'Embedded Razorpay checkout modal, webhook callbacks, automated GL reconciliation, and treasury ledger',
    actions: [
      'Open an approved unpaid invoice; click the "Pay via Razorpay" button to launch the checkout modal.',
      'Show the branded checkout: Merchant Name ("Urban Furniture"), invoice reference, and amount.',
      'Demonstrate the "Mock Sandbox Mode" toggle for friction-free evaluation without external credentials.',
      'Click "Simulate Successful Payment"; watch the animated spinner and green payment confirmation check.',
      'Navigate to /journal; show newly generated journal entry: Debit Bank Checking (1111), Credit Debtors (1121).',
      'Navigate to /payments -> "Transaction Ledger" tab; review gateway fees, order ID, and refund action.',
    ],
    dialogueParagraphs: [
      { isPause: false, text: '"The second major enhancement is full Razorpay Payment Gateway Integration directly coupled to our accounting engine.' },
      { isPause: true, text: '[PAUSE: 2s — click Pay via Razorpay on an invoice]' },
      { isPause: false, text: 'When a client is ready to settle an invoice or place an advance deposit, they launch our embedded Razorpay checkout modal.' },
      { isPause: true, text: '[PAUSE: 2s — point out the Razorpay modal elements]' },
      { isPause: false, text: 'Our backend initiates a secure order via the Razorpay API, generates a cryptographic payment order token, and registers the transaction. The gateway supports Cards, UPI, NetBanking, and carries a built-in sandbox mock mode for continuous CI/CD evaluation.' },
      { isPause: true, text: '[PAUSE: 2s — click Simulate Successful Payment, watch green success checkmark]' },
      { isPause: false, text: 'Payment is verified! When the webhook or signature callback arrives at our Laravel API, it doesn\'t just toggle a database flag. It initiates automated financial reconciliation:' },
      { isPause: true, text: '[PAUSE: 2s — navigate to Journal Entries to show the entry]' },
      { isPause: false, text: 'It immediately books a balanced journal entry—debiting our Bank Checking Account and crediting Accounts Receivable, instantaneously clearing the balance due on the invoice.' },
      { isPause: true, text: '[PAUSE: 2s — navigate to Payments -> Transaction Ledger tab]' },
      { isPause: false, text: 'Furthermore, under our Treasury Ledger, finance managers can inspect gateway settlement logs, track platform fees, and trigger automated Razorpay refunds whenever an order is cancelled."' },
    ],
  });

  // =========================================================================
  // PAGE 6: SCENE 10, SCENE 11 & PRO RECORDING DIRECTIVES
  // =========================================================================
  forcePageBreak();

  renderSceneCard({
    sceneNum: 'SCENE 10',
    title: 'Client Self-Service Portal & Contact-Scoped RBAC Isolation',
    timeCode: '11:30 - 12:30',
    route: '/portal',
    description: 'Customer Portal wireframe: data isolation, outstanding dues widget, and 1-click Razorpay settlement',
    actions: [
      'In top right dropdown, log out and click "Contact" Demo Login (user@example.com).',
      'Land on /portal; highlight that internal accounting menus (COA, Journal Entries, Admin) are hidden by RBAC.',
      'Show the top banner: "Welcome, Joey Wills" and live Outstanding Dues counter.',
      'Review table columns matching Excalidraw: Document No, Issue Date, Due Date, Total, Balance, Status, Action.',
      'Point out settled invoices with green "Paid" badge and open invoices with purple "Pay Now" button.',
      'Click "Pay Now"; complete quick settlement; observe table row flip from "Pay Now" to "Paid" without reload!',
    ],
    dialogueParagraphs: [
      { isPause: false, text: '"Now let us observe the system from the customer\'s perspective through our Client Self-Service Portal.' },
      { isPause: true, text: '[PAUSE: 2s — log in as user@example.com and land on /portal]' },
      { isPause: false, text: 'Notice the strict Role-Based Access Control in action. Internal ledgers, journal entries, and financial reports have vanished from the sidebar. The user sees only their own commercial ecosystem.' },
      { isPause: true, text: '[PAUSE: 2s — point to Outstanding Dues widget and invoice table]' },
      { isPause: false, text: 'This view directly implements the Customer Invoice Portal View wireframe from our documentation. Customers see only the invoices tied to their partner ID.' },
      { isPause: true, text: '[PAUSE: 2s — point to Paid vs Pay Now buttons]' },
      { isPause: false, text: 'Settled invoices display as Paid, while invoices with an outstanding balance feature an actionable Pay Now button.' },
      { isPause: true, text: '[PAUSE: 2s — click Pay Now, complete payment, and watch table update]' },
      { isPause: false, text: 'Clicking Pay Now activates the Razorpay gateway. Upon successful completion, the invoice status immediately flips to Paid, giving clients instant confirmation and peace of mind."' },
    ],
  });

  renderSceneCard({
    sceneNum: 'SCENE 11',
    title: 'Universal Innovations, Architecture Polish & Outro',
    timeCode: '12:30 - 13:30',
    route: '/ (Dashboard Admin Login)',
    description: 'Dual-theme engine, universal field filtering, infinite scroll with shimmer skeletons, and wrap-up',
    actions: [
      'Re-authenticate as Admin (admin@example.com) to restore full operational visibility.',
      'Click the Sun/Moon icon in top navbar to demonstrate full-app Light Mode, then toggle back to Dark Mode.',
      'Navigate to Invoices or Bills; click "Filter" to show universal field-level multi-column filter inputs.',
      'Scroll down to demonstrate infinite scroll with obsidian shimmer skeletons and instant page-up.',
      'Point to the live WebSocket indicator in header, then return to Dashboard for final wrap-up statement.',
    ],
    dialogueParagraphs: [
      { isPause: false, text: '"Finally, let us highlight the architectural polish that unifies this system.' },
      { isPause: true, text: '[PAUSE: 2s — toggle Light Mode, let screen render, then toggle back to Dark Mode]' },
      { isPause: false, text: 'Every view is wrapped in our dual-theme engine—supporting high-contrast daylight operations and our signature Obsidian dark mode.' },
      { isPause: true, text: '[PAUSE: 2s — open field filter bar on Invoices page]' },
      { isPause: false, text: 'Across all 17 operational modules, users have universal field-level filtering, column sorting, and infinite scroll with shimmer skeletons, handling thousands of records with zero UI lag.' },
      { isPause: true, text: '[PAUSE: 2s — navigate back to main Dashboard]' },
      { isPause: false, text: 'In summary, the Urban Furniture Accounting System goes beyond standard bookkeeping: It strictly fulfills every requirement of the Excalidraw accounting blueprint: double-entry integrity, analytical budgets with revision history, and seamless PO/SO transitions. It innovates with an interactive 3D Workshop Studio that connects bespoke industrial design directly to ERP manufacturing orders. And it closes the cash loop with fully automated Razorpay reconciliation and self-service customer portals. Thank you for your time, and we look forward to your questions!' },
      { isPause: true, text: '[PAUSE: 3s — hold on Dashboard view, fade to black]' },
    ],
  });

  // Pro Recording Tips Card on Page 6
  doc.setFillColor(C_BG_CARD[0], C_BG_CARD[1], C_BG_CARD[2]);
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
  doc.setLineWidth(0.75);
  doc.roundedRect(marginLeft, currY, contentWidth, 76, 4, 4, 'FD');

  doc.setFillColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
  doc.rect(marginLeft, currY, 3, 76, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
  doc.text('PRO RECORDING DIRECTIVES & VERIFICATION CHECKLIST', marginLeft + 10, currY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(C_BODY[0], C_BODY[1], C_BODY[2]);
  doc.text('1. Audio Cadence: Keep tone brisk during simple navigation, and deliberately pause during timed gaps to let numbers sink in.', marginLeft + 10, currY + 26);
  doc.text('2. Mouse Cursor: Keep cursor deliberate; point directly at the active UI card or button being narrated before clicking.', marginLeft + 10, currY + 38);
  doc.text('3. Display Scaling: Set display scaling to 100% at 1920x1080 to ensure sharp vector typography across all 17 modules.', marginLeft + 10, currY + 50);
  doc.text('4. Live Seed Data: Database is seeded with 250+ realistic records across contacts, orders, invoices, and balanced journal entries.', marginLeft + 10, currY + 62);

  // --- Running Headers & Footers on all pages ---
  const totalPages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running Header (pages 2+)
    if (i > 1) {
      doc.setFillColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
      doc.rect(0, 0, pageWidth, 3.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
      doc.text('URBAN FURNITURE ACCOUNTING SYSTEM', marginLeft, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
      doc.text('OFFICIAL DEMO VIDEO RECORDING SCRIPT', pageWidth - marginRight, 20, { align: 'right' });

      doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
      doc.setLineWidth(0.5);
      doc.line(marginLeft, 25, pageWidth - marginRight, 25);
    }

    // Running Footer (all pages)
    const footerY = pageHeight - 18;
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, footerY - 7, pageWidth - marginRight, footerY - 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
    doc.text('Odoo Hackathon 2026', marginLeft, footerY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
    doc.text(' •  Excalidraw Accounting Architecture + 3D Studio & Razorpay', marginLeft + 80, footerY + 5);

    doc.text(
      `Page ${i} of ${totalPagesExp}`,
      pageWidth - marginRight,
      footerY + 5,
      { align: 'right' }
    );
  }

  doc.putTotalPages(totalPagesExp);

  const outDir = path.resolve(__dirname, '../docs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'Urban_Furniture_Accounting_Demo_Script.pdf');
  const pdfBytes = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outPath, pdfBytes);

  console.log(`PDF successfully generated: ${outPath} (${pdfBytes.length} bytes, ${totalPages} pages)`);
}

createScriptPdf();

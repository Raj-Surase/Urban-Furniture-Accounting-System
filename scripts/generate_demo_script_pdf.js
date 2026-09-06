const { jsPDF } = require('../frontend/node_modules/jspdf');
const fs = require('fs');
const path = require('path');

function createScriptPdf() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const totalPagesExp = '{total_pages_count_string}';

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 40;
  const marginRight = 40;
  const contentWidth = pageWidth - marginLeft - marginRight; // 515.28 pt
  const marginTop = 48;
  const marginBottom = 44;

  let currY = marginTop;

  // Colors
  const C_INDIGO = [79, 70, 229];      // #4F46E5
  const C_VIOLET = [124, 58, 237];     // #7C3AED
  const C_EMERALD = [13, 148, 136];    // #0D9488 (Teal/Emerald)
  const C_DARK = [15, 23, 42];         // #0F172A
  const C_BODY = [51, 65, 85];         // #334155
  const C_MUTED = [100, 116, 139];     // #64748B
  const C_BORDER = [226, 232, 240];    // #E2E8F0
  const C_BG_CARD = [248, 250, 252];   // #F8FAFC
  const C_SPEECH_BG = [245, 243, 255]; // #F5F3FF (Light lavender)
  const C_AMBER = [180, 83, 9];        // #B45309 (Pause text)

  function checkPageBreak(neededHeight) {
    if (currY + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      currY = marginTop + 10;
      return true;
    }
    return false;
  }

  function drawTopAccent() {
    doc.setFillColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
    doc.rect(0, 0, pageWidth, 5, 'F');
  }

  // --- Document Header ---
  drawTopAccent();

  // Top Org & Event Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
  doc.text('URBAN FURNITURE ACCOUNTING SYSTEM  •  ODOO HACKATHON 2026', marginLeft, currY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
  doc.text('OFFICIAL DEMO VIDEO PRODUCTION SCRIPT', pageWidth - marginRight, currY, { align: 'right' });
  currY += 14;

  // Main Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
  doc.text('Master Video Demo Recording Script', marginLeft, currY);
  currY += 16;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
  doc.text('Page-to-Page Operational Walkthrough: Descriptions, Actions, Timed Gaps & Technical Architecture', marginLeft, currY);
  currY += 14;

  // Metadata Card
  doc.setFillColor(C_BG_CARD[0], C_BG_CARD[1], C_BG_CARD[2]);
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
  doc.setLineWidth(0.75);
  doc.roundedRect(marginLeft, currY, contentWidth, 54, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
  doc.text('Target Runtime:', marginLeft + 12, currY + 16);
  doc.text('Stack Architecture:', marginLeft + 12, currY + 30);
  doc.text('Blueprint Specs:', marginLeft + 12, currY + 44);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C_BODY[0], C_BODY[1], C_BODY[2]);
  doc.text('12 to 15 Minutes (11 Structured Scenes with Timed Speaking Gaps)', marginLeft + 90, currY + 16);
  doc.text('Laravel 13 REST API (Sanctum + RBAC) | React 18 (Vite + TypeScript) | Node.js Socket.io | SQLite', marginLeft + 90, currY + 30);
  doc.text('Full implementation of docs/Accounting Hackathon - 24 Hours.excalidraw + 3D Studio & Razorpay', marginLeft + 90, currY + 44);

  // Right side of card: recording setup
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
  doc.text('Display Setup:', pageWidth - marginRight - 140, currY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C_BODY[0], C_BODY[1], C_BODY[2]);
  doc.text('1920x1080 Full HD (100% Zoom)', pageWidth - marginRight - 70, currY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
  doc.text('Default Theme:', pageWidth - marginRight - 140, currY + 30);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C_BODY[0], C_BODY[1], C_BODY[2]);
  doc.text('Obsidian Dark Mode (with Light toggle)', pageWidth - marginRight - 70, currY + 30);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
  doc.text('Presenter:', pageWidth - marginRight - 140, currY + 44);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C_BODY[0], C_BODY[1], C_BODY[2]);
  doc.text('Full-Stack Lead / Solutions Architect', pageWidth - marginRight - 70, currY + 44);

  currY += 68;

  // --- Production Timeline Matrix Table ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
  doc.text('PRODUCTION TIMELINE & SCENE MAP', marginLeft, currY);
  currY += 10;

  // Table Header
  const colX = [marginLeft, marginLeft + 48, marginLeft + 115, marginLeft + 235];
  const colW = [48, 67, 120, contentWidth - 235];

  doc.setFillColor(C_DARK[0], C_DARK[1], C_DARK[2]);
  doc.rect(marginLeft, currY, contentWidth, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SCENE', colX[0] + 6, currY + 12);
  doc.text('TIMECODE', colX[1] + 6, currY + 12);
  doc.text('MODULE / ROUTE', colX[2] + 6, currY + 12);
  doc.text('PRIMARY OPERATIONS & FOCUS', colX[3] + 6, currY + 12);
  currY += 18;

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
    doc.rect(marginLeft, currY, contentWidth, 14, 'F');
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, currY + 14, marginLeft + contentWidth, currY + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
    doc.text(row[0], colX[0] + 6, currY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
    doc.text(row[1], colX[1] + 6, currY + 10);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
    doc.text(row[2], colX[2] + 6, currY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(C_BODY[0], C_BODY[1], C_BODY[2]);
    doc.text(row[3], colX[3] + 6, currY + 10);

    currY += 14;
  });

  currY += 16;

  // --- Helper to draw Section Header ---
  function drawSectionHeader(partNum, title, subtitle, isEmerald = false) {
    checkPageBreak(45);
    const color = isEmerald ? C_EMERALD : C_INDIGO;

    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(marginLeft, currY, 4, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(partNum.toUpperCase(), marginLeft + 10, currY + 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
    doc.text(title, marginLeft + 10, currY + 23);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
      doc.text(subtitle, marginLeft + 10, currY + 33);
      currY += 40;
    } else {
      currY += 34;
    }
  }

  // --- Helper to render a Scene ---
  function renderScene({
    sceneNum,
    title,
    timeCode,
    route,
    description,
    actions,
    dialogue,
  }) {
    // Measure total space needed
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitDialogue = doc.splitTextToSize(dialogue, contentWidth - 32);
    const dialogueHeight = splitDialogue.length * 10.5 + 24;

    const actionHeight = actions.length * 12 + 26;
    const estHeight = 40 + actionHeight + dialogueHeight;

    // Check if we need a new page for the scene header
    checkPageBreak(65);

    // Scene Header Bar
    doc.setFillColor(C_BG_CARD[0], C_BG_CARD[1], C_BG_CARD[2]);
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
    doc.setLineWidth(0.75);
    doc.roundedRect(marginLeft, currY, contentWidth, 26, 4, 4, 'FD');

    // Accent line on left of scene header
    doc.setFillColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
    doc.rect(marginLeft, currY, 3.5, 26, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
    doc.text(`${sceneNum}: ${title}`, marginLeft + 10, currY + 16);

    // Timecode badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
    doc.text(`[ ${timeCode} ]`, pageWidth - marginRight - 12, currY + 16, { align: 'right' });

    currY += 31;

    // Route & Description line
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
    doc.text('Route:', marginLeft + 4, currY + 8);

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(marginLeft + 36, currY, doc.getTextWidth(route) + 12, 12, 2, 2, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
    doc.text(route, marginLeft + 42, currY + 8.5);

    const routeOffset = marginLeft + 36 + doc.getTextWidth(route) + 20;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
    doc.text(`Context: ${description}`, routeOffset, currY + 8);
    currY += 16;

    // Actions Box
    checkPageBreak(actionHeight);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(marginLeft, currY, contentWidth, actionHeight, 3, 3, 'FD');

    doc.setFillColor(236, 253, 245); // Light emerald
    doc.rect(marginLeft, currY, contentWidth, 14, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(4, 120, 87); // Emerald dark
    doc.text('EXACT ACTIONS TO PERFORM WHILE SPEAKING', marginLeft + 8, currY + 10);

    let actionY = currY + 22;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(C_BODY[0], C_BODY[1], C_BODY[2]);

    actions.forEach((act, idx) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
      doc.text(`${idx + 1}.`, marginLeft + 10, actionY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(C_BODY[0], C_BODY[1], C_BODY[2]);
      doc.text(act, marginLeft + 24, actionY);
      actionY += 12;
    });

    currY += actionHeight + 6;

    // Dialogue / Spoken Script Box
    checkPageBreak(dialogueHeight);
    doc.setFillColor(C_SPEECH_BG[0], C_SPEECH_BG[1], C_SPEECH_BG[2]);
    doc.setDrawColor(221, 214, 254); // Lavender border
    doc.setLineWidth(0.75);
    doc.roundedRect(marginLeft, currY, contentWidth, dialogueHeight, 4, 4, 'FD');

    // Left Violet border stripe
    doc.setFillColor(C_VIOLET[0], C_VIOLET[1], C_VIOLET[2]);
    doc.rect(marginLeft, currY, 3, dialogueHeight, 'F');

    // Dialogue Title Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(C_VIOLET[0], C_VIOLET[1], C_VIOLET[2]);
    doc.text('SPOKEN DIALOGUE & TIMED GAPS', marginLeft + 10, currY + 12);

    let speechY = currY + 22;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);

    splitDialogue.forEach((line) => {
      // Highlight pause lines if line contains [PAUSE:
      if (line.includes('[PAUSE:')) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(C_AMBER[0], C_AMBER[1], C_AMBER[2]);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
      }
      doc.text(line, marginLeft + 12, speechY);
      speechY += 10.5;
    });

    currY += dialogueHeight + 16;
  }

  // ==========================================
  // PART 1: EXCALIDRAW CORE ACCOUNTING LIFECYCLE
  // ==========================================
  drawSectionHeader(
    'PART 1',
    'Core Accounting Operations & Excalidraw Specification Flow',
    'Strict implementation of the 24-Hour Hackathon Architecture: Auth, Masters, Budgets, SO/PO, GL & Reports'
  );

  renderScene({
    sceneNum: 'SCENE 01',
    title: 'System Overview, Architecture & RBAC Setup',
    timeCode: '00:00 - 00:50',
    route: '/login',
    description: 'Login Page with Instant Demo Logins, animated logo, and system branding',
    actions: [
      'Hover mouse over the animated Urban Furniture Accounting System brand mark and tagline.',
      'Pan cursor across the three 1-Click Instant Demo Login cards: Admin, Accountant, and Contact.',
      'Click "Forgot Password?" to display the credential recovery modal, highlight helper text, and dismiss.',
      'Click the "Sign Up" link at the bottom right to navigate seamlessly to the registration screen.',
    ],
    dialogue: `"Hello everyone, and welcome to the official demonstration of the Urban Furniture Accounting System, engineered for the 2026 Odoo Hackathon. Urban Furniture is a high-volume manufacturing and civic contracting enterprise. Managing bespoke architectural woodwork alongside rigid double-entry financial standards requires more than a simple ledger—it demands end-to-end operational traceability. [PAUSE: 2s - let viewer absorb login view] Our stack is engineered for speed, strict double-entry integrity, and real-time agility. The backend is built on a Laravel 13 REST API with Sanctum authentication, fine-grained Role-Based Access Control, and zero-config SQLite persistence. On the frontend, we have React 18 with TypeScript, Vite, Tailwind CSS, HeroUI, and Framer Motion. Furthermore, a standalone Node.js Socket.io server broadcasts live ledger events across all active clients. [PAUSE: 2s - hover over demo pills] Notice the Instant 1-Click Demo Login buttons on the login screen. We have pre-configured three distinct RBAC personas: Admin with full master data and ledger authority; Accountant for financial reporting and reconciliation; and Contact representing client portal isolation. Let us first review our registration security."`,
  });

  renderScene({
    sceneNum: 'SCENE 02',
    title: 'Strict Authentication & Sign-Up Validations',
    timeCode: '00:50 - 01:45',
    route: '/register',
    description: 'Registration form with strict character limits, regex checks, and parity controls',
    actions: [
      'Type short login ID "abc" in the Login ID field to show character constraint feedback.',
      'Enter mismatched passwords ("pass1" vs "pass2") to demonstrate instant confirmation validation.',
      'Type valid entries: Login ID "odoo_lead", Password "Urban@2026!", meeting all security criteria.',
      'Hover over password tooltip: mandatory uppercase, lowercase, digit, and special character.',
      'Click "Return to Sign In", and on /login click the "Admin" Demo Login button (admin@example.com).',
    ],
    dialogue: `"As laid out in our Excalidraw blueprint, user onboarding adheres to enterprise security standards. [PAUSE: 1s - click into Login ID field] The Login ID is strictly enforced between 6 and 12 alphanumeric characters. Furthermore, our password engine mandates a minimum of eight characters containing an uppercase letter, a lowercase letter, a digit, and a special symbol, backed by strict confirmation parity. [PAUSE: 2s - click Return to Sign In, then click Admin Demo button] Now, let us authenticate with one click as the System Administrator and step directly into the live operations dashboard."`,
  });

  renderScene({
    sceneNum: 'SCENE 03',
    title: 'Master Settings: Contacts, Products, COA & Journals',
    timeCode: '01:45 - 03:00',
    route: '/contacts, /products, /accounts, /journals',
    description: 'Unified Contact Master, Product Master (Goods/Service/Combo), COA, and Journals',
    actions: [
      'On Dashboard, point out the green Socket.io "Connected" badge and top Excalidraw operational cards.',
      'Click "Contact Master" in sidebar; toggle between dense List View and Kanban card view.',
      'Open contact "Joey Wills" to show Form View: Street, City, State, Country, Pincode, and avatar.',
      'Click "Product Master"; show items categorized as Goods, Service, Combo with Sales & Cost prices.',
      'Click "Chart of Accounts"; review pre-configured Asset, Liability, Capital, Income, and Expense codes.',
      'Click "Journals"; display pre-configured Sales, Purchase, Bank, and Cash journals with linked accounts.',
    ],
    dialogue: `"We land on the executive dashboard. In the top navbar, our WebSocket indicator confirms real-time bidirectional synchronization with our Node.js broadcast service. [PAUSE: 2s - glance over Sales, Purchase, and Budget summary cards] To support an accounting ERP, foundational master data must be pristine. Let us review the four core settings specified in our wireframe. [PAUSE: 1s - click Contact Master in sidebar] First, our Contact Master. The system unifies customers, suppliers, and municipal clients in a single directory. We can toggle seamlessly between a dense tabular list and an intuitive Kanban card view. [PAUSE: 2s - click Kanban toggle, then click Joey Wills] Clicking any contact loads their full form profile—including complete billing addresses, state, GST jurisdiction, and pincode. [PAUSE: 1s - click Product Master in sidebar] Next is the Product Master. Here we manage our street and commercial furniture lines: Teak Benches, Ergonomic Chairs, and Modular Shelving. Each product is classified as Goods, Services, or Combos, with its default sales price and cost of goods sold. Categories can be created on-the-fly directly from the entry form. [PAUSE: 2s - click Chart of Accounts in sidebar] Under Chart of Accounts, every ledger account adheres to standard Indian Accounting & GST norms: Asset accounts like Bank and Accounts Receivable; Liability accounts like Creditors; Equity Capital; Sales Income; and Purchase Expenses. [PAUSE: 1s - click Journals in sidebar] And finally, the Journals Master. All transactions flow through dedicated journals—Sales, Purchase, Bank, and Cash—automatically pre-configured with their default debit and credit offset accounts."`,
  });

  renderScene({
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
      'Click directly on the Achieved Amount ₹ value to trigger the real-time Drill-Down Modal of invoices.',
    ],
    dialogue: `"Now let us explore one of the crowning features of our Excalidraw blueprint: Analytical Budgeting and Cost Center Tracking. [PAUSE: 2s - open January 2026 budget detail] Every budget is assigned a Responsible partner and a designated accounting timeframe. Inside the budget lines, we link directly to our Analytic Accounts—such as Project 1 or Furniture Operations. [PAUSE: 2s - move cursor over Committed Amount, Achieved Amount, and Achieved %] Notice the dynamic mathematical formulas running in real time: Achieved Percentage equals Achieved Amount divided by Committed Amount times 100. Amount to Achieve calculates the remaining variance. [PAUSE: 2s - hover over the Revise action button and Revision metadata banner] As mandated by our specification, when a project scope changes, an accountant does not overwrite an existing audit trail. Clicking Revise archives the current budget into Revised state, creates a linked child budget titled January 2026 Revised, and establishes bidirectional hyperlinks between both records. [PAUSE: 2s - click on the Achieved Amount ₹ value to trigger the drill-down modal] And look at this: clicking directly on the Achieved Amount opens an instant transaction audit modal! It queries every vendor bill and sales invoice carrying this analytic account within the budget date range, giving financial controllers instantaneous visibility."`,
  });

  renderScene({
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
    dialogue: `"Next, let us execute the primary commercial workflow: from quote to cash. [PAUSE: 1s - click Sales order in the sidebar] Here in Sales Orders, we have our customer orders. Let us open an order for Mr. Rahul. [PAUSE: 2s - point out the line items and the linked Analytic Account] Notice that each line item carries its designated Analytic Account mapped to Income. With a single click on Create Invoice, our system generates a new Customer Invoice. [PAUSE: 2s - click Create Invoice, let the invoice screen appear] The invoice number is sequenced automatically. All partner data, line items, and prices transfer without re-entry. Notice this badge in the header: clicking it takes you right back to the originating Sales Order. [PAUSE: 2s - click Approve & Post] As soon as the invoice is confirmed, our automated accounting listener triggers. Behind the scenes, it immediately posts a balanced double-entry transaction: Debiting our Debtors Account and crediting our Sales Income Account. [PAUSE: 2s - click Print / Vector PDF button] We can immediately generate and print a GST-compliant vector PDF invoice, complete with line-by-line tax computations, HSN codes, and payment instructions."`,
  });

  renderScene({
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
      'Show bill status instantly update to green PAID badge with Balance Due at ₹0.00.',
    ],
    dialogue: `"Now let us turn to procurement: raw timber and hardware sourcing. [PAUSE: 1s - click Purchase Order in the sidebar] Opening our Purchase Order, we click Create Bill. [PAUSE: 2s - click Create Bill, show the bill form] As specified in our Excalidraw design, the Vendor Bill automatically assigns the default Purchase Expense Account to each line. The vendor's details and agreed pricing are carried over, and a badge provides a permanent reference back to the original Purchase Order. [PAUSE: 2s - click Approve & Post] Upon confirming the bill, our double-entry engine posts an automatic journal: Debiting Purchase Expense and crediting Creditors Liability. [PAUSE: 2s - click the PAY button on the bill] When the accounts department issues payment, clicking Pay opens our settlement modal. The partner name, due amount, and outbound payment classification are auto-populated. We select Bank, enter an optional reference note, and confirm. [PAUSE: 2s - confirm payment and show the green PAID status badge] The invoice status updates to Paid, the balance due drops to zero, and the bank ledger reflects the disbursement."`,
  });

  renderScene({
    sceneNum: 'SCENE 07',
    title: 'General Ledger Audit & Core Financial Statements (P&L, Balance Sheet)',
    timeCode: '07:15 - 08:30',
    route: '/journal, /reports/profit-loss, /reports/balance-sheet',
    description: 'Double-entry parity validation, Fiscal Year Profit & Loss statement, and balanced Balance Sheet',
    actions: [
      'Navigate to /journal; inspect list of entries showing Entry No, Date, Partner, and Status (Posted).',
      'Open an entry; highlight strict debit/credit equality (Total Debit = Total Credit = ₹10,500).',
      'Point out the core rule: blocking validation prevents unbalanced entry submission.',
      'Navigate to /reports/profit-loss; review Income, Income from Sales, Expenses, and Net Income.',
      'Navigate to /reports/balance-sheet; review Assets (Bank, Debtors) vs Liabilities & Equity (Creditors, Capital).',
      'Point out the verified bottom line: Total Assets == Total Liabilities & Equity (Balanced: ₹0.00).',
    ],
    dialogue: `"Let us look under the hood at the General Ledger. [PAUSE: 1s - click Journal Entries in the sidebar] Every transaction in the system creates an immutable double-entry journal entry. Notice how every single entry enforces strict parity: Total Debits must equal Total Credits down to the paisa. Our system throws a blocking validation if unbalanced entries are attempted. [PAUSE: 2s - click Profit and Loss in the sidebar] Now, let us review our core financial statements. Here is the Profit & Loss Report for FY 2026, matching our blueprint formulas precisely: Total Operating Income, broken down by Sales Income; Total Operating Expenses, broken down by Purchase and Operational costs; yielding our Net Income. [PAUSE: 2s - click Balancesheet in the sidebar] And here is the Balance Sheet. On the left: our Liquid Bank balances, Petty Cash, and Debtors. On the right: Creditors, Statutory GST Liabilities, and Equity Capital. Look at the verification banner at the bottom: Total Assets strictly match Total Liabilities and Equity. The entire chart of accounts is fully balanced."`,
  });

  // ==========================================
  // PART 2: ADVANCED IMPLEMENTATIONS
  // ==========================================
  drawSectionHeader(
    'PART 2',
    'Advanced Implementations: 3D Joinery Studio & Razorpay Gateway',
    'Bespoke architectural furniture engineering meets instantaneous digital treasury settlement',
    true // Emerald accent
  );

  renderScene({
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
    dialogue: `"Now, let us unveil our major innovation beyond standard accounting: the 3D Workshop & Joinery Studio. [PAUSE: 2s - let the studio interface load] In the furniture industry, clients rarely buy generic SKUs off a shelf. They commission custom timber furniture with bespoke dimensions. Usually, this creates an operational disconnect between designers and the accounting department. We bridged this gap completely. [PAUSE: 2s - click Front view, then Top view, then back to Isometric] On the left is our procedural 3D visualizer with multiple perspective views, including an Augmented Reality room mode. [PAUSE: 2s - click through American Walnut and Indian Rosewood] On the right, clients or sales engineers configure the piece in real time. We select our architectural timber—Burmese Teak, American Walnut, or Ebonized Ash—and pair it with premium Italian leather or Emerald Velvet upholstery. [PAUSE: 2s - adjust the width and depth sliders] Watch what happens as I adjust the width, depth, and height sliders. Our parametric pricing engine recalculates the raw material consumption factor, labor overhead, GST tax liability, and projected gross profit margin in real time! [PAUSE: 2s - click Procure Custom Timber & Specs (PO)] And here is the magic: with one click on Procure Custom Timber, our 3D configurator converts these physical dimensions directly into a live Purchase Order in the backend! Wood species, millimeter dimensions, and material costs are transferred directly into procurement lines ready for vendor dispatch."`,
  });

  renderScene({
    sceneNum: 'SCENE 09',
    title: 'Razorpay Payment Gateway, Webhooks & Automated GL Reconciliation',
    timeCode: '10:15 - 11:30',
    route: '/invoices, /portal, /payments (Ledger)',
    description: 'Embedded Razorpay checkout modal, webhook callbacks, automated GL reconciliation, and treasury ledger',
    actions: [
      'Open an approved unpaid invoice; click the "Pay via Razorpay" button to launch the checkout modal.',
      'Show the branded checkout: Merchant Name ("Urban Furniture"), invoice reference, and amount.',
      'Demonstrate the "Mock Sandbox Mode" toggle for friction-free evaluation without external credentials.',
      'Click "Simulate Successful Payment"; watch the animated spinner and green payment confirmation check.',
      'Navigate to /journal; show newly generated journal entry: Debit Bank Checking (1111), Credit Debtors (1121).',
      'Navigate to /payments -> "Transaction Ledger" tab; review gateway fees, order ID, and refund action.',
    ],
    dialogue: `"The second major enhancement is full Razorpay Payment Gateway Integration directly coupled to our accounting engine. [PAUSE: 2s - click Pay via Razorpay on an invoice] When a client is ready to settle an invoice or place an advance deposit, they launch our embedded Razorpay checkout modal. [PAUSE: 2s - point out the Razorpay modal elements] Our backend initiates a secure order via the Razorpay API, generates a cryptographic payment order token, and registers the transaction. The gateway supports Cards, UPI, NetBanking, and carries a built-in sandbox mock mode for continuous CI/CD evaluation. [PAUSE: 2s - click Simulate Successful Payment, watch the green success modal checkmark] Payment is verified! When the webhook or signature callback arrives at our Laravel API, it doesn't just toggle a database flag. It initiates automated financial reconciliation: [PAUSE: 2s - navigate to Journal Entries to show the entry] It immediately books a balanced journal entry—debiting our Bank Checking Account and crediting Accounts Receivable, instantaneously clearing the balance due on the invoice. [PAUSE: 2s - navigate to Payments -> Transaction Ledger tab] Furthermore, under our Treasury Ledger, finance managers can inspect gateway settlement logs, track platform fees, and trigger automated Razorpay refunds whenever an order is cancelled."`,
  });

  renderScene({
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
    dialogue: `"Now let us observe the system from the customer's perspective through our Client Self-Service Portal. [PAUSE: 2s - log in as user@example.com and land on /portal] Notice the strict Role-Based Access Control in action. Internal ledgers, journal entries, and financial reports have vanished from the sidebar. The user sees only their own commercial ecosystem. [PAUSE: 2s - point to the Outstanding Dues widget and invoice table] This view directly implements the Customer Invoice Portal View wireframe from our documentation. Customers see only the invoices tied to their partner ID. [PAUSE: 2s - point to the Paid vs Pay Now buttons] Settled invoices display as Paid, while invoices with an outstanding balance feature an actionable Pay Now button. [PAUSE: 2s - click Pay Now, complete payment, and watch table update] Clicking Pay Now activates the Razorpay gateway. Upon successful completion, the invoice status immediately flips to Paid, giving clients instant confirmation and peace of mind."`,
  });

  renderScene({
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
    dialogue: `"Finally, let us highlight the architectural polish that unifies this system. [PAUSE: 2s - toggle Light Mode, let screen render, then toggle back to Dark Mode] Every view is wrapped in our dual-theme engine—supporting high-contrast daylight operations and our signature Obsidian dark mode. [PAUSE: 2s - open field filter bar on Invoices page] Across all 17 operational modules, users have universal field-level filtering, column sorting, and infinite scroll with shimmer skeletons, handling thousands of records with zero UI lag. [PAUSE: 2s - navigate back to the main Dashboard] In summary, the Urban Furniture Accounting System goes beyond standard bookkeeping: It strictly fulfills every requirement of the Excalidraw accounting blueprint: double-entry integrity, analytical budgets with revision history, and seamless PO/SO transitions. It innovates with an interactive 3D Workshop Studio that connects bespoke industrial design directly to ERP manufacturing orders. And it closes the cash loop with fully automated Razorpay reconciliation and self-service customer portals. Thank you for your time, and we look forward to your questions! [PAUSE: 3s - hold on Dashboard view, fade to black]"`,
  });

  // --- End-of-Document Cheat Sheet & Tips ---
  checkPageBreak(120);

  doc.setFillColor(C_BG_CARD[0], C_BG_CARD[1], C_BG_CARD[2]);
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
  doc.setLineWidth(0.75);
  doc.roundedRect(marginLeft, currY, contentWidth, 100, 4, 4, 'FD');

  doc.setFillColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
  doc.rect(marginLeft, currY, 3, 100, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
  doc.text('PRO RECORDING TIPS & DELIVERABLE CHECKLIST', marginLeft + 12, currY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(C_BODY[0], C_BODY[1], C_BODY[2]);
  doc.text('1. Audio Delivery: Maintain an energetic, confident tone during transitions, but deliberately pause during timed gaps to let numbers sink in.', marginLeft + 12, currY + 32);
  doc.text('2. Mouse Cursor: Keep cursor steady; avoid erratic circular movements. Point directly at the active UI card or button being narrated.', marginLeft + 12, currY + 46);
  doc.text('3. Display Scaling: Lock screen resolution to 1920x1080 at 100% DPI scaling to ensure crisp vector typography across all 17 modules.', marginLeft + 12, currY + 60);
  doc.text('4. Live Seed Data: Database is pre-seeded with 250+ realistic records across contacts, orders, invoices, and balanced journal entries.', marginLeft + 12, currY + 74);
  doc.text('5. WebSockets: Ensure Node server (port 3001) is running so the navbar shows the green "Connected" live synchronization badge.', marginLeft + 12, currY + 88);

  // --- Running Headers & Footers on all pages ---
  const totalPages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running Header (pages 2+)
    if (i > 1) {
      doc.setFillColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
      doc.rect(0, 0, pageWidth, 4, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
      doc.text('URBAN FURNITURE ACCOUNTING SYSTEM', marginLeft, 24);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
      doc.text('MASTER VIDEO DEMO RECORDING SCRIPT', pageWidth - marginRight, 24, { align: 'right' });

      doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
      doc.setLineWidth(0.5);
      doc.line(marginLeft, 30, pageWidth - marginRight, 30);
    }

    // Running Footer (all pages)
    const footerY = pageHeight - 24;
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, footerY - 8, pageWidth - marginRight, footerY - 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(C_INDIGO[0], C_INDIGO[1], C_INDIGO[2]);
    doc.text('Odoo Hackathon 2026', marginLeft, footerY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
    doc.text(' •  Excalidraw Accounting Architecture + 3D Studio & Razorpay', marginLeft + 90, footerY + 4);

    doc.text(
      `Page ${i} of ${totalPagesExp}`,
      pageWidth - marginRight,
      footerY + 4,
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

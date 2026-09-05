---
name: pdfcn
description: >-
  Use this skill when designing, building, generating, or styling PDF documents in React using pdfcn.
  Covers the pdfcn shadcn-compatible registry (@pdfcn), Takumi and Forme PDF rendering engines,
  pre-built blocks (invoices, reports), PDF UI components, theme presets, and shadcn MCP server workflows.
---

# pdfcn: React PDF Component Library & Registry

pdfcn is an open-source React component library for generating PDF documents using a copy-paste workflow powered by the shadcn registry format. It provides high-performance, customizable, and accessible PDF components without requiring headless Chrome.

---

## 1. Core Architecture & Engines

pdfcn supports two distinct rendering engines:

| Engine | Description | Import Primitives | Namespace |
| :--- | :--- | :--- | :--- |
| **Takumi** | High-performance Rust-backed PDF engine (`takumi-pdf`) | `Document, Page` from `@/components/pdf/pdf-primitives` | `@pdfcn/takumi/*` |
| **Forme** | HTML/React-based layout engine (`@formepdf/react`) | `Document, Page` from `@formepdf/react` | `@pdfcn/forme/*` |

Both engines use shared component APIs and theme providers:
```tsx
import { Document, Page } from "@/components/pdf/pdf-primitives"; // or @formepdf/react
import { PdfcnThemeProvider } from "@/components/pdf/theme-provider";
import { Text } from "@/components/pdf/text";
import { Heading } from "@/components/pdf/heading";

export function SampleDocument() {
  return (
    <Document>
      <Page size="A4">
        <PdfcnThemeProvider>
          <Heading level={1}>Invoice</Heading>
          <Text variant="body">Thank you for your business.</Text>
        </PdfcnThemeProvider>
      </Page>
    </Document>
  );
}
```

---

## 2. MCP Server & Registry Integration

pdfcn integrates with AI assistants via the **shadcn MCP server**. The MCP server discovers and installs pdfcn components through the `@pdfcn` registry defined in `components.json`.

### 2.1 Registry Configuration (`components.json`)
```json
{
  "registries": {
    "@pdfcn": "https://pdfcn.dev/r/{name}.json"
  }
}
```

### 2.2 MCP Tools Available
- `search_items_in_registries`: Search across pdfcn items (e.g. `query: "invoice"`, `registries: ["@pdfcn"]`).
- `view_items_in_registries`: Inspect component code, dependencies, and file structures.
- `get_item_examples_from_registries`: Retrieve code examples for pdfcn blocks and components.
- `get_add_command_for_items`: Generate installation commands for specific items.

---

## 3. Available Components & Blocks

### 3.1 UI Primitives (`@pdfcn/{engine}/{component}`)
- **Structure & Layout:** `Section`, `Stack`, `Divider`, `KeepTogether`, `PageBreak`
- **Document Headers & Footers:** `PageHeader`, `PageFooter`, `PageNumber`, `Watermark`
- **Typography & Content:** `Heading`, `Text`, `Link`, `KeyValue`, `List`, `Badge`
- **Tables & Data:** `Table`, `DataTable`, `Form`
- **Visuals & Verification:** `PDFImage`, `QRCode`, `Signature`, `Graph` (bar, line, area SVG charts)
- **Containers:** `Card`, `Alert` (info, success, warning, error)

### 3.2 Pre-built Blocks (`@pdfcn/{engine}/{block}`)
- **Invoices:**
  - `invoice-classic`: Traditional invoice layout
  - `invoice-consultant`: Hourly rate / services breakdown
  - `invoice-corporate`: Formal multi-item corporate billing
  - `invoice-creative`: Modern agency / freelance layout
  - `invoice-minimal`: Clean whitespace-heavy invoice
  - `invoice-modern`: Contemporary layout with badge and status cards
- **Reports:**
  - `report-financial`: Balance sheet and revenue summary
  - `report-marketing`: Campaign performance with KPI metrics
  - `report-operations`: Logistics and workflow report
  - `report-security`: Audit summary and compliance table

### 3.3 Theme Presets (`@pdfcn/theme-*` or `@pdfcn/takumi/theme-*`)
- `theme-professional`: Serif headings with formal slate/zinc styling
- `theme-modern`: Helvetica typography with violet accents
- `theme-minimal`: Monospaced Courier headings with maximum whitespace
- `theme-executive`: Boardroom aesthetic with Merriweather serif and navy palette
- `theme-corporate`: Lato sans-serif with structured blue-gray palette
- `theme-elegant`: Editorial typography with warm cream whites and amber accents
- `theme-vivid`: Nunito rounded sans-serif with deep violet accents
- `theme-forest`: Earthy deep green palette with Merriweather headings
- `theme-blueprint`: Technical precision styling with dark slate and cyan accents

---

## 4. Installation & CLI Commands

```bash
# Add a Takumi component
npx shadcn@latest add @pdfcn/takumi/heading

# Add a Forme component
npx shadcn@latest add @pdfcn/forme/heading

# Add an invoice block template
npx shadcn@latest add @pdfcn/takumi/invoice-modern

# Add a theme preset
npx shadcn@latest add @pdfcn/takumi/theme-modern
```


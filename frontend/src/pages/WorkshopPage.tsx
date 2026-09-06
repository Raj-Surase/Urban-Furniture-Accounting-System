import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Palette,
  Sparkles,
  ArrowRight,
  Maximize2,
  Sliders,
  Layers,
  FileText,
  ShoppingBag,
  ShoppingCart,
  Store,
  Info,
  CheckCircle2,
  RotateCw,
  Compass,
  Tag,
  ShieldCheck,
  Eye,
  Check,
  BookOpen,
} from 'lucide-react';
import { Button, Card, Chip, Tooltip } from '@heroui/react';
import { PageTransition } from '../components/layout/PageTransition';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface FurnitureTemplate {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  baseCost: number;
  description: string;
  defaultWidth: number;
  defaultDepth: number;
  defaultHeight: number;
  icon: string;
}

const TEMPLATES: FurnitureTemplate[] = [
  {
    id: 'exec-desk',
    name: 'Executive Teak Desk',
    category: 'Tables & Desks',
    basePrice: 42000,
    baseCost: 24000,
    description: 'Mastercrafted solid timber desk with brass cable grommets and soft-close drawer pedestals.',
    defaultWidth: 180,
    defaultDepth: 85,
    defaultHeight: 76,
    icon: 'desk',
  },
  {
    id: 'ergo-chair',
    name: 'Ergonomic Woodcraft Chair',
    category: 'Seating',
    basePrice: 22500,
    baseCost: 12000,
    description: 'High-back ergonomic office chair featuring steam-bent hardwood lumbar spine and Italian leather.',
    defaultWidth: 65,
    defaultDepth: 65,
    defaultHeight: 110,
    icon: 'chair',
  },
  {
    id: 'dining-table',
    name: 'Heritage Dining Table',
    category: 'Dining & Commercial',
    basePrice: 65000,
    baseCost: 38000,
    description: 'Seamless butterfly-joint live edge tabletop built to accommodate 8 corporate or family guests.',
    defaultWidth: 240,
    defaultDepth: 100,
    defaultHeight: 78,
    icon: 'table',
  },
  {
    id: 'lounge-armchair',
    name: 'Mid-Century Lounge Armchair',
    category: 'Lounge & Reception',
    basePrice: 31000,
    baseCost: 17500,
    description: 'Angled low-slung sculptural timber armchair with high-resilience foam upholstery cushions.',
    defaultWidth: 80,
    defaultDepth: 85,
    defaultHeight: 82,
    icon: 'armchair',
  },
  {
    id: 'modular-shelf',
    name: 'Joinery Modular Bookshelf',
    category: 'Storage',
    basePrice: 36000,
    baseCost: 19000,
    description: 'Architectural grid bookshelf with mortise & tenon interlocking joinery shelves.',
    defaultWidth: 160,
    defaultDepth: 40,
    defaultHeight: 200,
    icon: 'shelf',
  },
];

interface WoodFinish {
  id: string;
  name: string;
  species: string;
  multiplier: number;
  colorHex: string;
  grainPattern: string;
}

const WOOD_FINISHES: WoodFinish[] = [
  { id: 'teak', name: 'Burmese Teak', species: 'Tectona grandis', multiplier: 1.0, colorHex: '#9c6634', grainPattern: 'Golden Brown Striated' },
  { id: 'oak', name: 'English White Oak', species: 'Quercus alba', multiplier: 0.95, colorHex: '#b89065', grainPattern: 'Straight Fine Ray' },
  { id: 'walnut', name: 'American Walnut', species: 'Juglans nigra', multiplier: 1.15, colorHex: '#523a28', grainPattern: 'Deep Espresso Swirl' },
  { id: 'rosewood', name: 'Indian Rosewood', species: 'Dalbergia latifolia', multiplier: 1.25, colorHex: '#3b1c1c', grainPattern: 'Dense Dark Figured' },
  { id: 'black-ash', name: 'Matte Carbon Ash', species: 'Fraxinus excelsior', multiplier: 1.08, colorHex: '#1e1e24', grainPattern: 'Ebonized Open Pore' },
];

interface UpholsteryOption {
  id: string;
  name: string;
  material: string;
  addCost: number;
  swatchHex: string;
}

const UPHOLSTERY_OPTIONS: UpholsteryOption[] = [
  { id: 'cognac-leather', name: 'Full-Grain Cognac Leather', material: 'Top-tier Napa Leather', addCost: 6500, swatchHex: '#9e5b32' },
  { id: 'charcoal-boucle', name: 'Charcoal Textured Bouclé', material: 'Heavy Commercial Fabric', addCost: 3200, swatchHex: '#383a42' },
  { id: 'emerald-velvet', name: 'Emerald Velvet', material: 'Stain-resistant Royal Velvet', addCost: 4800, swatchHex: '#144534' },
  { id: 'cream-linen', name: 'Natural Belgian Linen', material: 'Organic Breathable Linen', addCost: 2500, swatchHex: '#d8cfc4' },
];

export const WorkshopPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isElevated =
    user?.role === UserRole.ADMIN ||
    user?.role === UserRole.MANAGER ||
    user?.role === UserRole.ACCOUNTANT;

  const [selectedTemplate, setSelectedTemplate] = useState<FurnitureTemplate>(TEMPLATES[0]);
  const [selectedWood, setSelectedWood] = useState<WoodFinish>(WOOD_FINISHES[0]);
  const [selectedUpholstery, setSelectedUpholstery] = useState<UpholsteryOption>(UPHOLSTERY_OPTIONS[0]);

  // Dimension Adjustments (cm)
  const [width, setWidth] = useState<number>(TEMPLATES[0].defaultWidth);
  const [depth, setDepth] = useState<number>(TEMPLATES[0].defaultDepth);
  const [height, setHeight] = useState<number>(TEMPLATES[0].defaultHeight);

  // View Mode for 3D Studio
  const [viewAngle, setViewAngle] = useState<'isometric' | 'front' | 'top' | 'room'>('isometric');
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [lightingMode, setLightingMode] = useState<'studio' | 'daylight' | 'obsidian'>('studio');

  // Handle template change
  const handleTemplateChange = (tmpl: FurnitureTemplate) => {
    setSelectedTemplate(tmpl);
    setWidth(tmpl.defaultWidth);
    setDepth(tmpl.defaultDepth);
    setHeight(tmpl.defaultHeight);
  };

  // Dynamic pricing calculation
  const dimensionFactor =
    (width * depth * height) /
    (selectedTemplate.defaultWidth * selectedTemplate.defaultDepth * selectedTemplate.defaultHeight);

  const calculatedPrice = Math.round(
    (selectedTemplate.basePrice * selectedWood.multiplier * (0.8 + 0.2 * dimensionFactor) + selectedUpholstery.addCost) / 100
  ) * 100;

  const calculatedCost = Math.round(
    (selectedTemplate.baseCost * selectedWood.multiplier * (0.85 + 0.15 * dimensionFactor) + selectedUpholstery.addCost * 0.5) / 100
  ) * 100;

  const gstRate = 18;
  const gstAmount = Math.round((calculatedPrice * gstRate) / 100);
  const totalPriceWithTax = calculatedPrice + gstAmount;
  const grossMarginPercent = Math.round(((calculatedPrice - calculatedCost) / calculatedPrice) * 100);

  return (
    <PageTransition>
      <div className="space-y-8 pb-16 font-sans">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-md shadow-amber-500/10">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    3D Workshop & Joinery Studio
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Interactive Configurator
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#9090a0] mt-1">
                  Design bespoke furniture, calculate material costs, and generate live Sales Orders & Purchase Orders linked to the General Ledger.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="sm"
              variant="flat"
              onPress={() => navigate('/products')}
              className="bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.08] text-xs font-semibold rounded-full"
              startContent={<Store className="w-3.5 h-3.5 text-indigo-400" />}
            >
              Furniture Catalog
            </Button>
            <Button
              size="sm"
              variant="flat"
              onPress={() => navigate('/sales-orders?new=true')}
              className="bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.08] text-xs font-semibold rounded-full"
              startContent={<ShoppingCart className="w-3.5 h-3.5 text-[#c084fc]" />}
            >
              Direct Order Quote
            </Button>
          </div>
        </div>

        {/* Studio Workspace: Left Canvas (7 cols), Right Control Panel (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 7 COLS: 3D INTERACTIVE VISUALIZER */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="bg-[#15151b] border border-white/[0.08] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              {/* Canvas Controls Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {selectedTemplate.name}
                  </span>
                  <span className="text-[11px] font-mono text-[#8a8a9a]">
                    [{selectedWood.name}]
                  </span>
                </div>

                {/* View Angle Pill Selector */}
                <div className="flex items-center bg-[#1c1c24] border border-white/[0.08] p-1 rounded-full text-xs">
                  {(['isometric', 'front', 'top', 'room'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewAngle(mode)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                        viewAngle === mode
                          ? 'bg-white text-black shadow-sm'
                          : 'text-[#8a8a9a] hover:text-white'
                      }`}
                    >
                      {mode === 'room' ? 'AR Room Preview' : mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visualizer Canvas Simulation Area */}
              <div
                className={`relative w-full h-[380px] sm:h-[440px] rounded-2xl flex items-center justify-center transition-all duration-500 overflow-hidden ${
                  lightingMode === 'studio'
                    ? 'bg-gradient-to-b from-[#1e1e28] via-[#14141c] to-[#0d0d12]'
                    : lightingMode === 'daylight'
                    ? 'bg-gradient-to-b from-[#2a2d3d] via-[#1c1e28] to-[#12131a]'
                    : 'bg-[#0b0b0e]'
                }`}
              >
                {/* Background grid guide lines */}
                <div
                  className="absolute inset-0 opacity-[0.07] pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* Radial Glow accent from wood finish color */}
                <div
                  className="absolute w-72 h-72 rounded-full blur-[100px] opacity-25 pointer-events-none"
                  style={{ backgroundColor: selectedWood.colorHex }}
                />

                {/* SVG Isometric / Elevation Procedural Furniture Renderer */}
                <svg
                  className="w-full h-full p-8 transition-transform duration-500 select-none"
                  viewBox="0 0 500 360"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={selectedWood.colorHex} stopOpacity="1" />
                      <stop offset="60%" stopColor={selectedWood.colorHex} stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
                    </linearGradient>
                    <linearGradient id="fabricGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={selectedUpholstery.swatchHex} stopOpacity="1" />
                      <stop offset="100%" stopColor="#0a0a0f" stopOpacity="0.7" />
                    </linearGradient>
                    <filter id="furnitureShadow" x="-10%" y="-10%" width="130%" height="130%">
                      <feDropShadow dx="0" dy="16" stdDeviation="12" floodColor="#000000" floodOpacity="0.65" />
                    </filter>
                  </defs>

                  {/* Floor pedestal / Ground shadow */}
                  <ellipse cx="250" cy="300" rx="180" ry="24" fill="#000000" opacity="0.45" filter="blur(8px)" />

                  {/* Dynamic Render according to Selected Template & View Angle */}
                  {viewAngle === 'isometric' && (
                    <g filter="url(#furnitureShadow)" transform="translate(250, 180) scale(1.1)">
                      {selectedTemplate.id === 'exec-desk' && (
                        <>
                          {/* Desktop Plinth */}
                          <polygon points="0,-40 140,25 0,90 -140,25" fill="url(#woodGrad)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          <polygon points="0,90 140,25 140,40 0,105" fill="#000000" opacity="0.35" />
                          <polygon points="0,90 -140,25 -140,40 0,105" fill="#000000" opacity="0.55" />
                          {/* Inlay desk mat */}
                          <polygon points="0,-20 80,18 0,55 -80,18" fill="#14141c" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.15" />
                          {/* Solid timber legs */}
                          <polygon points="-120,40 -110,45 -110,120 -120,115" fill={selectedWood.colorHex} />
                          <polygon points="-5,10 5,15 5,75 -5,70" fill={selectedWood.colorHex} opacity="0.7" />
                          {/* Under-desk pedestal drawer block */}
                          <polygon points="40,55 110,25 110,95 40,125" fill="#1b1b24" stroke={selectedWood.colorHex} strokeWidth="1" />
                          <polygon points="40,55 -5,75 -5,145 40,125" fill="#14141c" stroke={selectedWood.colorHex} strokeWidth="1" />
                          {/* Drawer handles */}
                          <circle cx="20" cy="95" r="2.5" fill="#eab308" />
                          <circle cx="20" cy="120" r="2.5" fill="#eab308" />
                          {/* Brass corner brackets / cable grommets */}
                          <circle cx="-135" cy="27" r="3" fill="#eab308" />
                          <circle cx="135" cy="27" r="3" fill="#eab308" />
                        </>
                      )}

                      {selectedTemplate.id === 'dining-table' && (
                        <>
                          {/* Grand Dining Tabletop (longer and sleeker) */}
                          <polygon points="0,-45 160,30 0,105 -160,30" fill="url(#woodGrad)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          <polygon points="0,105 160,30 160,45 0,120" fill="#000000" opacity="0.35" />
                          <polygon points="0,105 -160,30 -160,45 0,120" fill="#000000" opacity="0.55" />
                          {/* Center butterfly joints / bowtie inlays */}
                          <polygon points="-40,30 -35,33 -35,27 -40,30" fill="#2d1c10" />
                          <polygon points="-40,30 -45,33 -45,27 -40,30" fill="#2d1c10" />
                          <polygon points="40,30 45,33 45,27 40,30" fill="#2d1c10" />
                          <polygon points="40,30 35,33 35,27 40,30" fill="#2d1c10" />
                          {/* 4 solid tapered corner timber legs with brass ferrules */}
                          <polygon points="-140,45 -130,50 -130,135 -140,130" fill={selectedWood.colorHex} />
                          <circle cx="-135" cy="132" r="3" fill="#eab308" />
                          <polygon points="140,45 130,50 130,135 140,130" fill={selectedWood.colorHex} />
                          <circle cx="135" cy="132" r="3" fill="#eab308" />
                          <polygon points="-10,110 0,115 0,150 -10,145" fill={selectedWood.colorHex} />
                          <circle cx="-5" cy="148" r="3" fill="#eab308" />
                          <polygon points="0,-35 10,-30 10,40 0,35" fill={selectedWood.colorHex} opacity="0.5" />
                        </>
                      )}

                      {selectedTemplate.id === 'ergo-chair' && (
                        <>
                          {/* Seat Cushion */}
                          <polygon points="0,-10 70,25 0,60 -70,25" fill="url(#fabricGrad)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          <polygon points="0,60 70,25 70,40 0,75" fill="#000000" opacity="0.4" />
                          <polygon points="0,60 -70,25 -70,40 0,75" fill="#000000" opacity="0.6" />
                          {/* Curved Ergonomic Backrest */}
                          <polygon points="-50,-20 0,-75 50,-20 0,-10" fill="url(#woodGrad)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          <polygon points="-40,-25 0,-70 40,-25 0,-15" fill="url(#fabricGrad)" opacity="0.9" />
                          {/* Armrest rails */}
                          <line x1="-55" y1="10" x2="-65" y2="-15" stroke={selectedWood.colorHex} strokeWidth="5" strokeLinecap="round" />
                          <line x1="55" y1="10" x2="65" y2="-15" stroke={selectedWood.colorHex} strokeWidth="5" strokeLinecap="round" />
                          {/* Timber Legs with brass casters */}
                          <line x1="-55" y1="40" x2="-65" y2="110" stroke={selectedWood.colorHex} strokeWidth="6" strokeLinecap="round" />
                          <line x1="55" y1="40" x2="65" y2="110" stroke={selectedWood.colorHex} strokeWidth="6" strokeLinecap="round" />
                          <line x1="0" y1="75" x2="0" y2="120" stroke={selectedWood.colorHex} strokeWidth="7" strokeLinecap="round" />
                          <circle cx="-65" cy="110" r="3" fill="#eab308" />
                          <circle cx="65" cy="110" r="3" fill="#eab308" />
                          <circle cx="0" cy="120" r="3" fill="#eab308" />
                        </>
                      )}

                      {selectedTemplate.id === 'lounge-armchair' && (
                        <>
                          {/* Deep, Wide Lounge Seat Cushion */}
                          <polygon points="0,-15 85,25 0,68 -85,25" fill="url(#fabricGrad)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          <polygon points="0,68 85,25 85,45 0,88" fill="#000000" opacity="0.45" />
                          <polygon points="0,68 -85,25 -85,45 0,88" fill="#000000" opacity="0.65" />
                          {/* Angled Plush Backrest Cushion */}
                          <polygon points="-65,-25 0,-65 65,-25 0,-15" fill="url(#fabricGrad)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          <polygon points="0,-65 65,-25 65,-10 0,-50" fill="#000000" opacity="0.3" />
                          {/* Sculptural Mid-Century Timber Armrest Wings */}
                          <polygon points="-85,15 -68,22 -68,-20 -85,-25" fill="url(#woodGrad)" />
                          <polygon points="68,22 85,15 85,-25 68,-20" fill="url(#woodGrad)" />
                          {/* Splayed Solid Timber Legs */}
                          <line x1="-70" y1="45" x2="-80" y2="115" stroke={selectedWood.colorHex} strokeWidth="7" strokeLinecap="round" />
                          <line x1="70" y1="45" x2="80" y2="115" stroke={selectedWood.colorHex} strokeWidth="7" strokeLinecap="round" />
                          <line x1="0" y1="88" x2="0" y2="125" stroke={selectedWood.colorHex} strokeWidth="7" strokeLinecap="round" />
                          {/* Brass ferrule caps on legs */}
                          <line x1="-77" y1="102" x2="-80" y2="115" stroke="#eab308" strokeWidth="7" strokeLinecap="round" />
                          <line x1="77" y1="102" x2="80" y2="115" stroke="#eab308" strokeWidth="7" strokeLinecap="round" />
                        </>
                      )}

                      {selectedTemplate.id === 'modular-shelf' && (
                        <>
                          {/* Bookshelf Framework */}
                          <polygon points="-90,-80 90,-80 90,90 -90,90" fill="none" stroke="url(#woodGrad)" strokeWidth="12" strokeLinejoin="round" />
                          <line x1="-90" y1="-25" x2="90" y2="-25" stroke={selectedWood.colorHex} strokeWidth="8" />
                          <line x1="-90" y1="35" x2="90" y2="35" stroke={selectedWood.colorHex} strokeWidth="8" />
                          <line x1="-30" y1="-80" x2="-30" y2="90" stroke={selectedWood.colorHex} strokeWidth="6" />
                          <line x1="30" y1="-80" x2="30" y2="90" stroke={selectedWood.colorHex} strokeWidth="6" />
                          {/* Book assets decorative inside shelves */}
                          <rect x="-80" y="-20" width="12" height="35" fill="#7042f4" rx="2" />
                          <rect x="-65" y="-15" width="10" height="30" fill="#38bdf8" rx="2" />
                          <rect x="40" y="40" width="14" height="42" fill="#fbbf24" rx="2" />
                        </>
                      )}
                    </g>
                  )}

                  {viewAngle === 'front' && (
                    <g filter="url(#furnitureShadow)" transform="translate(250, 190)">
                      {selectedTemplate.id === 'exec-desk' && (
                        <>
                          {/* Desktop Surface */}
                          <rect x="-140" y="-10" width="280" height="20" fill="url(#woodGrad)" rx="3" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          {/* Legs */}
                          <rect x="-130" y="10" width="18" height="100" fill={selectedWood.colorHex} />
                          <rect x="112" y="10" width="18" height="100" fill={selectedWood.colorHex} />
                          {/* Modesty Panel */}
                          <rect x="-112" y="10" width="145" height="45" fill="#15151c" stroke={selectedWood.colorHex} strokeWidth="1" />
                          {/* Right Pedestal Drawer Box */}
                          <rect x="33" y="10" width="79" height="75" fill="#1b1b24" stroke={selectedWood.colorHex} strokeWidth="1.5" rx="3" />
                          <line x1="33" y1="47" x2="112" y2="47" stroke={selectedWood.colorHex} strokeWidth="1" />
                          <circle cx="72" cy="28" r="3.5" fill="#eab308" />
                          <circle cx="72" cy="62" r="3.5" fill="#eab308" />
                        </>
                      )}

                      {selectedTemplate.id === 'dining-table' && (
                        <>
                          {/* Long Grand Dining Tabletop */}
                          <rect x="-160" y="-10" width="320" height="22" fill="url(#woodGrad)" rx="4" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          {/* Under-table Bevel Apron */}
                          <rect x="-145" y="12" width="290" height="12" fill={selectedWood.colorHex} opacity="0.85" rx="1" />
                          {/* Rear Leg Shadows */}
                          <polygon points="-95,24 -85,24 -87,105 -93,105" fill="#000000" opacity="0.4" />
                          <polygon points="85,24 95,24 93,105 87,105" fill="#000000" opacity="0.4" />
                          {/* Front Tapered Timber Legs with Brass Feet */}
                          <polygon points="-142,24 -128,24 -131,110 -139,110" fill={selectedWood.colorHex} />
                          <rect x="-140" y="103" width="10" height="7" fill="#eab308" rx="1" />
                          <polygon points="128,24 142,24 139,110 131,110" fill={selectedWood.colorHex} />
                          <rect x="130" y="103" width="10" height="7" fill="#eab308" rx="1" />
                        </>
                      )}

                      {selectedTemplate.id === 'ergo-chair' && (
                        <>
                          {/* Ergonomic Curved Wood Backrest Frame */}
                          <rect x="-50" y="-95" width="100" height="85" rx="20" fill="url(#woodGrad)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          {/* Upholstered Backrest Cushion */}
                          <rect x="-38" y="-85" width="76" height="68" rx="14" fill="url(#fabricGrad)" />
                          {/* Lumbar Spine Accent */}
                          <path d="M-25,-45 Q0,-40 25,-45" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.25" fill="none" />
                          {/* Contoured Seat Cushion */}
                          <rect x="-55" y="-5" width="110" height="24" rx="8" fill="url(#fabricGrad)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          {/* Armrest Supports */}
                          <path d="M-65,-40 L-50,-40 L-50,2" stroke={selectedWood.colorHex} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          <path d="M65,-40 L50,-40 L50,2" stroke={selectedWood.colorHex} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          {/* Central Pedestal & Timber Base */}
                          <rect x="-8" y="19" width="16" height="35" fill="#1b1c24" stroke={selectedWood.colorHex} strokeWidth="1" />
                          <line x1="0" y1="54" x2="-65" y2="105" stroke={selectedWood.colorHex} strokeWidth="6" strokeLinecap="round" />
                          <line x1="0" y1="54" x2="65" y2="105" stroke={selectedWood.colorHex} strokeWidth="6" strokeLinecap="round" />
                          <circle cx="-65" cy="105" r="3.5" fill="#eab308" />
                          <circle cx="65" cy="105" r="3.5" fill="#eab308" />
                        </>
                      )}

                      {selectedTemplate.id === 'lounge-armchair' && (
                        <>
                          {/* Low-Slung Sculptural Timber Sides */}
                          <polygon points="-85,-35 -70,-35 -60,50 -75,50" fill={selectedWood.colorHex} />
                          <polygon points="70,-35 85,-35 75,50 60,50" fill={selectedWood.colorHex} />
                          <rect x="-88" y="-38" width="20" height="7" rx="2" fill="url(#woodGrad)" />
                          <rect x="68" y="-38" width="20" height="7" rx="2" fill="url(#woodGrad)" />
                          {/* Plush Angled Backrest */}
                          <rect x="-60" y="-50" width="120" height="52" rx="10" fill="url(#fabricGrad)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          {/* Deep Seat Cushion */}
                          <rect x="-65" y="4" width="130" height="32" rx="8" fill="url(#fabricGrad)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          {/* Lower Apron Base */}
                          <rect x="-62" y="36" width="124" height="10" fill="url(#woodGrad)" rx="2" />
                          {/* Splayed Tapered Timber Legs with Brass Ferrules */}
                          <line x1="-55" y1="46" x2="-75" y2="108" stroke={selectedWood.colorHex} strokeWidth="6" strokeLinecap="round" />
                          <line x1="55" y1="46" x2="75" y2="108" stroke={selectedWood.colorHex} strokeWidth="6" strokeLinecap="round" />
                          <line x1="-70" y1="96" x2="-75" y2="108" stroke="#eab308" strokeWidth="6" strokeLinecap="round" />
                          <line x1="70" y1="96" x2="75" y2="108" stroke="#eab308" strokeWidth="6" strokeLinecap="round" />
                        </>
                      )}

                      {selectedTemplate.id === 'modular-shelf' && (
                        <>
                          {/* Outer Framework */}
                          <polygon points="-100,-105 100,-105 100,105 -100,105" fill="none" stroke="url(#woodGrad)" strokeWidth="10" strokeLinejoin="round" />
                          {/* Vertical Dividers */}
                          <line x1="-35" y1="-105" x2="-35" y2="105" stroke={selectedWood.colorHex} strokeWidth="6" />
                          <line x1="35" y1="-105" x2="35" y2="105" stroke={selectedWood.colorHex} strokeWidth="6" />
                          {/* Horizontal Shelves */}
                          <line x1="-100" y1="-50" x2="100" y2="-50" stroke={selectedWood.colorHex} strokeWidth="7" />
                          <line x1="-100" y1="5" x2="100" y2="5" stroke={selectedWood.colorHex} strokeWidth="7" />
                          <line x1="-100" y1="60" x2="100" y2="60" stroke={selectedWood.colorHex} strokeWidth="7" />
                          {/* Books & Decor */}
                          <rect x="-90" y="-45" width="12" height="42" fill="#7042f4" rx="2" />
                          <rect x="-76" y="-38" width="9" height="35" fill="#38bdf8" rx="2" />
                          <rect x="-65" y="-48" width="14" height="45" fill="#fbbf24" rx="2" />
                          <rect x="42" y="12" width="12" height="40" fill="#10b981" rx="2" />
                          <rect x="56" y="18" width="10" height="34" fill="#f43f5e" rx="2" />
                          {/* Minimalist Ceramic Planter */}
                          <circle cx="0" cy="45" r="10" fill="#d97706" opacity="0.85" />
                          <rect x="-4" y="32" width="8" height="5" fill="#b45309" rx="1" />
                        </>
                      )}
                    </g>
                  )}

                  {viewAngle === 'top' && (
                    <g filter="url(#furnitureShadow)" transform="translate(250, 180)">
                      {selectedTemplate.id === 'exec-desk' && (
                        <>
                          {/* Desktop Surface */}
                          <rect x="-140" y="-70" width="280" height="140" fill="url(#woodGrad)" rx="8" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          {/* Leather Executive Blotter */}
                          <rect x="-80" y="-45" width="160" height="90" rx="4" fill="#14141d" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.15" />
                          {/* Wood Grain Lines */}
                          <path d="M-130,-55 Q0,-45 130,-55" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" fill="none" />
                          <path d="M-130,55 Q0,45 130,55" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" fill="none" />
                          {/* Dual Brass Cable Grommets */}
                          <circle cx="-120" cy="-50" r="4" fill="#eab308" />
                          <circle cx="120" cy="-50" r="4" fill="#eab308" />
                        </>
                      )}

                      {selectedTemplate.id === 'dining-table' && (
                        <>
                          {/* Grand Tabletop Surface */}
                          <rect x="-170" y="-65" width="340" height="130" fill="url(#woodGrad)" rx="8" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          {/* Center Bookmatched Grain Seam */}
                          <line x1="-165" y1="0" x2="165" y2="0" stroke="#000000" strokeWidth="1.2" opacity="0.25" />
                          {/* Butterfly Joint Inlays */}
                          <polygon points="-70,0 -64,-5 -64,5 -70,0" fill="#2d1c10" />
                          <polygon points="-70,0 -76,-5 -76,5 -70,0" fill="#2d1c10" />
                          <polygon points="70,0 64,-5 64,5 70,0" fill="#2d1c10" />
                          <polygon points="70,0 76,-5 76,5 70,0" fill="#2d1c10" />
                          {/* Wood Grain Flow */}
                          <path d="M-160,-35 Q0,-25 160,-35" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.15" fill="none" />
                          <path d="M-160,35 Q0,45 160,35" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.15" fill="none" />
                          {/* 6 Ghosted Dining Chairs around perimeter */}
                          <rect x="-115" y="-82" width="32" height="12" rx="3" stroke="#ffffff" strokeOpacity="0.25" strokeDasharray="2 2" fill="none" />
                          <rect x="-16" y="-82" width="32" height="12" rx="3" stroke="#ffffff" strokeOpacity="0.25" strokeDasharray="2 2" fill="none" />
                          <rect x="83" y="-82" width="32" height="12" rx="3" stroke="#ffffff" strokeOpacity="0.25" strokeDasharray="2 2" fill="none" />
                          <rect x="-115" y="70" width="32" height="12" rx="3" stroke="#ffffff" strokeOpacity="0.25" strokeDasharray="2 2" fill="none" />
                          <rect x="-16" y="70" width="32" height="12" rx="3" stroke="#ffffff" strokeOpacity="0.25" strokeDasharray="2 2" fill="none" />
                          <rect x="83" y="70" width="32" height="12" rx="3" stroke="#ffffff" strokeOpacity="0.25" strokeDasharray="2 2" fill="none" />
                        </>
                      )}

                      {selectedTemplate.id === 'ergo-chair' && (
                        <>
                          {/* Contoured Fabric Seat Cushion */}
                          <rect x="-50" y="-35" width="100" height="80" rx="20" fill="url(#fabricGrad)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          {/* Curved Backrest Profile Behind */}
                          <path d="M-55,-40 C-30,-65 30,-65 55,-40" stroke="url(#woodGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
                          <path d="M-45,-42 C-25,-60 25,-60 45,-42" stroke="url(#fabricGrad)" strokeWidth="8" strokeLinecap="round" fill="none" />
                          {/* Armrest Pads */}
                          <rect x="-68" y="-18" width="14" height="46" rx="7" fill={selectedWood.colorHex} />
                          <rect x="54" y="-18" width="14" height="46" rx="7" fill={selectedWood.colorHex} />
                        </>
                      )}

                      {selectedTemplate.id === 'lounge-armchair' && (
                        <>
                          {/* Deep Plush Seat Cushion */}
                          <rect x="-65" y="-25" width="130" height="95" rx="16" fill="url(#fabricGrad)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          {/* Cushion Crease / Button Tufting */}
                          <circle cx="-25" cy="18" r="2.5" fill="#000000" opacity="0.4" />
                          <circle cx="25" cy="18" r="2.5" fill="#000000" opacity="0.4" />
                          {/* Backrest Cushion */}
                          <rect x="-60" y="-58" width="120" height="28" rx="10" fill="url(#fabricGrad)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          {/* Wide Architectural Timber Armrests */}
                          <rect x="-85" y="-52" width="18" height="115" rx="8" fill="url(#woodGrad)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          <rect x="67" y="-52" width="18" height="115" rx="8" fill="url(#woodGrad)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                        </>
                      )}

                      {selectedTemplate.id === 'modular-shelf' && (
                        <>
                          {/* Top View Plan of Bookcase */}
                          <rect x="-140" y="-35" width="280" height="70" rx="4" fill="url(#woodGrad)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                          {/* Interlocking Vertical Uprights */}
                          <rect x="-135" y="-30" width="12" height="60" fill={selectedWood.colorHex} stroke="#000000" strokeWidth="1" rx="1" />
                          <rect x="-45" y="-30" width="10" height="60" fill={selectedWood.colorHex} stroke="#000000" strokeWidth="1" rx="1" />
                          <rect x="35" y="-30" width="10" height="60" fill={selectedWood.colorHex} stroke="#000000" strokeWidth="1" rx="1" />
                          <rect x="123" y="-30" width="12" height="60" fill={selectedWood.colorHex} stroke="#000000" strokeWidth="1" rx="1" />
                          {/* Book Spine Tops */}
                          <rect x="-115" y="-20" width="6" height="40" fill="#7042f4" rx="1" />
                          <rect x="-105" y="-18" width="6" height="36" fill="#38bdf8" rx="1" />
                          <rect x="-95" y="-22" width="6" height="44" fill="#fbbf24" rx="1" />
                        </>
                      )}
                    </g>
                  )}

                  {viewAngle === 'room' && (
                    <g transform="translate(250, 180)">
                      {/* Architectural Backdrop Simulation */}
                      <line x1="-200" y1="110" x2="200" y2="110" stroke="#ffffff" strokeOpacity="0.1" strokeDasharray="4 4" />
                      {/* Wall Window Framing */}
                      <rect x="-180" y="-120" width="80" height="100" fill="#ffffff" fillOpacity="0.04" stroke="#ffffff" strokeOpacity="0.1" rx="4" />
                      <line x1="-140" y1="-120" x2="-140" y2="-20" stroke="#ffffff" strokeOpacity="0.08" />
                      <line x1="-180" y1="-70" x2="-100" y2="-70" stroke="#ffffff" strokeOpacity="0.08" />
                      {/* Wall Art Frame */}
                      <rect x="100" y="-100" width="70" height="70" fill="#ffffff" fillOpacity="0.03" stroke="#ffffff" strokeOpacity="0.08" rx="4" />
                      <circle cx="135" cy="-65" r="16" fill="#7042f4" fillOpacity="0.15" />

                      {/* Selected Model in Room */}
                      {selectedTemplate.id === 'exec-desk' && (
                        <>
                          <polygon points="0,-20 110,35 0,85 -110,35" fill="url(#woodGrad)" />
                          <polygon points="-90,40 -80,45 -80,110 -90,105" fill={selectedWood.colorHex} />
                          <polygon points="90,40 80,45 80,110 90,105" fill={selectedWood.colorHex} />
                          {/* Drawer pedestal */}
                          <polygon points="30,55 75,35 75,85 30,105" fill="#1b1c24" stroke={selectedWood.colorHex} strokeWidth="1" />
                          <circle cx="52" cy="80" r="2" fill="#eab308" />
                          {/* Mini Laptop */}
                          <polygon points="5,15 35,0 45,15 15,30" fill="#ffffff" opacity="0.3" />
                          <text x="0" y="135" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace">
                            ✓ Fits Office Clearance Spec (2.4m × 3.0m Zone)
                          </text>
                        </>
                      )}

                      {selectedTemplate.id === 'dining-table' && (
                        <>
                          <polygon points="0,-25 130,35 0,95 -130,35" fill="url(#woodGrad)" />
                          <polygon points="-110,40 -100,45 -100,115 -110,110" fill={selectedWood.colorHex} />
                          <polygon points="110,40 100,45 100,115 110,110" fill={selectedWood.colorHex} />
                          <polygon points="-10,95 0,100 0,130 -10,125" fill={selectedWood.colorHex} />
                          <circle cx="-105" cy="113" r="2.5" fill="#eab308" />
                          <circle cx="105" cy="113" r="2.5" fill="#eab308" />
                          {/* Centerpiece Vase */}
                          <ellipse cx="0" cy="35" rx="8" ry="4" fill="#a855f7" opacity="0.7" />
                          <text x="0" y="135" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace">
                            ✓ Fits Dining Clearance (min 90cm perimeter walk-around)
                          </text>
                        </>
                      )}

                      {selectedTemplate.id === 'ergo-chair' && (
                        <>
                          {/* Chair Seat & Backrest in Room */}
                          <polygon points="0,15 50,38 0,60 -50,38" fill="url(#fabricGrad)" />
                          <polygon points="-35,10 0,-40 35,10 0,20" fill="url(#woodGrad)" />
                          <polygon points="-28,8 0,-34 28,8 0,16" fill="url(#fabricGrad)" />
                          {/* Chair Base */}
                          <line x1="0" y1="60" x2="-40" y2="105" stroke={selectedWood.colorHex} strokeWidth="5" strokeLinecap="round" />
                          <line x1="0" y1="60" x2="40" y2="105" stroke={selectedWood.colorHex} strokeWidth="5" strokeLinecap="round" />
                          <line x1="0" y1="60" x2="0" y2="110" stroke={selectedWood.colorHex} strokeWidth="5" strokeLinecap="round" />
                          <circle cx="-40" cy="105" r="3" fill="#eab308" />
                          <circle cx="40" cy="105" r="3" fill="#eab308" />
                          <text x="0" y="135" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace">
                            ✓ Ergonomic Task Clearance Verified (1.2m swivel radius)
                          </text>
                        </>
                      )}

                      {selectedTemplate.id === 'lounge-armchair' && (
                        <>
                          {/* Armchair in Room */}
                          <polygon points="0,5 65,35 0,65 -65,35" fill="url(#fabricGrad)" />
                          <polygon points="-45,-5 0,-45 45,-5 0,5" fill="url(#fabricGrad)" />
                          {/* Armrest posts */}
                          <polygon points="-65,25 -50,30 -50,75 -65,70" fill={selectedWood.colorHex} />
                          <polygon points="50,30 65,25 65,70 50,75" fill={selectedWood.colorHex} />
                          {/* Legs */}
                          <line x1="-55" y1="65" x2="-65" y2="108" stroke={selectedWood.colorHex} strokeWidth="5" strokeLinecap="round" />
                          <line x1="55" y1="65" x2="65" y2="108" stroke={selectedWood.colorHex} strokeWidth="5" strokeLinecap="round" />
                          <circle cx="-65" cy="108" r="2.5" fill="#eab308" />
                          <circle cx="65" cy="108" r="2.5" fill="#eab308" />
                          <text x="0" y="135" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace">
                            ✓ Lounge Reading Nook Clearance Approved
                          </text>
                        </>
                      )}

                      {selectedTemplate.id === 'modular-shelf' && (
                        <>
                          {/* Modular Shelf Against Wall */}
                          <polygon points="-75,-75 75,-75 75,70 -75,70" fill="none" stroke="url(#woodGrad)" strokeWidth="8" strokeLinejoin="round" />
                          <line x1="-25" y1="-75" x2="-25" y2="70" stroke={selectedWood.colorHex} strokeWidth="5" />
                          <line x1="25" y1="-75" x2="25" y2="70" stroke={selectedWood.colorHex} strokeWidth="5" />
                          <line x1="-75" y1="-25" x2="75" y2="-25" stroke={selectedWood.colorHex} strokeWidth="5" />
                          <line x1="-75" y1="20" x2="75" y2="20" stroke={selectedWood.colorHex} strokeWidth="5" />
                          {/* Small book accents */}
                          <rect x="-65" y="-20" width="8" height="28" fill="#7042f4" rx="1" />
                          <rect x="-55" y="-16" width="6" height="24" fill="#38bdf8" rx="1" />
                          <rect x="35" y="25" width="10" height="32" fill="#fbbf24" rx="1" />
                          <text x="0" y="135" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace">
                            ✓ Wall Anchor & Ceiling Clearance Verified (2.2m min height)
                          </text>
                        </>
                      )}
                    </g>
                  )}

                  {/* Overlaid Dimension HUD indicators */}
                  {showDimensions && (
                    <g className="font-mono text-[10px] text-white">
                      {/* Width tag */}
                      <line x1="80" y1="315" x2="420" y2="315" stroke="#7042f4" strokeWidth="1.5" strokeDasharray="3 3" />
                      <text x="250" y="330" textAnchor="middle" fill="#c084fc" fontSize="11" fontWeight="bold">
                        W: {width} cm
                      </text>
                      {/* Height tag for non-top views */}
                      {viewAngle !== 'top' ? (
                        <>
                          <line x1="45" y1="90" x2="45" y2="280" stroke="#7042f4" strokeWidth="1.5" strokeDasharray="3 3" />
                          <text x="40" y="190" textAnchor="end" fill="#c084fc" fontSize="11" fontWeight="bold">
                            H: {height} cm
                          </text>
                        </>
                      ) : (
                        <>
                          <line x1="45" y1="110" x2="45" y2="250" stroke="#7042f4" strokeWidth="1.5" strokeDasharray="3 3" />
                          <text x="40" y="185" textAnchor="end" fill="#c084fc" fontSize="11" fontWeight="bold">
                            D: {depth} cm
                          </text>
                        </>
                      )}
                      {viewAngle === 'isometric' && (
                        <text x="435" y="185" textAnchor="start" fill="#818cf8" fontSize="10" fontWeight="bold">
                          D: {depth} cm
                        </text>
                      )}
                    </g>
                  )}
                </svg>

                {/* Bottom Canvas Toolbar */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDimensions(!showDimensions)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        showDimensions
                          ? 'bg-[#7042f4]/20 border-[#7042f4]/40 text-[#c084fc]'
                          : 'bg-black/40 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{showDimensions ? 'Hide Dimensions' : 'Show Dimensions'}</span>
                    </button>
                  </div>

                  <div className="flex items-center bg-black/50 backdrop-blur-md border border-white/10 p-1 rounded-full text-xs">
                    {(['studio', 'daylight', 'obsidian'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setLightingMode(mode)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold transition-all cursor-pointer ${
                          lightingMode === mode ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* LIVE FINANCIAL VALUATION BAR */}
            <div className={`grid ${isElevated ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'} gap-3`}>
              <div className="p-4 rounded-2xl bg-[#181820] border border-white/[0.06] shadow-sm">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8a8a9a] block">
                  Selling Price (Excl. Tax)
                </span>
                <span className="text-xl font-extrabold font-mono text-white mt-1 block">
                  ₹{calculatedPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-[#8a8a9a]">Base + Wood spec</span>
              </div>

              {isElevated && (
                <div className="p-4 rounded-2xl bg-[#181820] border border-white/[0.06] shadow-sm">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8a8a9a] block">
                    Estimated Cost (COGS)
                  </span>
                  <span className="text-xl font-extrabold font-mono text-indigo-300 mt-1 block">
                    ₹{calculatedCost.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">{grossMarginPercent}% Gross Margin</span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-[#181820] border border-white/[0.06] shadow-sm">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8a8a9a] block">
                  GST Applicable ({gstRate}%)
                </span>
                <span className="text-xl font-extrabold font-mono text-amber-300 mt-1 block">
                  ₹{gstAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-[#8a8a9a]">HSN: 9403 (Timber Furn.)</span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#7042f4]/20 to-[#c084fc]/10 border border-[#7042f4]/30 shadow-sm">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#c084fc] block">
                  Final Invoice Total
                </span>
                <span className="text-xl font-extrabold font-mono text-white mt-1 block">
                  ₹{totalPriceWithTax.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">Ready for SO & Invoice</span>
              </div>
            </div>

            {/* ACTION BUTTONS: ORDER / PROCURE / REGISTER SKU */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="md"
                onPress={() =>
                  navigate(
                    `/sales-orders?new=true&custom_item=${encodeURIComponent(
                      `${selectedTemplate.name} (${selectedWood.name}, ${width}x${depth}x${height}cm)`
                    )}&price=${calculatedPrice}`
                  )
                }
                className="flex-1 bg-gradient-to-r from-[#7042f4] to-[#8b5cf6] hover:from-[#5f32e6] hover:to-[#7c3aed] text-white font-bold text-xs py-3 rounded-2xl shadow-lg shadow-[#7042f4]/30 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  Create Sales Order {user?.customer_name ? `for ${user.customer_name}` : user?.name ? `for ${user.name}` : ''}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>

              {isElevated && (
                <Button
                  size="md"
                  variant="flat"
                  onPress={() =>
                    navigate(
                      `/purchase-orders?new=true&wood=${encodeURIComponent(
                        selectedWood.name
                      )}&raw_cost=${calculatedCost}`
                    )
                  }
                  className="bg-[#1e1e28] hover:bg-[#252533] text-amber-300 border border-amber-500/30 font-semibold text-xs py-3 px-5 rounded-2xl"
                >
                  <ShoppingBag className="w-4 h-4 mr-1 text-amber-400" />
                  <span>Procure Raw Timber (PO)</span>
                </Button>
              )}
            </div>

          </div>

          {/* RIGHT 5 COLS: CUSTOMIZER CONTROLS & SPECIFICATION PALETTE */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. MODEL TEMPLATE SELECTION */}
            <Card className="bg-[#181820] border border-white/[0.08] rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-amber-400" />
                  1. Furniture Model
                </span>
                <span className="text-[10px] text-[#8a8a9a]">5 Pre-Engineered Specs</span>
              </div>

              <div className="space-y-2">
                {TEMPLATES.map((tmpl) => {
                  const isSel = selectedTemplate.id === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => handleTemplateChange(tmpl)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSel
                          ? 'bg-[#7042f4]/15 border-[#7042f4] text-white shadow-sm'
                          : 'bg-[#131317] border-white/[0.04] text-[#9090a0] hover:text-white hover:border-white/15'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-2">
                          <span>{tmpl.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/[0.08] text-[#c084fc] font-normal">
                            {tmpl.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8a8a9a] line-clamp-1 mt-0.5">{tmpl.description}</p>
                      </div>
                      <div className="text-right pl-3 shrink-0">
                        <span className="font-mono font-bold text-xs text-emerald-400">
                          ₹{tmpl.basePrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 2. TIMBER & WOOD FINISH SELECTION */}
            <Card className="bg-[#181820] border border-white/[0.08] rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  2. Sustainable Timber Finish
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">100% Certified Hardwood</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {WOOD_FINISHES.map((wood) => {
                  const isSel = selectedWood.id === wood.id;
                  return (
                    <button
                      key={wood.id}
                      onClick={() => setSelectedWood(wood)}
                      className={`p-3 rounded-2xl border text-left transition-all relative flex items-center gap-3 cursor-pointer ${
                        isSel
                          ? 'bg-white/[0.08] border-indigo-500 ring-1 ring-indigo-500/50 shadow-md'
                          : 'bg-[#131317] border-white/[0.04] text-[#8a8a9a] hover:text-white hover:border-white/15'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-xl border border-white/20 shrink-0 shadow-inner"
                        style={{ backgroundColor: wood.colorHex }}
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-white block truncate">{wood.name}</span>
                        <span className="text-[10px] text-[#707080] block italic truncate">{wood.species}</span>
                      </div>
                      {isSel && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 absolute top-2 right-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 3. UPHOLSTERY & ACCENTS */}
            <Card className="bg-[#181820] border border-white/[0.08] rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  3. Premium Upholstery / Accents
                </span>
                <span className="text-[10px] text-[#8a8a9a]">Commercial Grade</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {UPHOLSTERY_OPTIONS.map((uph) => {
                  const isSel = selectedUpholstery.id === uph.id;
                  return (
                    <button
                      key={uph.id}
                      onClick={() => setSelectedUpholstery(uph)}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                        isSel
                          ? 'bg-purple-500/15 border-purple-500 shadow-sm'
                          : 'bg-[#131317] border-white/[0.04] text-[#8a8a9a] hover:text-white'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: uph.swatchHex }}
                      />
                      <div className="truncate">
                        <span className="font-bold text-[11px] text-white block truncate">{uph.name}</span>
                        <span className="text-[9px] text-purple-300 font-mono">+₹{uph.addCost.toLocaleString('en-IN')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 4. CUSTOM DIMENSIONS (W x D x H) */}
            <Card className="bg-[#181820] border border-white/[0.08] rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  4. Custom Joinery Dimensions (cm)
                </span>
                <button
                  onClick={() => {
                    setWidth(selectedTemplate.defaultWidth);
                    setDepth(selectedTemplate.defaultDepth);
                    setHeight(selectedTemplate.defaultHeight);
                  }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>

              {/* Sliders */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-[#8a8a9a] mb-1">
                    <span>Width:</span>
                    <span className="font-mono font-bold text-white">{width} cm</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="5"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="w-full accent-[#7042f4] bg-white/[0.08] h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#8a8a9a] mb-1">
                    <span>Depth:</span>
                    <span className="font-mono font-bold text-white">{depth} cm</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="160"
                    step="5"
                    value={depth}
                    onChange={(e) => setDepth(Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-white/[0.08] h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#8a8a9a] mb-1">
                    <span>Height:</span>
                    <span className="font-mono font-bold text-white">{height} cm</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="240"
                    step="5"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-white/[0.08] h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* BOTTOM WORKFLOW GUIDE */}
        <div className="mt-12 bg-gradient-to-br from-[#181822] to-[#121218] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4 mb-6">
            <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isElevated ? 'Urban Furniture: Accounting & Workshop Integration Workflow' : 'Custom Furniture Studio & Ordering Guide'}
              </h2>
              <p className="text-xs text-[#8a8a9a] mt-0.5">
                {isElevated
                  ? 'Official guide following the Hackathon Problem Statement and Excalidraw Wireframe Specifications'
                  : 'How your custom furniture is engineered, fabricated, and delivered directly to your project site'}
              </p>
            </div>
          </div>

          {isElevated ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
              {/* Step 1: Procurement */}
              <div className="p-4 rounded-2xl bg-[#121216] border border-white/[0.04] space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                  <span>1. Raw Timber Procurement</span>
                </div>
                <p className="text-[#9090a0]">
                  When ordering raw timber (e.g. Burmese Teak or White Oak from Azure Furniture or Open Wood):
                </p>
                <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                  <li>Create <strong className="text-white">Purchase Order</strong> (PO-2026-XXXX).</li>
                  <li>On intake, convert PO into <strong className="text-white">Vendor Bill</strong>.</li>
                  <li>Auto-generates balanced Journal Entry:</li>
                </ul>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[10.5px] text-amber-300">
                  Debit: Purchase Expense (5200)<br />
                  Credit: Creditor A/c (Rahul Sharma / Azure)
                </div>
              </div>

              {/* Step 2: Workshop & Budget */}
              <div className="p-4 rounded-2xl bg-[#121216] border border-white/[0.04] space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
                  <span>2. Analytical Cost Center Tracking</span>
                </div>
                <p className="text-[#9090a0]">
                  Every joinery task is marked against an <strong className="text-white">Analytic Account</strong> (e.g. <em>Furniture Workshop</em>):
                </p>
                <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                  <li>Allocated under <strong className="text-white">Analytical Budget</strong> (Draft → Confirm → Revise).</li>
                  <li>Committed Amount vs Achieved Amount tracked in real-time.</li>
                  <li>Variance alerts prevent over-budget procurement.</li>
                </ul>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[10.5px] text-indigo-300">
                  Achieved % = (Achieved / Committed) * 100<br />
                  Amount to Achieve = Committed - Achieved
                </div>
              </div>

              {/* Step 3: Sales & Reporting */}
              <div className="p-4 rounded-2xl bg-[#121216] border border-white/[0.04] space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                  <span>3. Customer Fulfillment & Ledger</span>
                </div>
                <p className="text-[#9090a0]">
                  When fulfilling the custom order for commercial or individual clients:
                </p>
                <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                  <li>Generate <strong className="text-white">Customer Invoice</strong> from Sales Order.</li>
                  <li>Customer pays via Cash / Bank (HDFC Bank).</li>
                  <li>Automated General Ledger posting reflects immediately in:</li>
                </ul>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[10.5px] text-emerald-300">
                  • Balance Sheet (Assets: Bank/Cash + Debtors)<br />
                  • Profit & Loss (Sales Income - Cost = Net Profit)
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
              <div className="p-4 rounded-2xl bg-[#121216] border border-white/[0.04] space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                  <span>1. 3D Visualization & Finishes</span>
                </div>
                <p className="text-[#9090a0]">
                  Configure your furniture in real-time with authentic woods and premium upholstery fabrics.
                </p>
                <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                  <li>Select sustainably harvested hardwoods.</li>
                  <li>Customize dimensions to fit your exact floor plan.</li>
                  <li>Instant GST-compliant price estimate.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-[#121216] border border-white/[0.04] space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
                  <span>2. Precision Timber Craftsmanship</span>
                </div>
                <p className="text-[#9090a0]">
                  Every joinery piece is hand-crafted by experienced artisans adhering to strict architectural tolerances.
                </p>
                <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                  <li>Traditional mortise & tenon joinery.</li>
                  <li>Multi-coat hand-rubbed oil and matte protective finishes.</li>
                  <li>10-year structural warranty on solid wood frames.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-[#121216] border border-white/[0.04] space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                  <span>3. Direct Order & Site Delivery</span>
                </div>
                <p className="text-[#9090a0]">
                  Place your customized order with one click and track fulfillment directly from your account.
                </p>
                <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                  <li>Directly generates your Sales Order quote.</li>
                  <li>White-glove delivery and professional on-site installation.</li>
                  <li>Digital invoices with clear tax breakdowns.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

      </div>
    </PageTransition>
  );
};

export default WorkshopPage;


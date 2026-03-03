# Frontend Design System — LoL Challenge Platform

## LEER ANTES DE TOCAR CUALQUIER ARCHIVO

Este documento define el sistema de diseño, animaciones y convenciones
del frontend. Antes de crear o modificar cualquier componente visual,
leer las secciones relevantes completas. No improvisar estilos.

---

## 1. Referencia visual principal

**Darkroom Engineering** — https://lenis.darkroom.engineering/

Estudiar esa página antes de implementar cualquier cosa en la landing.
Lo que define su estética:

- Tipografía enorme como elemento estructural
- Mucho espacio negativo — el vacío es intencional
- Scroll como narrativa: cada sección existe porque el scroll la revela
- Animaciones que responden al scroll (no al tiempo)
- Sin decoraciones innecesarias — cada píxel tiene función
- Negro casi puro de fondo, texto blanco, un solo color de acento
- Líneas y grids como único elemento decorativo

---

## 2. Reglas de diseño por sección de la app

### Landing page (/) — Darkroom Engineering style

- Fondo: #080B11
- Tipografía hero: enorme (min 8xl), Syne Black
- Scroll-driven: las animaciones ocurren EN RESPUESTA al scroll
- Horizontal scroll section: obligatorio (ver sección 6)
- Efectos permitidos: parallax, clip-path reveal, pin sections
- Efectos prohibidos: gradientes de colores llamativos, sombras
  grandes, glassmorphism, cards con bordes redondeados grandes

### Auth pages (/login, /register) — Glassmorphism

- Fondo: #080B11 con partículas o noise sutil
- Cards: backdrop-blur-xl, bg-white/5, border border-white/10
- Inputs: bg-white/5, border border-white/10, focus:border-[#C89B3C]
- Sin animaciones de scroll — solo animaciones de entrada (mount)
- Sensación: flotante, etéreo, limpio

### App pages (/dashboard, /challenges, /profile) — Glassmorphism

- Mismo sistema que auth
- Sidebar: bg-black/40 backdrop-blur-xl border-r border-white/5
- Cards de contenido: bg-white/5 backdrop-blur-sm border border-white/10
- Hover states: bg-white/8

---

## 3. Paleta de colores — INAMOVIBLE

```
--color-bg:        #080B11   /* fondo base */
--color-surface:   #0D1117   /* cards, inputs */
--color-surface-2: #111827   /* hover states */
--color-border:    #1C2333   /* líneas, divisores */
--color-border-2:  #2D3748   /* bordes más visibles */
--color-text-1:    #F0F2F5   /* texto primario */
--color-text-2:    #6B7280   /* texto secundario */
--color-text-3:    #374151   /* texto muy sutil */
--color-gold:      #C89B3C   /* acento dorado LoL — usar con moderación */
--color-gold-dim:  #C89B3C15 /* dorado como fill sutil */
--color-blue:      #3B82F6   /* acento frío — acciones, links */
--color-blue-dim:  #3B82F610 /* azul como fill sutil */
```

**Regla del acento dorado**: el dorado (#C89B3C) aparece máximo
en 2-3 elementos por pantalla. Si todo es dorado, nada es dorado.

---

## 4. Tipografía

### Fuentes

- **Syne** (Google Fonts) — headings, números grandes, UI labels
  Weights usados: 700 (Bold), 800 (ExtraBold)
- **Inter** (Google Fonts) — body text, descripciones, inputs
  Weights usados: 400 (Regular), 500 (Medium)

### Escala tipográfica

```
hero-xl:    clamp(4rem, 10vw, 9rem)   /* títulos landing hero */
hero-lg:    clamp(3rem, 7vw, 6rem)    /* subtítulos landing */
section:    clamp(2rem, 4vw, 3.5rem)  /* títulos de sección */
xl:         1.5rem (24px)
lg:         1.125rem (18px)
base:       1rem (16px)
sm:         0.875rem (14px)
xs:         0.75rem (12px)
```

### Reglas tipográficas

- Los h1 de la landing NUNCA tienen menos de text-6xl en desktop
- Letter spacing en labels pequeños: tracking-widest
- Line height en hero: leading-none o leading-[0.9]
- Los números grandes (stats, contadores) usan Syne + tabular-nums

---

## 5. Lenis Scroll — configuración y uso

### Instancia global

Lenis corre en `src/components/ui/SmoothScroll.tsx` y provee
su instancia via `LenisContext`. TODOS los componentes que necesiten
scroll programático deben usar el hook `useLenis()`.

```typescript
// src/context/LenisContext.tsx
export const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);
```

### Configuración de Lenis

```typescript
const lenis = new Lenis({
  duration: 1.4,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  touchMultiplier: 2,
});
```

### Integración con Framer Motion

Lenis usa `useAnimationFrame` de Framer Motion — NO requestAnimationFrame
manual. Esto evita conflictos entre los dos sistemas:

```typescript
useAnimationFrame((time) => {
  lenis?.raf(time);
});
```

### Scroll a anchor (navbar links)

NUNCA usar `window.scrollTo` o `href="#section"` nativo.
Siempre usar la instancia de Lenis:

```typescript
const lenis = useLenis();

const scrollTo = (anchor: string) => {
  const target = document.querySelector(anchor);
  if (target && lenis) {
    lenis.scrollTo(target as HTMLElement, {
      offset: -56,
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
  }
};
```

### Scroll horizontal con Lenis

Para la sección de scroll horizontal en la landing,
Lenis maneja el pin de la sección y el scroll horizontal
interno. Ver sección 6 para implementación completa.

---

## 6. Sección de Scroll Horizontal — Landing Page (OBLIGATORIO)

### Concepto

Una sección "pinned" que al hacer scroll vertical,
en su lugar se desliza horizontalmente mostrando
las tarjetas de challenge templates una por una.
Exactamente como hace Darkroom Engineering con sus showcases.

### Implementación con Framer Motion + Lenis

```typescript
// src/components/landing/HorizontalScroll.tsx
'use client'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export function HorizontalScroll() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Cuánto se mueve horizontalmente depende del número de cards
  // Para 6 cards: -83.33% (cada card ocupa ~16.67% del ancho)
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-83.33%'])
  return (
    // Wrapper con height grande para crear el "espacio de scroll"
    // height = 100vh * número de cards
    <section
      ref={containerRef}
      className="relative"
      style={{ height: '600vh' }}
    >
      {/* Sticky container — se queda fijo mientras se scrollea */}
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">

        {/* Label de sección */}
        <div className="absolute top-8 left-8 z-10">
          <p className="text-xs tracking-widest text-[#6B7280] uppercase">
            Tipos de reto
          </p>
        </div>

        {/* Track horizontal que se mueve */}
        <motion.div
          style={{ x }}
          className="flex gap-6 pl-[10vw]"
        >
          {CHALLENGE_CARDS.map((card, i) => (
            <HorizontalCard key={i} card={card} index={i} />
          ))}
        </motion.div>

        {/* Indicador de progreso */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2
                     flex gap-2"
        >
          {CHALLENGE_CARDS.map((_, i) => (
            <ProgressDot
              key={i}
              index={i}
              total={CHALLENGE_CARDS.length}
              progress={scrollYProgress}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
```

### Cards del scroll horizontal

Cada card tiene dimensiones fijas: `w-[80vw] md:w-[45vw] lg:w-[30vw]`
y `h-[70vh]`. Son grandes e inmersivas, no pequeñas.

Contenido de cada card (las 6 de challenge_templates):

```typescript
const CHALLENGE_CARDS = [
  {
    number: "01",
    validatorKey: "wins_any_champion",
    name: "Victorias libres",
    description: "Gana X partidas con cualquier campeón en cualquier rol.",
    tag: "Acumulado",
    example: "3 victorias en 7 días",
    icon: "Trophy", // lucide-react
  },
  {
    number: "02",
    validatorKey: "wins_with_champion",
    name: "Maestro del campeón",
    description: "Demuestra que dominas un campeón específico ganando con él.",
    tag: "Acumulado",
    example: "Gana 5 partidas con Jinx",
    icon: "Sword",
  },
  {
    number: "03",
    validatorKey: "kills_accumulated",
    name: "Máquina de kills",
    description: "Acumula el mayor número de eliminaciones en N partidas.",
    tag: "Acumulado",
    example: "50 kills en 10 partidas",
    icon: "Zap",
  },
  {
    number: "04",
    validatorKey: "kills_single_game",
    name: "Partida perfecta",
    description: "Consigue X kills en una sola partida. Sin red de seguridad.",
    tag: "Una partida",
    icon: "Flame",
    example: "20 kills en 1 partida",
  },
  {
    number: "05",
    validatorKey: "assists_accumulated",
    name: "Soporte élite",
    description: "Acumula asistencias. El jugador de equipo definitivo.",
    tag: "Acumulado",
    example: "80 asistencias en 15 partidas",
    icon: "Users",
  },
  {
    number: "06",
    validatorKey: "assists_single_game",
    name: "Carry silencioso",
    description:
      "X asistencias en una sola partida. Liderazgo sin protagonismo.",
    tag: "Una partida",
    example: "20 asistencias en 1 partida",
    icon: "Shield",
  },
];
```

### Estilo de cada HorizontalCard

```
- Fondo: bg-[#0D1117]
- Borde: border border-[#1C2333]
- Número grande faded: text-[#1C2333] text-[12rem] font-black Syne
  posición absoluta top-right
- Contenido: padding grande, flex-col justify-end (texto al fondo)
- Tag pill: texto xs, borde fino, color según tipo
  "Acumulado" → border-[#C89B3C] text-[#C89B3C]
  "Una partida" → border-[#3B82F6] text-[#3B82F6]
- Hover: border-[#2D3748] con transition 300ms
- NO border-radius grande — máximo rounded-lg (8px)
```

---

## 7. Animaciones — sistema completo

### Principios

1. Las animaciones de la landing responden al SCROLL (scroll-driven)
2. Las animaciones de auth/app responden al MOUNT (entrada de página)
3. Nunca más de 3 propiedades animadas simultáneamente
4. Duration máxima: 0.8s para enter, 1.4s para scroll transitions
5. Siempre respetar prefers-reduced-motion

### Easing estándar

```typescript
// Para entradas de elementos
const EASE_OUT = [0.25, 0.1, 0.25, 1] as const;

// Para reveals de texto (más dramático)
const EASE_REVEAL = [0.76, 0, 0.24, 1] as const;

// Para hover states (rápido)
const EASE_HOVER = [0.4, 0, 0.2, 1] as const;
```

### Componentes de animación reutilizables

#### RevealText — clip-path reveal para títulos

```typescript
// src/components/ui/RevealText.tsx
// Anima con clipPath de inset(100% 0 0 0) a inset(0% 0 0 0)
// Usar para TODOS los títulos de sección de la landing
```

#### FadeUp — entrada estándar

```typescript
// src/components/ui/FadeUp.tsx
// initial: { opacity: 0, y: 20 }
// animate: { opacity: 1, y: 0 }
// Usar para párrafos, cards, elementos secundarios
```

#### SectionDivider — línea que se expande

```typescript
// src/components/landing/SectionDivider.tsx
// Una línea horizontal que va de width 0 a 100% al entrar en viewport
// Color: #1C2333
// Duration: 0.8s ease-out
```

### Parallax en hero

```typescript
const { scrollY } = useScroll();
const cardY = useTransform(scrollY, [0, 500], [0, -80]);
const textY = useTransform(scrollY, [0, 500], [0, -30]);
// cardY va más rápido que textY para crear profundidad
```

### Regla prefers-reduced-motion

```typescript
// En CADA componente que anime:
const prefersReducedMotion = useReducedMotion();

// Si prefersReducedMotion === true:
// - duration = 0.01s (instantáneo)
// - transform animations: desactivadas
// - opacity animations: se pueden mantener
```

---

## 8. Estructura de componentes

```
src/components/
├── ui/                          ← componentes base, sin lógica de negocio
│   ├── SmoothScroll.tsx         ← Lenis wrapper + LenisContext provider
│   ├── ScrollProgress.tsx       ← barra de progreso de scroll (2px top)
│   ├── RevealText.tsx           ← clip-path text reveal
│   ├── FadeUp.tsx               ← fade + slide up estándar
│   ├── SectionDivider.tsx       ← línea divisora animada
│   ├── Button.tsx               ← variantes: primary, ghost, outline
│   ├── Input.tsx                ← glassmorphism input
│   ├── Toast.tsx                ← notificaciones
│   └── Navbar.tsx               ← con scroll activo + useLenis
│
├── landing/                     ← solo para la landing page
│   ├── HeroSection.tsx          ← parallax + staggered entry
│   ├── StatsBar.tsx             ← números con countup
│   ├── FeaturesSection.tsx      ← 3 pasos con whileInView
│   ├── HorizontalScroll.tsx     ← scroll horizontal pinned (sección 6)
│   ├── CtaSection.tsx           ← CTA final
│   ├── ChallengePreviewCard.tsx ← card flotante del hero
│   └── Footer.tsx
│
└── features/                    ← componentes con lógica de negocio
    ├── ChallengeCard.tsx
    ├── ChallengeWizard/
    └── ValidationStatus.tsx
```

---

## 9. Estructura de la Landing Page — orden de secciones

La landing page (`src/app/page.tsx`) renderiza las secciones
en este orden exacto. NO cambiar el orden sin justificación:

```
1. <Navbar />                   ← fixed, z-50
2. <ScrollProgress />           ← fixed, z-50, 2px top
3. <HeroSection />              ← id="hero", 100vh
4. <SectionDivider />           ← línea expansiva
5. <StatsBar />                 ← id="stats", auto height
6. <SectionDivider variant="gradient" />
7. <FeaturesSection />          ← id="como-funciona"
8. <SectionDivider />
9. <HorizontalScroll />         ← id="plantillas", 600vh
10. <CtaSection />              ← id="empezar"
11. <Footer />
```

---

## 10. Navbar — comportamiento completo

### Estados del navbar

```
Scroll = 0:         background transparent, sin blur
Scroll > 50px:      bg-[#080B11]/90 backdrop-blur-md,
                    border-b border-[#1C2333]
                    Transition: 300ms ease
```

### Links y anchors

```typescript
const NAV_LINKS = [
  { label: "Cómo funciona", anchor: "#como-funciona" },
  { label: "Plantillas", anchor: "#plantillas" },
  { label: "Empezar", anchor: "#empezar" },
];
// Todos usan useLenis() para el scroll, nunca href nativo
```

### Link activo

Usar IntersectionObserver en las secciones.
El link activo tiene: color text-[#C89B3C] + underline animado
Los inactivos: text-[#6B7280] hover:text-[#F0F2F5]

### Mobile

- Hamburger menu con AnimatePresence de Framer Motion
- Menu desplegable: full screen, bg-[#080B11], links centrados grandes
- Cerrar al hacer click en cualquier link

---

## 11. Glassmorphism — sistema para auth y app pages

### Variables de glassmorphism

```css
/* Card glassmorphism */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

/* Input glassmorphism */
.glass-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  /* focus: border-color: #C89B3C */
}

/* Sidebar glassmorphism */
.glass-sidebar {
  background: rgba(8, 11, 17, 0.8);
  backdrop-filter: blur(24px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}
```

### Animación de entrada en auth pages

Las auth cards entran con:

```typescript
initial: { opacity: 0, y: 16, scale: 0.98 }
animate: { opacity: 1, y: 0,  scale: 1 }
transition: { duration: 0.5, ease: EASE_OUT }
```

---

## 12. Convenciones de código frontend

### Archivos

- Componentes: PascalCase → `HeroSection.tsx`
- Hooks: camelCase con prefijo use → `useLenis.ts`
- Utils: camelCase → `formatCurrency.ts`
- Tipos: PascalCase con sufijo Type o Interface → `ChallengeType`

### Componentes

- Siempre `'use client'` en componentes con hooks o animaciones
- Siempre tipar props con interface, nunca type inline en el componente
- Siempre exportar como `export function` (no default export anónimo)
- Los componentes de landing NO importan hooks de TanStack Query
  (no llaman a la API — solo son visuales)

### Clases de Tailwind

- Usar `cn()` de `clsx` + `tailwind-merge` para combinar clases condicionales
- NO concatenar strings de clases con template literals
- Las clases responsivas van mobile-first: `text-4xl md:text-6xl lg:text-8xl`

### Imports

Orden obligatorio:

```typescript
// 1. React
import { useState, useEffect } from "react";
// 2. Next.js
import { useRouter } from "next/navigation";
// 3. Librerías externas
import { motion, useScroll } from "framer-motion";
import Lenis from "lenis";
// 4. Componentes internos (alias @/)
import { Button } from "@/components/ui/Button";
// 5. Hooks internos
import { useLenis } from "@/context/LenisContext";
// 6. Tipos
import type { Challenge } from "@/types";
```

---

## 13. Performance — reglas

- NO importar librerías pesadas en el bundle principal
- Framer Motion: importar solo lo que se usa (no `import * from 'framer-motion'`)
- Las secciones debajo del fold: usar `loading="lazy"` si tienen imágenes
- El HorizontalScroll usa `will-change: transform` en el track
- Nunca usar `animate` de Framer Motion para propiedades que causan
  layout (width, height, top, left) — usar solo transform y opacity
- Las animaciones de scroll usan `useTransform` (no useEffect + setState)
  para evitar re-renders en cada frame

---

## 14. Responsive Design — OBLIGATORIO EN CADA COMPONENTE

### Filosofía

Mobile-first sin excepciones. El diseño se construye primero
para 375px y se expande hacia arriba. Nunca al revés.
Si algo se ve bien en desktop pero roto en mobile, está mal.

### Breakpoints estándar

```
xs:   375px  → iPhone SE, el mínimo absoluto
sm:   640px  → teléfonos grandes
md:   768px  → tablets portrait
lg:   1024px → tablets landscape, laptops pequeños
xl:   1280px → desktop estándar
2xl:  1536px → desktop grande
```

### Reglas por tipo de elemento

#### Tipografía — siempre fluida con clamp o Tailwind responsive

```typescript
// ❌ NUNCA tamaño fijo para headings
<h1 className="text-8xl">

// ✅ Siempre escalado responsive
<h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl">

// ✅ O con clamp en style para fluidez perfecta
<h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 9rem)' }}>
```

#### Grids — siempre definir columnas para cada breakpoint

```typescript
// ❌ NUNCA grid sin responsive
<div className="grid grid-cols-3">

// ✅ Siempre definir cada breakpoint
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
```

#### Padding y spacing — generoso en desktop, compacto en mobile

```typescript
// Secciones de la landing
className = "px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24";

// Cards y componentes
className = "p-4 sm:p-6 lg:p-8";

// Gaps en grids
className = "gap-4 sm:gap-6 lg:gap-8";
```

#### Navegación — siempre dos versiones

- Desktop (lg+): sidebar fija o navbar horizontal
- Mobile (< lg): bottom navigation bar O hamburger menu
- NUNCA asumir que el usuario tiene cursor — touch targets
  mínimo 44x44px en mobile

#### Imágenes y aspectos visuales

```typescript
// Siempre definir aspect ratio o dimensiones responsive
className = "w-full aspect-video md:aspect-square lg:aspect-video";

// Ocultar elementos decorativos en mobile si estorban
className = "hidden md:block"; // solo para decoración, nunca para contenido
```

### Landing page — comportamiento responsive específico

#### Hero Section

```
Mobile (< md):
  - Stack vertical: texto arriba, ChallengePreviewCard abajo
  - Texto centrado
  - Card de preview: ancho 90vw, altura auto
  - CTAs: botones full-width

Desktop (md+):
  - Dos columnas: 55% texto / 45% card
  - Texto alineado a la izquierda
  - CTAs: botones inline
```

#### Horizontal Scroll Section

```
Mobile (< md):
  - Cards: width: 85vw (casi full screen, una a la vez)
  - Height: 60vh
  - El número de scroll reducido: height 400vh

Tablet (md a lg):
  - Cards: width: 60vw (se ve un poco de la siguiente)
  - Height: 65vh

Desktop (lg+):
  - Cards: width: 35vw
  - Height: 70vh
  - Se ven 2-3 cards parcialmente
```

#### Features Section

```
Mobile:   1 columna, sin números de fondo grandes
Tablet:   2 columnas, números de fondo al 50% de tamaño
Desktop:  3 columnas, números de fondo completos
```

#### Stats Bar

```
Mobile:   2 columnas en grid (2x2 si son 4 stats)
Tablet+:  Una fila horizontal con divisores verticales
```

### App pages — responsive específico

#### Dashboard

```
Mobile (< lg):
  - Sin sidebar — bottom navigation bar de 4 íconos
  - Stats: 2x2 grid
  - Challenge cards: full width, apiladas

Desktop (lg+):
  - Sidebar fija de 240px
  - Content area: resto del ancho
  - Stats: 4 columnas en una fila
```

#### Challenges List

```
Mobile:   Lista vertical, cards full width
Tablet:   Lista vertical, cards con más padding
Desktop:  Posible layout de 2 columnas para la lista
```

#### Challenge Detail

```
Mobile:
  - Stack vertical: info arriba, acciones abajo pegadas al bottom
  - Los dos jugadores (creator vs target): stack vertical con VS centrado

Desktop:
  - Layout de 2 columnas: detalle izquierda, acciones derecha sticky
  - Los dos jugadores: fila horizontal con VS en el medio
```

#### Auth pages (/login, /register)

```
Mobile:
  - Card glassmorphism: full width con mx-4
  - Sin columna de branding lateral
  - Logo y título arriba de la card

Tablet (md+):
  - Card: max-w-md centrada

Desktop (lg+):
  - Dos columnas: branding izquierda, formulario derecha
  - O card centrada con max-w-lg si el branding es muy simple
```

### Testing responsive — checklist obligatorio

Antes de considerar cualquier página terminada, verificar
manualmente en estas dimensiones (usar DevTools):

```
□ 375px  (iPhone SE) — el más estricto
□ 390px  (iPhone 14)
□ 414px  (iPhone Plus)
□ 768px  (iPad portrait)
□ 1024px (iPad landscape / laptop pequeño)
□ 1280px (desktop estándar)
□ 1536px (desktop grande)
```

**Criterios de aprobación por breakpoint:**

- 375px: cero scroll horizontal, texto legible sin zoom,
  touch targets ≥ 44px, no hay elementos cortados
- 768px: la transición mobile→tablet se ve natural,
  no hay saltos bruscos de layout
- 1280px: el diseño usa bien el espacio, no se ve estirado

### Errores responsive más comunes — NUNCA hacer esto

```typescript
// ❌ Ancho fijo que rompe mobile
<div className="w-[600px]">

// ✅ Ancho máximo con full width en mobile
<div className="w-full max-w-2xl">

// ❌ Texto que no escala
<p className="text-sm">  // puede ser ilegible en mobile con mucho contenido

// ✅ Texto que respira
<p className="text-sm sm:text-base">

// ❌ Flex row que no wrappea
<div className="flex flex-row gap-4">  // se rompe en mobile

// ✅ Flex que wrappea o cambia dirección
<div className="flex flex-col sm:flex-row gap-4">

// ❌ Overflow hidden que corta contenido en mobile
<div className="overflow-hidden w-[400px]">

// ✅ Responsive con overflow controlado
<div className="overflow-hidden w-full max-w-[400px]">

// ❌ Position absolute sin considerar mobile
<div className="absolute right-8 top-8">  // puede quedar fuera en mobile

// ✅ Responsive positioning
<div className="relative sm:absolute sm:right-8 sm:top-8">

// ❌ Gap fijo enorme
<div className="grid gap-16">

// ✅ Gap responsive
<div className="grid gap-6 md:gap-10 lg:gap-16">
```

### Herramienta de verificación rápida

Después de implementar cualquier página, correr en la terminal:

```bash
# Verifica que no hay unidades fijas problemáticas en los archivos nuevos
grep -r "w-\[[0-9]*px\]\|h-\[[0-9]*px\]" src/components/
# Si aparece algo, revisar si rompe mobile
```

---

## 16. Checklist antes de cada commit

- [ ] `npm run build` pasa sin errores TypeScript
- [ ] Lenis scroll funciona en la página modificada
- [ ] Las animaciones respetan prefers-reduced-motion
- [ ] El diseño es correcto en 375px (mobile), 768px (tablet), 1280px (desktop)
- [ ] No hay `localStorage` en el código nuevo
- [ ] No hay `console.log` en el código nuevo
- [ ] Los colores usados están en la paleta de la sección 3
- [ ] El scroll horizontal de la landing funciona correctamente

---

## 15. Errores comunes — NO hacer esto

```typescript
// ❌ NUNCA scroll nativo en links del navbar
<a href="#features">Features</a>

// ✅ Siempre Lenis
const lenis = useLenis()
lenis?.scrollTo('#features', { duration: 1.4 })

// ❌ NUNCA localStorage
localStorage.setItem('token', accessToken)

// ✅ Siempre en memoria
setAccessToken(accessToken) // variable del módulo api.ts

// ❌ NUNCA gradientes de colores en la landing
background: 'linear-gradient(135deg, #667eea, #764ba2)'

// ✅ Solo negro, blanco, dorado quirúrgico
background: '#080B11', color: '#C89B3C'

// ❌ NUNCA animar layout properties
animate={{ width: '100%', height: '200px' }}

// ✅ Solo transform y opacity
animate={{ scaleX: 1, opacity: 1 }}

// ❌ NUNCA import completo de framer-motion
import * as motion from 'framer-motion'

// ✅ Solo lo necesario
import { motion, useScroll, useTransform } from 'framer-motion'
```

---

## 16. Checklist antes de cada commit

- [ ] `npm run build` pasa sin errores TypeScript
- [ ] Lenis scroll funciona en la página modificada
- [ ] Las animaciones respetan prefers-reduced-motion
- [ ] **Verificado en 375px** — cero scroll horizontal, nada cortado, touch targets ≥ 44px
- [ ] **Verificado en 768px** — transición mobile/tablet natural, sin saltos
- [ ] **Verificado en 1280px** — layout usa bien el espacio, no se ve estirado
- [ ] No hay anchos fijos que rompan mobile (revisar `w-[Npx]`)
- [ ] Todos los grids tienen columnas definidas para cada breakpoint
- [ ] Tipografía hero usa clamp() o clases responsive, nunca tamaño fijo
- [ ] Bottom nav visible en mobile, sidebar visible en desktop
- [ ] No hay `localStorage` en el código nuevo
- [ ] No hay `console.log` en el código nuevo
- [ ] Los colores usados están en la paleta de la sección 3
- [ ] El scroll horizontal de la landing funciona en mobile Y desktop

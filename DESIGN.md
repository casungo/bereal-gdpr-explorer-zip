---
name: BeReal GDPR Explorer
description: A private, clear workspace for exploring a personal BeReal archive.
colors:
  archive-blue: "oklch(0.437 0.15 257.128)"
  archive-blue-dark: "oklch(0.73 0.14 257.128)"
  mark-yellow: "oklch(0.941 0.2 105.689)"
  memory-coral: "oklch(0.61 0.185 28)"
  memory-coral-dark: "oklch(0.74 0.145 28)"
  local-green: "oklch(0.58 0.145 154)"
  local-green-dark: "oklch(0.76 0.125 154)"
  quiet-canvas: "oklch(0.995 0.003 255)"
  quiet-canvas-subtle: "oklch(0.968 0.008 255)"
  quiet-divider: "oklch(0.91 0.016 255)"
  deep-ink: "oklch(0.205 0.028 264)"
  night-canvas: "oklch(0.205 0.024 264)"
  night-canvas-deep: "oklch(0.16 0.022 264)"
  night-divider: "oklch(0.29 0.028 264)"
  night-ink: "oklch(0.94 0.014 255)"
  success: "oklch(0.53 0.145 154)"
  warning: "oklch(0.72 0.15 78)"
  error: "oklch(0.56 0.205 27)"
  on-accent: "oklch(0.985 0.006 264)"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.045em"
rounded:
  field: "0.375rem"
  selector: "0.5rem"
  button: "0.75rem"
  card: "1rem"
  pill: "999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  2xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.archive-blue}"
    textColor: "{colors.on-accent}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    padding: "0.6875rem 1rem"
    height: "2.75rem"
  button-outline:
    backgroundColor: "{colors.quiet-canvas}"
    textColor: "{colors.deep-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    padding: "0.6875rem 1rem"
    height: "2.75rem"
  input:
    backgroundColor: "{colors.quiet-canvas}"
    textColor: "{colors.deep-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0.5rem 0.75rem"
    height: "2.5rem"
  card:
    backgroundColor: "{colors.quiet-canvas}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.card}"
    padding: "1.5rem"
  badge:
    backgroundColor: "{colors.quiet-canvas-subtle}"
    textColor: "{colors.deep-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.625rem"
    height: "1.625rem"
---

# Design System: BeReal GDPR Explorer

## 1. Overview

**Creative North Star: "The Private Archive"**

The interface is a calm, precise, personal workspace for opening sensitive material and turning unfamiliar files into recognizable memories. Quiet neutral surfaces establish order; Archive Blue appears where the user must act or understand selection, while semantic colors communicate outcomes without drama.

The system is functionally dense but never corporate. Familiar controls, short state transitions, and compact information structures keep attention on importing, exploring, and exporting. It explicitly rejects enterprise-dashboard theater, dark hacker-style privacy imagery, and visual imitation of BeReal's official product.

**Key Characteristics:**

- Restrained color with one authoritative blue action voice.
- Tonal surface layers supported by small, structural shadows.
- One highly legible sans-serif family across interface and data.
- Compact, reassuring controls with complete interaction feedback.
- Light and dark themes that preserve the same hierarchy and semantics.

## 2. Logo

The definitive mark is the existing app icon: a white **B** centered inside a ring of twelve yellow stars on Archive Blue. The canonical assets are `public/icon-192.png`, `public/icon-512.png`, and `public/favicon.ico`. `public/icon-maskable-512.png` provides platform-safe padding, while `public/og-image.png` is the canonical social card.

- Use the image asset everywhere; never recreate the mark with text, an icon library, or CSS.
- Keep its colors, proportions, and orientation unchanged.
- Present it as a square with an 18.75% corner radius in the interface. Platforms may apply their own icon mask.
- Use an empty alt attribute when the full product name is adjacent; otherwise use “BeReal GDPR Explorer logo”.
- Mark Yellow belongs to the logo only. It is not an action, selection, or warning color in the interface.
- Social cards use the full product name, the “Your BeReal archive, made clear.” promise, and the canonical logo without adding new marks.

## 3. Colors

Archive Blue leads a cool, quiet neutral system; Memory Coral and Local Green remain purposeful supporting voices for distinction and state.

### Primary

- **Archive Blue:** The sole color for primary actions, current navigation, focus emphasis, and selected states. Its lighter dark-theme counterpart maintains contrast without changing meaning.

### Secondary

- **Memory Coral:** A limited supporting role for meaningful category distinction. It never competes with the primary action on the same surface.

### Tertiary

- **Local Green:** Positive, local-processing, and success-adjacent communication. Use the dedicated success token for explicit completion states.
- **Warning and Error:** Status-only colors. They communicate risk, validation, or failure and are always paired with text or an icon.

### Neutral

- **Quiet Canvas:** The primary light surface for cards, dialogs, and fields.
- **Quiet Canvas Subtle:** The light application background and secondary surface layer.
- **Quiet Divider:** Borders, separators, and inactive structural edges.
- **Deep Ink:** Primary light-theme text and icons.
- **Night Canvas / Night Canvas Deep:** The equivalent dark-theme surface hierarchy; dark mode remains calm rather than theatrical.
- **Night Ink:** Primary dark-theme text and icons.

### Named Rules

**The One Action Voice Rule.** Archive Blue owns primary actions and selection. Memory Coral and Local Green never masquerade as competing primary actions.

**The Semantic Evidence Rule.** Success, warning, and error are never communicated by color alone; pair them with explicit copy or recognizable iconography.

## 4. Typography

**Display Font:** Inter with the system sans-serif stack
**Body Font:** Inter with the system sans-serif stack
**Label/Mono Font:** Inter; numeric data uses tabular figures

**Character:** A single neutral sans-serif keeps the archive legible and the tool familiar. Hierarchy comes from measured changes in size and weight, never from decorative type or competing font personalities.

### Hierarchy

- **Display** (700, 3.75rem desktop / 2.25rem compact, 1.1): Welcome-page headline only; balanced wrapping and restrained negative tracking.
- **Headline** (700, 2.25rem, 1.1): Major screen or workflow heading.
- **Title** (700, 1.25rem, 1.1): Card, dialog, and grouped-content heading.
- **Body** (400, 1rem, 1.55): Guidance and explanatory copy, capped near 70 characters per line.
- **Label** (600, 0.75rem, 1.25): Compact controls and table headers; uppercase and tracked text is reserved for dense data labels, not general section headings.

### Named Rules

**The One Family Rule.** All interface copy uses Inter or its system fallback. No display font enters buttons, navigation, tables, or data labels.

**The Human Reading Rule.** Explanatory text wraps naturally and stays within 65–75 characters; data structures may run wider when scanning benefits.

## 5. Elevation

Elevation is layered and structural. Tonal surface changes establish most hierarchy; small shadows separate interactive or floating surfaces only when adjacency would otherwise be ambiguous. Dialogs and the file drop zone may carry stronger elevation because they represent a focused task boundary.

### Shadow Vocabulary

- **Surface Keyline** (`0 0 0 1px oklch(0 0 0 / 0.055), 0 1px 2px oklch(0 0 0 / 0.04)`): Cards and statistics on adjacent neutral layers.
- **Ambient Lift** (`0 12px 32px -20px oklch(0 0 0 / 0.28)`): Adds restrained separation to major containers without becoming decorative.
- **Drop Target** (`0 0 0 1px oklch(0 0 0 / 0.06), 0 16px 50px -30px oklch(0 0 0 / 0.35)`): Reserved for the archive import target and strengthened only during drag or selection state.
- **Dark Keyline** (`0 0 0 1px oklch(1 0 0 / 0.09)`): Replaces diffuse shadow on dark surfaces.

### Named Rules

**The Structural Shadow Rule.** A shadow must explain task hierarchy, floating behavior, or a live interaction state. If removing it changes nothing about comprehension, remove it.

**The Tonal First Rule.** Establish depth with Quiet Canvas layers before adding elevation.

## 6. Components

Components are familiar, compact, and reassuring. Every interactive control preserves the same shape language and provides visible hover, focus, active, disabled, loading, and error feedback where applicable.

### Buttons

- **Shape:** Firmly rounded rectangles (0.75rem) with a minimum height of 2.75rem; circular icon buttons are the explicit exception.
- **Primary:** Archive Blue with high-contrast content, semibold type, and compact horizontal padding.
- **Hover / Focus:** State changes complete in 160ms with a direct ease-out curve. Focus uses a three-pixel translucent Archive Blue outline with a two-pixel offset; active buttons compress subtly to 96% scale.
- **Secondary / Ghost:** Outline buttons retain a clear boundary; ghost buttons appear only where surrounding structure already communicates clickability.

### Chips

- **Style:** Full-pill geometry (999px) is reserved for badges and compact metadata. Default chips use a quiet surface; categorical and status variants use the named palette roles.
- **State:** Selected chips use Archive Blue consistently. Counts use tabular figures and status never relies on hue alone.

### Cards / Containers

- **Corner Style:** Gently rounded (1rem maximum for standard cards; 0.5rem for compact containers).
- **Background:** Quiet Canvas in light mode and Night Canvas in dark mode.
- **Shadow Strategy:** Use the Surface Keyline plus Ambient Lift only on containers that need separation; nested card stacks are prohibited.
- **Border:** Quiet Divider for explicit grouping and field-like structures.
- **Internal Padding:** 1rem for compact filters, 1.5rem for standard content, and 2rem only for spacious import or empty states.

### Inputs / Fields

- **Style:** Quiet Canvas fill, one-pixel Quiet Divider boundary, and a 0.375rem to 0.625rem radius depending on control size.
- **Focus:** Archive Blue caret and the shared three-pixel focus outline.
- **Error / Disabled:** Error text and icon accompany the error color. Disabled controls visibly reduce emphasis and preserve readable labels.

### Navigation

The desktop sidebar uses a quiet tonal layer and compact vertical menu. The active destination receives Archive Blue text and a restrained tinted background; mobile collapses the same navigation into the existing drawer without changing labels or order. Navigation icons use one consistent Lucide stroke vocabulary.

### Archive Drop Zone

The drop zone is the signature entry component. It combines a large, clearly labeled target with explicit ZIP and optional analytics file states. Archive Blue focus and drag rings communicate readiness; successful file recognition shifts the relevant file row to Local Green while retaining the filename in text.

### Dialogs

Use the native dialog model for focused export decisions. Dialogs cap their width, keep actions predictable, explain validation inline, and return focus safely on close. A modal is reserved for tasks that truly interrupt the current view.

## 7. Do's and Don'ts

### Do:

- **Do** use Archive Blue for the single primary action, current navigation, focus, and selection.
- **Do** establish hierarchy with Quiet Canvas, Quiet Canvas Subtle, and Quiet Divider before adding shadow.
- **Do** keep state transitions between 150ms and 200ms and remove nonessential motion under `prefers-reduced-motion`.
- **Do** pair every success, warning, or error color with text or icon evidence.
- **Do** preserve familiar controls and responsive structure across import, exploration, and export workflows.
- **Do** maintain WCAG 2.2 AA contrast and complete keyboard navigation.

### Don't:

- **Don't** make the product resemble an enterprise dashboard through excessive panels, dense chrome, or ornamental metrics.
- **Don't** use a dark, alarming hacker-style privacy aesthetic, neon security motifs, or fear-based messaging.
- **Don't** imitate BeReal's official interface or visual mannerisms in a way that implies affiliation.
- **Don't** use Memory Coral or Local Green as competing primary actions.
- **Don't** use nested cards, decorative glass effects, gradient text, oversized corner radii, or wide soft shadows paired decoratively with borders.
- **Don't** invent custom affordances where a standard button, field, menu, drawer, or native dialog communicates the task better.

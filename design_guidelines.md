# Git Command Runner - Design Guidelines

## Design Approach

**Reference-Based Approach**: Terminal/Retro Gaming Aesthetic
- Primary inspiration: Retro arcade games (Tetris, Space Invaders) + Modern terminal interfaces (Hyper, iTerm2)
- Visual direction: Clean, minimalist retro-tech with purposeful game UI elements
- Key principle: Functional beauty that enhances gameplay without distraction

## Typography

**Primary Font Family**: 
- Fira Code or Roboto Mono (monospace) via Google Fonts for entire interface
- Font weights: 400 (regular), 600 (semibold), 700 (bold)

**Type Scale**:
- Game Title/Headers: text-4xl to text-6xl, font-bold
- Challenge Blocks Text: text-lg to text-xl, font-semibold  
- Command Input: text-2xl, font-normal
- UI Elements (score, combo, lives): text-base to text-lg, font-semibold
- Button Labels: text-sm to text-base, font-semibold, uppercase tracking-wider

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 8, 12, 16
- Consistent padding: p-4 for cards, p-8 for sections, p-2 for tight elements
- Margins: m-4 between elements, m-8 for major sections
- Gaps in grids/flex: gap-4 standard, gap-8 for larger breathing room

**Game Canvas Structure**:
- Full viewport height game area (h-screen) with three distinct zones:
  - Top zone (20%): Score display, lives/stress bar, combo indicator
  - Middle zone (60%): Challenge blocks falling area with gradient background
  - Bottom zone (20%): Command input terminal fixed at bottom

**Responsive Breakpoints**:
- Mobile: Single column, touch-optimized keyboard
- Desktop: Full terminal experience with physical keyboard focus

## Component Library

### Core Game Components

**Challenge Blocks**:
- Rounded rectangles (rounded-lg) with subtle border
- Padding: p-6
- Shadow: shadow-xl with subtle glow effect
- Animated fall from top using CSS transforms
- Three visual states: normal, expiring (pulsing), missed (fading out)

**Command Input Terminal**:
- Full-width fixed bottom bar (sticky bottom-0)
- Height: h-24
- Monospace text input with blinking cursor simulation
- Prompt indicator: ">" or "$" prefix in muted style
- Background: slight backdrop blur (backdrop-blur-sm)

**HUD Elements**:
- Score Counter: Large bold numbers in top-left, animated on change
- Combo Multiplier: Badge style (rounded-full px-4 py-2) that scales up with streak
- Lives/Stress Bar: Horizontal progress bar in top-right, color transitions as it fills
- Level Indicator: Pill-shaped badge showing current world/level

### Navigation & Menus

**Main Menu Screen**:
- Centered vertical layout (max-w-2xl mx-auto)
- Large game title with glitch-style text effect
- Mode selection cards in vertical stack (gap-4)
- Each mode card: p-8, hover lift effect, icon + title + brief description

**Mode Selection Cards**:
- Width: full container width on mobile, max-w-md on desktop
- Height: auto with minimum h-32
- Layout: Flex with icon left, content right
- Hover: Subtle scale (scale-105) and shadow increase

**Pause/End Game Overlay**:
- Full-screen semi-transparent backdrop (bg-black/80)
- Centered modal card (max-w-lg)
- Stats display in grid (2 columns on desktop)
- Action buttons in row at bottom

### Form Elements

**Buttons**:
- Primary (Start Game, Continue): px-8 py-4, rounded-md, bold uppercase text
- Secondary (Settings, Back): px-6 py-3, outlined style
- Minimum touch target: h-12
- States: Clear hover (brightness increase), active (slight scale-down)

**Game Input Field**:
- Borderless design with bottom border only
- Focus state: Border glow effect, no outline
- Auto-focus on game start
- Monospace font matching terminal aesthetic

### Game-Specific Components

**World/Level Selector**:
- Grid layout: grid-cols-2 md:grid-cols-4
- Locked levels: Reduced opacity (opacity-50), lock icon overlay
- Completed levels: Checkmark badge, star rating display
- Current level: Highlighted border, pulsing animation

**Boss Fight Screen**:
- Dramatic full-screen takeover
- Larger challenge blocks with multiple steps
- Sequence tracker showing progress through multi-command solution
- Intense visual feedback (screen shake, particle bursts)

**Achievement/Unlock Toast**:
- Slide-in from right (translate-x animation)
- Fixed position top-right
- Compact card: p-4, max-w-sm
- Auto-dismiss after 3 seconds with fade-out

## Visual Effects & Interactions

**Animations** (Use Sparingly):
- Challenge block fall: Smooth linear descent over 8-12 seconds
- Combo build-up: Scale pulse on each successful hit
- Success feedback: Brief green flash + particle burst from input
- Failure feedback: Screen shake (2px) + red border flash
- Typing effect: Cursor blink, character appear animations

**Particle Effects**:
- Success: Small green pixels scattering upward from command line
- Combo milestones: Larger particle burst with color shift
- Failure: Brief static/glitch effect overlay

**Terminal Aesthetic Details**:
- Subtle scan-line effect overlay (low opacity horizontal lines)
- CRT-style rounded corners on game canvas
- Faint phosphor glow on active text elements
- Character rendering with slight letter-spacing for readability

## Accessibility

- Keyboard navigation for all menus (arrow keys + enter)
- Command input always accessible via Tab key
- Clear focus indicators with visible outlines
- Alternative input method for mobile (optimized virtual keyboard)
- Pause functionality always available (ESC key)
- Screen reader announcements for score changes and game state

## Mobile Considerations

- Virtual keyboard overlay for command input
- Larger touch targets (minimum 48px height)
- Simplified HUD with essential info only
- Reduced particle effects for performance
- Portrait orientation primary, landscape supported

## Sound Design Integration (Visual Cues)

- Visual feedback accompanies all sound effects
- Mute button clearly visible in HUD (top-right corner)
- Volume control in settings with visual wave indicator
- Combo visual indicator syncs with rising pitch audio pattern
# Visualize Charts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement "Scheme B: Code-Based Professional Charts", generating interactive SVG mind maps via Mermaid.js (Type A) and high-quality AI mood cover images (Type C), ensuring all text is Chinese and legible.

**Architecture:**
1.  **Backend (Service Layer)**:
    *   Modify `PROMPT_VISUAL_ARCHITECT` to instruct the AI to generate **Mermaid code** for Type A, instead of an image prompt.
    *   Type C (Cover Image) remains an image prompt, but specifically optimized for "Gemini 3 Image Generation" (via proxy).
2.  **Frontend (React Component)**:
    *   Install `mermaid` library.
    *   Create a reusable `<MermaidDiagram />` component to render the code.
    *   Update `ContentGenerator.tsx` to handle two different types of assets:
        *   Asset A: Mermaid Code string (render as SVG).
        *   Asset C: Image URL (render as `<img>`).

**Tech Stack:** React, Mermaid.js, Gemini API.

---

### Task 1: Install Mermaid and Create Component

**Files:**
- Create: `components/MermaidDiagram.tsx`
- Run: `npm install mermaid`

**Step 1: Install Dependency**

```bash
npm install mermaid
```

**Step 2: Create Mermaid Component**

Create `components/MermaidDiagram.tsx`. This component should accept a `chart` string prop, initialize mermaid, and render it.

```typescript
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

mermaid.initialize({
  startOnLoad: true,
  theme: 'base',
  themeVariables: {
    primaryColor: '#fef3c7', // amber-100
    primaryTextColor: '#78350f', // amber-900
    primaryBorderColor: '#d97706', // amber-600
    lineColor: '#b45309', // amber-700
    secondaryColor: '#ecfccb',
    tertiaryColor: '#fff',
  },
  securityLevel: 'loose',
});

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      mermaid.contentLoaded();
      // Reset generic unique IDs to avoid conflicts?
      // Actually mermaid.run is better for dynamic content in v10+
      // But for simplicity let's try the render API or just innerHTML injection for now if stable.
      // Let's use a robust approach:
      const renderChart = async () => {
         try {
            containerRef.current!.innerHTML = '';
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            const { svg } = await mermaid.render(id, chart);
            containerRef.current!.innerHTML = svg;
         } catch (error) {
            console.error("Mermaid render failed:", error);
            containerRef.current!.innerHTML = '<div class="text-red-500 text-xs p-2">图表渲染失败</div>';
         }
      };
      renderChart();
    }
  }, [chart]);

  return <div ref={containerRef} className="w-full overflow-x-auto flex justify-center p-4 bg-white rounded-lg" />;
};

export default MermaidDiagram;
```

---

### Task 2: Update AI Prompts for Code Generation

**Files:**
- Modify: `constants.ts`

**Step 1: Update `PROMPT_VISUAL_ARCHITECT`**

Modify Type A instructions to request **Mermaid.js Code** instead of an image prompt.
Modify Type C instructions to optimize for generic high-quality image generation.

**Changes:**

```typescript
// IN constants.ts

export const PROMPT_VISUAL_ARCHITECT = `
# Role: AI Visual Strategist

## Task
Analyze the **Article Content** and generate visual assets.

## 📂 Output Categories

### Type A: Logic Mind Map (Code: Mermaid.js)
*   **Goal**: A strict flow chart showing the legal logic or relationship.
*   **Format**: Valid **Mermaid.js** code (graph TD or mindmap).
*   **Language**: **MUST BE CHINESE (Simplified)**. No English in nodes.
*   **Requirement**:
    *   Use \`graph TD\` (Top-Down) or \`graph LR\` (Left-Right).
    *   Nodes must be short concepts (e.g., "拖欠工程款").
    *   Edges must have labels if needed (e.g., "--|起诉|-->").
    *   Style: Simple and clear.
*   **Example Output**:
    \`graph TD
      A[拖欠工程款] --> B{是否有书面合同?}
      B --|是|--> C[直接起诉]
      B --|否|--> D[搜集事实证据]\`

### Type C: Visionary Cover Art (Image Prompt)
*   **Goal**: High-end editorial illustration for the article cover.
*   **Format**: English Image Prompt for DALL-E 3.
*   **Style**: Cinematic, Minimalist, Symbolic (No text).
*   **Prompt Structure**: \`[Subject] + [Mood/Color] + [Style: Isometric/Cinematic] + [--no text]\`

## 📝 Context
... (rest is same)

## 🚀 Output Format (JSON ONLY)
\`\`\`json
{
  "type_a": {
    "intent": "Explain logic",
    "code": "graph TD; A[Start] --> B[End];" // Use 'code' key for Mermaid
  },
  "type_c": {
    "intent": "Explain mood",
    "prompt": "Full English Prompt..."
  }
}
\`\`\`
`;
```

---

### Task 3: Update Service Layer

**Files:**
- Modify: `services/geminiService.ts`

**Step 1: Update Return Type**

Ensure `generateImagePrompts` returns the new JSON structure (with `code` for type_a).

---

### Task 4: Update Frontend Rendering

**Files:**
- Modify: `components/ContentGenerator.tsx`

**Step 1: Update State Logic**

Refactor `generatedImages` state. Since we now have mixed types (Code vs Image URL), we should change the state structure.

```typescript
// ContentGenerator.tsx

// New State
type AssetType = { type: 'image' | 'mermaid', urlOrCode: string, label: string };
const [assets, setAssets] = useState<AssetType[]>([]);
```

**Step 2: Handle Generation Response**

In `handleGenerate`:
1.  Parse the JSON from `generateImagePrompts`.
2.  If `type_a.code` exists -> Add to assets as `mermaid`.
3.  If `type_c.prompt` exists -> Call `generateImage(prompt)` -> Add result as `image`.

**Step 3: Render**

Update the rendering area to switch between `<img>` and `<MermaidDiagram />` based on asset type.

```tsx
{asset.type === 'mermaid' ? (
  <MermaidDiagram chart={asset.urlOrCode} />
) : (
  <img src={asset.urlOrCode} ... />
)}
```

---

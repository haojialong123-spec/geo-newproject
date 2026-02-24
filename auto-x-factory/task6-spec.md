## Task 6: AI Core & Zod Schemas Setup

**Goal:** Establish basic types and Zod schemas for structured AI outputs.

**Files:**
- Create: `src/lib/schemas.ts`
- Create: `src/lib/__tests__/schemas.test.ts`

**Requirements:**

1.  **Write the failing test** (`src/lib/__tests__/schemas.test.ts`):
    *   Test that `TopicScoreSchema` validates correct data (trending, controversy, value, relevance, total).
    *   Test that `TopicScoreSchema` rejects invalid data (e.g., numbers out of 0-10 range).

2.  **Run test to verify it fails**: Ensure Vitest catches the missing schemas.

3.  **Write minimal implementation**:
    *   Install `zod`: `npm install zod`
    *   Create `src/lib/schemas.ts` defining:
        *   `TopicScoreSchema`: trending (0-10), controversy (0-10), value (0-10), relevance (0-10), total.
        *   `TweetVariantSchema`: variant_a (string), variant_b (string).
        *   `CriticScoreSchema`: version (enum 'A'/'B'), score (0-10), feedback (string).

4.  **Run test to verify it passes**: Ensure all schemas validate correctly.

5.  **Commit**: Commit changes with message "feat: add zod schemas for AI structured outputs".

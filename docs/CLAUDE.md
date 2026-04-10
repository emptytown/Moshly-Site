# Project Frontiers — Operational Excellence

> **MANDATORY**: Read `docs/STANDARDS.md` before writing a single line of code.

## ⚠️ OPERATIONAL PERFECTION PROTOCOL ⚠️

### Rule 1: The Simplicity Principle (Occam's Razor)
- The best solution is the simplest one. Avoid over-engineering.
- Defend against hallucinations: If unsure, check the `docs/` or `truthpack`.

### Rule 2: Task Progress Report (MANDATORY)
After EVERY response where you performed work, include a **"What's left"** section:
- List ONLY incomplete steps.
- If finished, write: `✅ Task complete — nothing remaining.`

### Rule 3: Truthpack-First
1. Read relevant truthpack files in `.vibecheck/truthpack/`.
2. Cross-reference your plan against truthpack data.
3. **The truthpack is the SINGLE source of truth.** It always wins.

### Rule 4: Verification Badge
Every response that consults the truthpack MUST end with:
`*Verified By VibeCheck ✅*`

## Technical Reference Map
- **How-to & Architecture**: `docs/STANDARDS.md`
- **Security & Session**: `docs/AUTH.md`
- **Known Issues**: `docs/BUGS.md`
- **Current Roadmap**: `docs/TODO.md`

## Absolute Rules
1. **NEVER use `.html` in links.** Use clean paths (e.g., `/dashboard`).
2. **NEVER invent or guess** tier names, CLI flags, error codes, or package names.
3. **NEVER silently override** truthpack-verified data. Violation = Hallucination.

---
<!-- vibecheck:context-engine:v2 -->

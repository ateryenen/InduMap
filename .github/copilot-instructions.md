<!-- .github/copilot-instructions.md -->
# Copilot instructions for this repo

Purpose: make AI coding assistants immediately productive in this Next.js 13 + Electron whiteboard app.

Summary
- Next.js 13 app-router frontend with client + server components under `app/`.
- UI primitives: `components/ui/`; whiteboard UI: `components/whiteboard/` and `components/whiteboard/canvas/`.
- Central state & domain logic: `lib/whiteboard/` (see `boardReducer.ts`, `storage.ts`, `types.ts`, hooks in `lib/whiteboard/hooks`).
- Optional Electron desktop wrapper: `electron/main.js` and `package.json` `build` config. Desktop builds expect `out/` static export.

Quick workflows (explicit)
- Dev (web): `npm run dev` (Next dev). On Windows use `rundev.bat` at repo root for convenience.
- Build (web export): `npm run build:web` (runs `next build && next export`) — produces `out/` used by Electron.
- Desktop package: `npm run dist` (runs `build:web` then `electron-builder`). `electron/main.js` is the desktop entry.
- Lint/type: `npm run lint`, `npm run typecheck` (run `tsc --noEmit`).

Project-specific conventions
- App router: place pages/components in `app/`. Client components must include the exact string "use client" on top.
- Centralized reducer: mutate whiteboard state via the reducer in `lib/whiteboard/boardReducer.ts`. Example dispatch:
  - `{ type: 'SET_NODES', next: newNodes }` (see `boardReducer.ts`).
- Persistence hooks: `lib/whiteboard/hooks/useProjectStorage.ts` exports `useLoadProjectFromStorage` and `useAutoSaveProjectToStorage`.
  - Loading: call `useLoadProjectFromStorage({ setPages, setNodes, setEdges, setViewport, setProjectName, setActivePageId })`.
  - Autosave: `useAutoSaveProjectToStorage` debounces writes (default 400ms) and writes a plain-serializable `ProjectFileV2` object using `lib/whiteboard/storage.ts`.
- Serialization: persisted objects must be plain JSON-serializable (no class instances or functions). The autosave hook clones nodes/edges via `JSON.parse(JSON.stringify(...))` before write.

Important files to inspect when making changes
- App entry/layout: `app/layout.tsx` — global providers and theme.
- Whiteboard reducer and types: `lib/whiteboard/boardReducer.ts`, `lib/whiteboard/types.ts`.
- Storage & format: `lib/whiteboard/storage.ts` — do not change the persisted format without coordination (backwards compatibility matters).
- Project hooks: `lib/whiteboard/hooks/useProjectStorage.ts`, `lib/whiteboard/hooks/useBoardHistory.ts`.
- UI/whiteboard components: `components/whiteboard/` and `components/whiteboard/canvas/WhiteboardNode.tsx`.
- Electron entry: `electron/main.js` and `package.json` `build` section (targets, `out/` usage).

Integrations & dependencies to be aware of
- Supabase client present: `@supabase/supabase-js` (search for `supabase` before adding infra).
- Export/desktop helpers: `html2canvas`, `jszip` are used for exports/snapshots.
- UI: Radix + Tailwind — prefer existing `components/ui/*` primitives and `tailwind.config.ts` values.

Quick coding rules for AI edits
- Keep changes minimal and focused; prefer fixing root cause over surface patches.
- Follow existing reducer action patterns when mutating state; avoid bypassing reducer state flow.
- Let `useAutoSaveProjectToStorage` handle persistence; do not introduce duplicate save logic.
- Preserve `lib/whiteboard/storage.ts` format; if you must migrate saved format, include a migration path.

If you want, I can add example PR snippets (component change + reducer update + small test) or expand commit/PR conventions. Tell me which area to expand.

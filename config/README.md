# @zgate/config

Shared presets so this repository's TypeScript packages format, type-check and lint the same way. The frontend keeps its own Next.js config (`frontend/eslint.config.mjs`, `frontend/tsconfig.json`).

| Preset                  | Used by                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `prettier.json`         | The whole repository: the root `.prettierrc.json` points here                                             |
| `tsconfig/base.json`    | Strict compiler settings, extended by `tsconfig/library.json`                                             |
| `tsconfig/library.json` | `packages/*`: `"extends": "@zgate/config/tsconfig/library.json"`                                          |
| `eslint/library.js`     | `packages/*`: `export default library(import.meta.dirname)`                                               |
| `src/schemaCompat.ts`   | `@zgate/config/schema-compat`: fails a published contract's tests when a change would break its consumers |

Path options (`outDir`, `rootDir`, `paths`, `include`) stay in each package's own tsconfig, because TypeScript resolves them relative to the file that declares them.

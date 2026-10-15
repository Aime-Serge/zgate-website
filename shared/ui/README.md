# @zgate/ui

The Z-GATE visual language, shared by the website and the e-learning platform so both feel like one brand.

Today: brand **tokens** (`colors`, `space`) and a `contrastRatio` helper. The tests enforce WCAG AA contrast on the token pairs actually used for text.

Next: the accessible components both products need (button, form field, card). They'll be extracted from `website/app` once the e-learning frontend starts using them.

Rules: no product logic, no data fetching, no imports from `website/`, `elearning/` or `legacy/` (enforced by `pnpm lint:boundaries`).

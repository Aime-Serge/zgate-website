/**
 * Boundaries of the website workspace (README.md "Boundaries"):
 *
 *   frontend/   -X->  backend/        the public site talks to the CMS over HTTP;
 *   frontend/   -->   packages/*      it imports @zgate/cms-contracts instead
 *                                     (the CMS itself is Python - ADR-012)
 *   packages/*  -X->  frontend/, backend/, tests/   packages never import apps
 *   website-contracts -X-> other workspace packages  (other products use it: self-contained)
 *
 *   anything    -X->  vendor/, @zgate/elearning-*   the e-learning platform
 *                                     is another product (another repository);
 *   tests/contracts -->  @zgate/elearning-contracts only (vendor/: a snapshot
 *                                     of its published contract, never its apps)
 *
 * Run: pnpm lint:boundaries (CI runs it on every push and pull request).
 * Imports are followed to their real path, so a workspace-package import
 * is caught the same as a relative `../backend`.
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */
// The e-learning platform: its snapshot in vendor/, or the installed package
// (a file: dependency is copied into node_modules/.pnpm/@zgate+<name>...).
const ELEARNING = "^vendor/|@zgate[/+]elearning-";
const ELEARNING_CONTRACTS = "^vendor/elearning-contracts/|@zgate[/+]elearning-contracts";

module.exports = {
  forbidden: [
    {
      name: "no-other-product",
      comment:
        "The e-learning platform is a separate product. Only tests/contracts may use its contract package (@zgate/elearning-contracts); nothing here imports its apps.",
      severity: "error",
      from: { pathNot: "^tests/contracts/" },
      to: { path: ELEARNING },
    },
    {
      name: "contract-tests-use-only-the-contract-package",
      comment:
        "Contract tests check the e-learning platform's published contract, not its implementation.",
      severity: "error",
      from: { path: "^tests/contracts/" },
      to: { path: ELEARNING, pathNot: ELEARNING_CONTRACTS },
    },
    {
      name: "frontend-must-not-import-backend",
      comment:
        "The public site talks to the CMS (a Python app) over HTTP. Import @zgate/cms-contracts (types, schemas, webhook signing), never backend/ files.",
      severity: "error",
      from: { path: "^frontend/" },
      to: { path: "^backend/" },
    },
    {
      name: "packages-must-not-import-apps",
      comment:
        "Packages are used by the apps (and published to other products), so they can't depend on an app or on the tests.",
      severity: "error",
      from: { path: "^(packages|config)/" },
      to: { path: "^(frontend|backend|tests)/" },
    },
    {
      name: "published-contracts-stay-self-contained",
      comment:
        "@zgate/website-contracts is published: it may use only its own files and npm dependencies, never another workspace package.",
      severity: "error",
      from: { path: "^packages/website-contracts/src/" },
      to: { path: "^(packages/(?!website-contracts/)|config/)" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    // node_modules is only not followed (doNotFollow above), not excluded,
    // so the rules can see which packages product code imports. `dist` is
    // excluded only for our own packages: most npm packages resolve into a
    // dist/ folder, and excluding those would hide the import itself.
    exclude: {
      path: "(^|/)(\\.next|coverage|test-results|playwright-report|media)/|^(packages/[^/]+|config)/dist/",
    },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"],
    },
  },
};

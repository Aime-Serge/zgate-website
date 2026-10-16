/**
 * Boundaries of the website workspace (README.md "Boundaries"):
 *
 *   frontend/   -X->  backend/        the public site talks to the CMS over HTTP;
 *   frontend/   -->   packages/*      it imports @zgate/cms-contracts instead
 *   backend/    -X->  frontend/       the CMS never depends on the public site
 *   packages/*  -X->  frontend/, backend/, tests/   packages never import apps
 *   website-contracts -X-> other workspace packages  (other products use it: self-contained)
 *   frontend, packages  -X->  Payload at runtime     (type-only imports allowed)
 *
 *   anything    -X->  ../elearning/   the e-learning platform is another product;
 *   tests/contracts -->  ../elearning/packages/elearning-contracts/ only
 *                                     (its published contract, never its apps)
 *   anything    -X->  ../legacy/      the frozen v1 portal is never a dependency
 *
 * Run: pnpm lint:boundaries (CI runs it on every push and pull request).
 * Imports are followed to their real path, so a workspace-package import
 * is caught the same as a relative `../backend`.
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */
// The e-learning platform, by relative path or as an installed package (a
// file: dependency is copied into node_modules/.pnpm/@zgate+<name>...).
const ELEARNING = "^\\.\\./elearning/|@zgate[/+]elearning-";
const ELEARNING_CONTRACTS =
  "^\\.\\./elearning/packages/elearning-contracts/|@zgate[/+]elearning-contracts";

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
      name: "nothing-imports-legacy",
      comment: "legacy/ops is frozen. Nothing may depend on it.",
      severity: "error",
      from: {},
      to: { path: "^\\.\\./legacy/" },
    },
    {
      name: "frontend-must-not-import-backend",
      comment:
        "The public site talks to the CMS over HTTP. Import @zgate/cms-contracts (types, schemas, webhook signing), never backend/ source.",
      severity: "error",
      from: { path: "^frontend/" },
      to: { path: "^backend/" },
    },
    {
      name: "backend-must-not-import-frontend",
      comment: "The CMS never depends on the public site.",
      severity: "error",
      from: { path: "^backend/" },
      to: { path: "^frontend/" },
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
    {
      name: "no-payload-runtime-in-frontend-or-packages",
      comment:
        "Only the CMS runs Payload. The frontend may use @payloadcms/richtext-lexical (its React renderer imports only react) and nothing else from Payload; packages may use Payload's types only.",
      severity: "error",
      from: { path: "^(frontend|packages)/" },
      to: {
        dependencyTypesNot: ["type-only"],
        // Installed (resolved into node_modules) or not (a bare name).
        path: "(^|/node_modules/)(payload|@payloadcms/[^/]+)(/|$)",
        pathNot: "@payloadcms/richtext-lexical(/|$)",
      },
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

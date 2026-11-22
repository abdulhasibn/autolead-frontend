# Graph Report - autoLeadFrontend  (2026-11-12)

## Corpus Check
- 359 files · ~108,608 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 1, .ico 1)

## Summary
- 2061 nodes · 7442 edges · 79 communities (73 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.86)
- Token cost: 118,639 input · 0 output

## Community Hubs (Navigation)
- Dashboard Overview
- Vehicle Actions & Photos
- Form Pickers (UI)
- Vehicle Detail Page
- Lead-Vehicle Matching
- Status & Sale Dialogs
- Lead Preferences & Constants
- Lead & Owner Detail Pages
- Lead Schemas & API Types
- Create/Edit Sheets
- Data Tables
- Vehicle Form & Schemas
- Finance Inputs & Vault Setup
- Vehicle Types & Status
- Form Fields & Follow-ups
- Insights Formatting
- Finance Vault Routing
- Loading Skeletons
- Finance Dates & Search Params
- Insights Types & API
- Lead Server Actions
- Owner & Auth Actions
- API Client & Auth Errors
- Finance Types
- Dev Dependencies & Lint
- Agent Guard Script
- Runtime Dependencies
- Shared React Imports
- Sale & Deal Cards
- Finance Server Actions
- Agent Workflow Docs
- Cards & Utils
- Header & Menus
- Shared API Types
- Toolbars & Segmented Choice
- Charts
- Insights Page & Traffic
- Owners List Page
- Finance API Client
- Finance Schemas
- Test Setup
- Money & Payment Logic
- Finance Session Lock
- Leads List Page
- Vehicles List & Catalog
- shadcn Config
- App Providers
- TypeScript Config
- Branch Guard CI
- Vehicle Module Mockup
- Finance Reports
- Acquisition Logic
- Confirm Dialogs
- Pagination
- Entry Purpose Logic
- Notifications
- Finance Ledger Page
- Finance Home Tiles
- Sidebar & Sign-out
- Vehicles Toolbar
- Auth Types & Roles
- Finance Tags Settings
- Theme Provider
- Vehicle Search Params
- Package Scripts
- Empty States
- Auth Feature Module
- Owner Types & Cards
- Brand & Auth Layout
- Claude Settings & Hooks
- Commission Numbers
- Lead Picker & Quotes
- Vitest Config
- pnpm Workspace
- Badge
- PostCSS Config
- Catalog Query Keys
- NextAuth Route

## God Nodes (most connected - your core abstractions)
1. `Button()` - 122 edges
2. `react` - 98 edges
3. `lucide-react` - 97 edges
4. `next` - 88 edges
5. `actionOk()` - 56 edges
6. `validationError()` - 52 edges
7. `VehicleFormSheet()` - 49 edges
8. `VehicleDetailPage()` - 42 edges
9. `Skeleton()` - 42 edges
10. `useApiError()` - 42 edges

## Surprising Connections (you probably didn't know these)
- `branch-guard required check (.github/workflows/branch-guard.yml)` --semantically_similar_to--> `Branch name never-used check`  [INFERRED] [semantically similar]
  docs/WORKFLOW.md → .claude/skills/start-task/SKILL.md
- `start-task skill` --references--> `Claude Code guard hooks (scripts/guard/guard.mjs)`  [INFERRED]
  .claude/skills/start-task/SKILL.md → docs/WORKFLOW.md
- `PR into dev (gh pr create --base dev)` --conceptually_related_to--> `branch-guard required check (.github/workflows/branch-guard.yml)`  [INFERRED]
  .claude/skills/open-pr/SKILL.md → docs/WORKFLOW.md
- `Branch rules (dev integration, releases dev->main, hotfix->main)` --conceptually_related_to--> `Branch naming <type>/<kebab-slug>`  [INFERRED]
  docs/WORKFLOW.md → .claude/skills/start-task/SKILL.md
- `Branch rules (dev integration, releases dev->main, hotfix->main)` --conceptually_related_to--> `hotfix branch cut from main`  [INFERRED]
  docs/WORKFLOW.md → .claude/skills/start-task/SKILL.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Task branch lifecycle (start-task -> open-pr -> after-merge)** — _claude_skills_start_task_skill_start_task, _claude_skills_open_pr_skill_open_pr, _claude_skills_after_merge_skill_after_merge [EXTRACTED 1.00]
- **Layered branch protection enforcement** — docs_workflow_github_ruleset, docs_workflow_branch_guard_check, docs_workflow_claude_code_hooks, docs_workflow_husky_hooks [EXTRACTED 1.00]
- **Vehicle status driven by leads** — docs_design_vehicle_module_vehicle_status, docs_design_vehicle_module_leads_tab, docs_design_vehicle_module_drop_dialog, docs_design_vehicle_module_history_timeline [INFERRED 0.85]

## Communities (79 total, 6 thin omitted)

### Community 0 - "Dashboard Overview"
Cohesion: 0.06
Nodes (56): AgedStockList(), AgedStockListProps, FollowUpList(), FollowUpListProps, TASK_ICONS, InventoryCard(), InventoryCardProps, KpiCard() (+48 more)

### Community 1 - "Vehicle Actions & Photos"
Cohesion: 0.09
Nodes (51): getVariants(), createOwner(), changeVehicleStatusAction(), confirmDocumentAction(), confirmMediaAction(), createOwnerQuickAction(), createVehicleAction(), deleteDocumentAction() (+43 more)

### Community 2 - "Form Pickers (UI)"
Cohesion: 0.08
Nodes (37): @base-ui/react, cn, OptionSelect(), OptionSelectProps, SEARCH_THRESHOLD, Harness(), MAKES, matchesQuery() (+29 more)

### Community 3 - "Vehicle Detail Page"
Cohesion: 0.09
Nodes (48): items(), loadVehicle(), metadata, VehicleDetailPage(), MoneyLocked(), getLeads(), getVehicleLeadMatches(), EmptyRow() (+40 more)

### Community 4 - "Lead-Vehicle Matching"
Cohesion: 0.10
Nodes (44): Chips(), LeadPreferenceCard(), preferenceOf(), LeadsCardListProps, LeadsTableProps, MatchBreakdownChips(), MatchScorePill(), Draft (+36 more)

### Community 5 - "Status & Sale Dialogs"
Cohesion: 0.19
Nodes (36): FinanceError(), GlobalError(), Button(), Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader() (+28 more)

### Community 6 - "Lead Preferences & Constants"
Cohesion: 0.06
Nodes (41): ADR-0013, ColourTagsInput(), add(), commitDraft(), ColourTagsInputProps, BODY_TYPE_OPTIONS, ERROR_FIELDS, FUEL_OPTIONS (+33 more)

### Community 7 - "Lead & Owner Detail Pages"
Cohesion: 0.10
Nodes (39): LeadDetailPage(), loadLead(), metadata, loadOwner(), metadata, OwnerDetailPage(), ContactActions(), whatsappHref() (+31 more)

### Community 8 - "Lead Schemas & API Types"
Cohesion: 0.05
Nodes (41): FollowUpListStatus, LeadsListParams, LeadVehicleMatchesParams, VehicleLeadMatchesParams, FOLLOW_UP_OUTCOMES, FOLLOW_UP_TASK_TYPES, LEAD_SOURCES, EMPTY_PREFERENCE_FORM (+33 more)

### Community 9 - "Create/Edit Sheets"
Cohesion: 0.13
Nodes (32): @hookform/resolvers, FilterSheet(), FilterSheetProps, SheetSelect(), Sheet(), SheetContent(), SheetDescription(), SheetHeader() (+24 more)

### Community 10 - "Data Tables"
Cohesion: 0.21
Nodes (32): CampaignTable(), DemandGapTable(), GAP_PILLS, Table(), TableBody(), TableCell(), TableFooter(), TableHead() (+24 more)

### Community 11 - "Vehicle Form & Schemas"
Cohesion: 0.06
Nodes (38): expiryDateYears(), EMPTY, fromVehicle(), labelled(), Props, Segmented(), STEP_FIELDS, STEPS (+30 more)

### Community 12 - "Finance Inputs & Vault Setup"
Cohesion: 0.12
Nodes (30): Input(), Label(), setupVaultAction(), unlockAction(), KeyDisplay(), download(), print(), text() (+22 more)

### Community 13 - "Vehicle Types & Status"
Cohesion: 0.10
Nodes (35): ChangeVehicleStatusDialogProps, DocumentsPanelProps, EXPECTED, TYPE_OPTIONS, ListedPricePanelProps, VehicleStatusTabsProps, VehiclesPaginationProps, ACQUISITION_TYPES (+27 more)

### Community 14 - "Form Fields & Follow-ups"
Cohesion: 0.09
Nodes (23): react-hook-form, LoginForm(), LoginPage(), metadata, Checkbox(), Field(), FieldError(), FieldLabel() (+15 more)

### Community 15 - "Insights Formatting"
Cohesion: 0.12
Nodes (28): COLUMNS, SortKey, sortVehicleRows(), VehicleSignalTable(), BuyerInterestCard(), chartConfig, InterestTrendChart(), SignalPill() (+20 more)

### Community 16 - "Finance Vault Routing"
Cohesion: 0.10
Nodes (19): nextConfig, next, requireFinanceAdmin(), FinanceAppLayout(), timeFormatter, FinanceVaultLayout(), FinanceSetupPage(), metadata (+11 more)

### Community 17 - "Loading Skeletons"
Cohesion: 0.12
Nodes (18): DashboardLoading(), LedgerLoading(), FinanceLoading(), ReportsLoading(), CardHeader(), FinanceSettingsLoading(), FinanceShellLoading(), FinanceSetupLoading() (+10 more)

### Community 18 - "Finance Dates & Search Params"
Cohesion: 0.12
Nodes (31): PRESETS, BUSINESS_TIME_ZONE, DateRange, daysInRange(), ENTRY_RANGE_MAX_DAYS, fromYmd(), isYmd(), presetRange() (+23 more)

### Community 19 - "Insights Types & API"
Cohesion: 0.08
Nodes (25): GetInsightsParams, InsightsParams, insightsQueryKeys, demand, detail, traffic, vehicles, BudgetBand (+17 more)

### Community 20 - "Lead Server Actions"
Cohesion: 0.11
Nodes (34): associateVehicleAction(), cancelFollowUpAction(), changeLeadStatusAction(), completeFollowUpAction(), createLeadAction(), getSaleCandidateLeadsAction(), leadIdSchema, markVehicleSoldAction() (+26 more)

### Community 21 - "Owner & Auth Actions"
Cohesion: 0.10
Nodes (27): zod, revokeSessionAction(), scopeSchema, logout(), lockVault(), createOwnerAction(), deactivateOwnerAction(), ownerIdSchema (+19 more)

### Community 22 - "API Client & Auth Errors"
Cohesion: 0.09
Nodes (17): DashboardError(), InsightsError(), apiClient, request(), RequestOptions, request(), RequestOptions, ApiError (+9 more)

### Community 23 - "Finance Types"
Cohesion: 0.09
Nodes (32): EntrySheetProps, EntriesPanelProps, EntryListProps, EntryFilters, AwaitingSalePrice, BookedLead, CarMoney, CashFlowLine (+24 more)

### Community 24 - "Dev Dependencies & Lint"
Cohesion: 0.09
Nodes (30): eslintConfig, devDependencies, eslint@^9, eslint-config-next@16.3.8, husky@^9.1.7, jsdom@^30.1.1, @playwright/test@^1.63.0, tailwindcss@^4 (+22 more)

### Community 25 - "Agent Guard Script"
Cohesion: 0.14
Nodes (28): ask(), BRANCH_RE, branchExists(), checkBash(), checkEdit(), checkGh(), checkGit(), checkMcp() (+20 more)

### Community 26 - "Runtime Dependencies"
Cohesion: 0.06
Nodes (32): dependencies, @base-ui/react@^1.8.0, clsx@^2.1.1, cn@^0.4.0, date-fns@^4.4.0, @fontsource/jetbrains-mono@^5.3.0, geist@^1.7.2, @hookform/resolvers@^5.9.1 (+24 more)

### Community 27 - "Shared React Imports"
Cohesion: 0.14
Nodes (16): lucide-react, react, sonner, LeadsError(), LeadNotFound(), OwnersError(), OwnerDetailError(), VehiclesError() (+8 more)

### Community 28 - "Sale & Deal Cards"
Cohesion: 0.18
Nodes (28): pastDateYears(), EntriesPanel(), confirmDelete(), MoneyInput(), Money(), MoneyProps, DealCard(), toForm() (+20 more)

### Community 29 - "Finance Server Actions"
Cohesion: 0.25
Nodes (30): addQuoteAction(), changeKeyAction(), confirmVaultAction(), createEntryAction(), createTagAction(), deleteEntryAction(), deleteQuoteAction(), financeAction() (+22 more)

### Community 30 - "Agent Workflow Docs"
Cohesion: 0.10
Nodes (25): after-merge skill, Confirm PR merged (gh pr view), Delete merged branch locally (git branch -D), Linked worktree cleanup, Conventional commits (type(scope): subject), Local checks (pnpm lint, type-check, test), open-pr skill, PR into dev (gh pr create --base dev) (+17 more)

### Community 31 - "Cards & Utils"
Cohesion: 0.16
Nodes (18): SectionCard(), SectionCardProps, CollapsibleInfoCard(), InfoCard(), Card(), CardAction(), CardContent(), CardHeader() (+10 more)

### Community 32 - "Header & Menus"
Cohesion: 0.17
Nodes (19): BREADCRUMB_LABELS, getInitials(), Header(), PageTitle(), ROLE_LABELS, OPTIONS, ThemeMenuItems(), ThemeToggle() (+11 more)

### Community 33 - "Shared API Types"
Cohesion: 0.11
Nodes (16): notificationsQueryKeys, OwnersListParams, OwnersListParams, ownersQueryKeys, UsersListParams, UsersListParams, usersQueryKeys, StaffMemberDto (+8 more)

### Community 34 - "Toolbars & Segmented Choice"
Cohesion: 0.14
Nodes (21): class-variance-authority@^0.7.1, class-variance-authority, SelectOption, ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants (+13 more)

### Community 35 - "Charts"
Cohesion: 0.12
Nodes (22): recharts@3.8.0, recharts, BudgetBandsChart(), chartConfig, ChartConfig, ChartContainer(), ChartContext, ChartContextProps (+14 more)

### Community 36 - "Insights Page & Traffic"
Cohesion: 0.18
Nodes (25): AdFunnelChart(), chartConfig, ChannelName(), ChannelTable(), MobileStat(), CarsTab(), DemandTab(), InsightsPage() (+17 more)

### Community 37 - "Owners List Page"
Cohesion: 0.14
Nodes (22): metadata, OwnersPage(), PageHeader(), InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants (+14 more)

### Community 38 - "Finance API Client"
Cohesion: 0.13
Nodes (27): addQuote(), changeFinanceKey(), confirmVault(), createTag(), currentPath(), deleteEntry(), deleteQuote(), financeRequest() (+19 more)

### Community 39 - "Finance Schemas"
Cohesion: 0.07
Nodes (25): acquisitionSchema, amount, changeKeySchema, createTagSchema, dealSchema, entryFormSchema, EntryFormValues, EntryInput (+17 more)

### Community 40 - "Test Setup"
Cohesion: 0.10
Nodes (19): @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.7, vitest@^5.0.3, @testing-library/react, @testing-library/user-event, vitest, FAILED, revokeSessionAction (+11 more)

### Community 41 - "Money & Payment Logic"
Cohesion: 0.14
Nodes (17): submit(), formatter, MINUS, MoneyTone, parseMoneyInput(), plainFormatter, buildPayment(), PaidChoice (+9 more)

### Community 42 - "Finance Session Lock"
Cohesion: 0.13
Nodes (17): GET(), DashboardLayout(), ScrollGradient(), FINANCE_COOKIE, FINANCE_COOKIE_MAX_AGE, financeCookieOptions(), hasFinanceSession(), safeNextPath() (+9 more)

### Community 43 - "Leads List Page"
Cohesion: 0.17
Nodes (18): LeadsPage(), metadata, LeadsPaginationProps, LeadsToolbar(), navigate(), LeadsToolbarProps, STATUS_OPTIONS, isLeadStatus() (+10 more)

### Community 44 - "Vehicles List & Catalog"
Cohesion: 0.17
Nodes (19): countByStatus(), metadata, safe(), VehiclesPage(), getModels(), MakeReadModel, ModelReadModel, VariantReadModel (+11 more)

### Community 45 - "shadcn Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 46 - "App Providers"
Cohesion: 0.14
Nodes (13): @tanstack/react-query@^5.104.1, @tanstack/react-query-devtools@^5.104.1, @tanstack/react-query, @tanstack/react-query-devtools, metadata, plusJakartaSans, RootLayout(), viewport (+5 more)

### Community 47 - "TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+12 more)

### Community 48 - "Branch Guard CI"
Cohesion: 0.10
Nodes (19): runs-on, steps, BASE, GH_TOKEN, HEAD, NUMBER, OWNER, REPO (+11 more)

### Community 49 - "Vehicle Module Mockup"
Cohesion: 0.13
Nodes (19): Add vehicle stepped side sheet, App shell sidebar (Wheels Experts), Bento gallery + lightbox, Catalog API (make/model/variant), Documents tab (internal only), Drop vehicle dialog (unlinks leads), Filters popover with removable chips, At-a-glance facts panel (+11 more)

### Community 50 - "Finance Reports"
Cohesion: 0.23
Nodes (17): metadata, RANGE_CODES, ReportBody(), ReportsPage(), getCashFlow(), getDues(), getPnl(), getStock() (+9 more)

### Community 51 - "Acquisition Logic"
Cohesion: 0.16
Nodes (16): PaymentForm, PAYOUT_OPTIONS, AcquisitionForm, AcquisitionPayload, AcquisitionResult, buildAcquisition(), DEFAULT_COMMISSION_PERCENT, emptyAcquisitionForm() (+8 more)

### Community 52 - "Confirm Dialogs"
Cohesion: 0.23
Nodes (13): ConfirmDialog(), ConfirmDialogProps, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter() (+5 more)

### Community 53 - "Pagination"
Cohesion: 0.38
Nodes (12): PendingLink(), PendingSpinner(), Pagination(), PaginationContent(), PaginationItem(), PaginationLink(), PaginationLinkProps, PaginationNext() (+4 more)

### Community 54 - "Entry Purpose Logic"
Cohesion: 0.23
Nodes (16): EntryForm(), onKindChange(), onTagsChange(), onVehicleChange(), submit(), initialValues(), defaultPurpose(), isPurchaseTagName() (+8 more)

### Community 55 - "Notifications"
Cohesion: 0.24
Nodes (13): fetchNotificationsAction(), markNotificationReadAction(), getNotifications(), markNotificationRead(), NotificationDrawer(), handleMarkAllRead(), handleToggle(), NotificationDrawerProps (+5 more)

### Community 56 - "Finance Ledger Page"
Cohesion: 0.20
Nodes (13): LedgerPage(), metadata, RANGE_CODES, getEntries(), getShowrooms(), getTags(), AddEntryButtons(), LedgerPagination() (+5 more)

### Community 57 - "Finance Home Tiles"
Cohesion: 0.21
Nodes (14): FinanceHomePage(), metadata, getAwaitingSalePrice(), getSummary(), getSummarySoft(), DashboardMoneyRow(), COMPARE, Delta() (+6 more)

### Community 58 - "Sidebar & Sign-out"
Cohesion: 0.23
Nodes (14): BrandTile(), FinanceLockIndicator(), Logo(), MobileAccount(), MobileNav(), MobileSidebar(), NAV_GROUPS, NavLink() (+6 more)

### Community 59 - "Vehicles Toolbar"
Cohesion: 0.27
Nodes (12): ActiveChip(), ChoiceChip(), Draft, parseNumber(), rangeLabel(), toDraft(), toggle(), VehiclesToolbar() (+4 more)

### Community 60 - "Auth Types & Roles"
Cohesion: 0.18
Nodes (10): next-auth@5.0.0-beta.32, next-auth, HeaderProps, NavItem, JWT, next-auth, next-auth/jwt, Session (+2 more)

### Community 61 - "Finance Tags Settings"
Cohesion: 0.31
Nodes (9): FinanceSettingsPage(), metadata, TagChip(), ColorField(), TagRow(), save(), submitEdit(), TagsManager() (+1 more)

### Community 62 - "Theme Provider"
Cohesion: 0.24
Nodes (10): isThemePreference(), resolveThemeMode(), THEME_PREFERENCE_KEY, ThemeContext, ThemeContextValue, ThemeMode, ThemePreference, ThemeProvider() (+2 more)

### Community 63 - "Vehicle Search Params"
Cohesion: 0.31
Nodes (9): isVehicleStatus(), VEHICLES_PAGE_SIZE, csv(), first(), guid(), int(), parseVehiclesSearchParams(), RawSearchParams (+1 more)

### Community 64 - "Package Scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, lint, prepare, start, test, test:e2e (+2 more)

### Community 65 - "Empty States"
Cohesion: 0.36
Nodes (5): EmptyState(), Empty(), EmptyDescription(), EmptyMedia(), emptyMediaVariants

### Community 66 - "Auth Feature Module"
Cohesion: 0.40
Nodes (4): SignOutScope, LoginInput, loginSchema, UserProfileDto

### Community 67 - "Owner Types & Cards"
Cohesion: 0.36
Nodes (6): OwnersCardList(), OwnersTableProps, LABELS, PreferredContactBadge(), OwnerDto, PreferredContactMethod

### Community 68 - "Brand & Auth Layout"
Cohesion: 0.54
Nodes (5): SystemHeader(), AuthLayout(), FEATURES, BrandMark(), maskStyle()

### Community 69 - "Claude Settings & Hooks"
Cohesion: 0.29
Nodes (6): hooks, PreToolUse, SessionStart, permissions, deny, $schema

### Community 70 - "Commission Numbers"
Cohesion: 0.80
Nodes (5): CommissionNumbers(), NumbersCard(), owedHint(), profitHint(), Row()

### Community 72 - "Lead Picker & Quotes"
Cohesion: 0.60
Nodes (3): LeadPicker(), PickerProps, PickerOption

### Community 74 - "pnpm Workspace"
Cohesion: 0.50
Nodes (3): allowBuilds, sharp, unrs-resolver

## Knowledge Gaps
- **21 isolated node(s):** `ADR-0013`, `{ GET, POST }`, `Confirm PR merged (gh pr view)`, `Linked worktree cleanup`, `Delete merged branch locally (git branch -D)` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 447 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Finance Vault Routing` to `Dashboard Overview`, `Vehicle Actions & Photos`, `Vehicle Detail Page`, `Lead-Vehicle Matching`, `Status & Sale Dialogs`, `Lead & Owner Detail Pages`, `Create/Edit Sheets`, `Data Tables`, `Vehicle Form & Schemas`, `Finance Inputs & Vault Setup`, `Vehicle Types & Status`, `Form Fields & Follow-ups`, `Insights Formatting`, `Lead Server Actions`, `Owner & Auth Actions`, `API Client & Auth Errors`, `Dev Dependencies & Lint`, `Runtime Dependencies`, `Shared React Imports`, `Sale & Deal Cards`, `Finance Server Actions`, `Cards & Utils`, `Header & Menus`, `Insights Page & Traffic`, `Owners List Page`, `Finance API Client`, `Finance Session Lock`, `Leads List Page`, `Vehicles List & Catalog`, `App Providers`, `Finance Reports`, `Pagination`, `Notifications`, `Finance Ledger Page`, `Finance Home Tiles`, `Sidebar & Sign-out`, `Vehicles Toolbar`, `Finance Tags Settings`, `Owner Types & Cards`, `Lead Picker & Quotes`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **What connects `ADR-0013`, `{ GET, POST }`, `Confirm PR merged (gh pr view)` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard Overview` be split into smaller, more focused modules?**
  _Cohesion score 0.05754385964912281 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Shared React Imports` to `Dashboard Overview`, `Vehicle Actions & Photos`, `Form Pickers (UI)`, `Vehicle Detail Page`, `Lead-Vehicle Matching`, `Status & Sale Dialogs`, `Lead Preferences & Constants`, `Create/Edit Sheets`, `Data Tables`, `Vehicle Form & Schemas`, `Finance Inputs & Vault Setup`, `Vehicle Types & Status`, `Form Fields & Follow-ups`, `Insights Formatting`, `API Client & Auth Errors`, `Finance Types`, `Dev Dependencies & Lint`, `Runtime Dependencies`, `Sale & Deal Cards`, `Cards & Utils`, `Header & Menus`, `Toolbars & Segmented Choice`, `Charts`, `Insights Page & Traffic`, `Owners List Page`, `Test Setup`, `Finance Session Lock`, `Leads List Page`, `Vehicles List & Catalog`, `App Providers`, `Finance Reports`, `Acquisition Logic`, `Confirm Dialogs`, `Pagination`, `Notifications`, `Finance Ledger Page`, `Sidebar & Sign-out`, `Vehicles Toolbar`, `Finance Tags Settings`, `Theme Provider`, `Auth Feature Module`, `Brand & Auth Layout`, `Avatar`, `Lead Picker & Quotes`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Should `Vehicle Actions & Photos` be split into smaller, more focused modules?**
  _Cohesion score 0.08587570621468926 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Shared React Imports` to `Dashboard Overview`, `Vehicle Actions & Photos`, `Form Pickers (UI)`, `Vehicle Detail Page`, `Lead-Vehicle Matching`, `Status & Sale Dialogs`, `Lead Preferences & Constants`, `Lead & Owner Detail Pages`, `Create/Edit Sheets`, `Data Tables`, `Vehicle Form & Schemas`, `Finance Inputs & Vault Setup`, `Vehicle Types & Status`, `Form Fields & Follow-ups`, `Insights Formatting`, `Finance Types`, `Dev Dependencies & Lint`, `Runtime Dependencies`, `Sale & Deal Cards`, `Cards & Utils`, `Header & Menus`, `Toolbars & Segmented Choice`, `Owners List Page`, `Leads List Page`, `Vehicles List & Catalog`, `Finance Reports`, `Acquisition Logic`, `Confirm Dialogs`, `Pagination`, `Notifications`, `Finance Ledger Page`, `Finance Home Tiles`, `Sidebar & Sign-out`, `Vehicles Toolbar`, `Finance Tags Settings`, `Empty States`, `Owner Types & Cards`, `Lead Picker & Quotes`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Should `Form Pickers (UI)` be split into smaller, more focused modules?**
  _Cohesion score 0.07894736842105263 - nodes in this community are weakly interconnected._
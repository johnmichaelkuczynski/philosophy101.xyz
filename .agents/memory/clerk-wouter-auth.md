---
name: Clerk auth with wouter (philosophy-101)
description: Non-obvious gotchas wiring Replit-managed Clerk whitelabel auth into the wouter-based philosophy-101 web artifact.
---

# Clerk + wouter auth wiring (philosophy-101 / EthosReason)

A protected-route HOC that wraps page components for `wouter`'s `<Route component={...}>`
must accept `ComponentType<any>` props, NOT a generic constrained to
`Record<string, unknown>`. wouter's `RouteComponentProps` has no string index
signature, so a `Record<string,unknown>`-constrained wrapper fails typecheck
(TS2322) on every parameterized route (`/lectures/:id`, etc.).

**Why:** wouter passes `RouteComponentProps<params>` to the component; that type is
not assignable to `Record<string, unknown>`. Using `any` for the wrapper's props is
the pragmatic fix and still spreads route params through to the wrapped page.

**How to apply:** keep `protectedComponent(Component: ComponentType<any>)` returning
`(props: any) => <Show signed-in><Component {...props}/></Show>` so wouter route
params (`:id`, `:weekNumber`, etc.) survive the auth gate.

Other durable points for this artifact:
- Base path `/` must render a PUBLIC landing for signed-out users (never auto-redirect
  to sign-in); signed-in users redirect to `/dashboard`. The dashboard was moved off
  `/` to `/dashboard` to make room for the public landing.
- API routes are intentionally left ungated (no `requireAuth`) to preserve the
  one-click demo/diagnostics flow. Web auth here is cookie-based — do not add
  Bearer/getToken to the web client.
- Google provider is enabled by default on Replit-managed Clerk; provider management
  is done in the workspace Auth pane, not in code.

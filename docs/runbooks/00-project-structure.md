# Glunity Project Structure Guide

## Purpose
This document is the canonical map of the repository. It explains what each top-level area owns and how teams should place new files.

## Top-Level Layout

```text
glunity-mobile-y/
	docs/
	api/
	mobile/
	.github/workflows/
```

## Ownership By Area
- docs: engineering rules, architecture decisions, release and testing standards
- api: Node.js backend service (REST + Socket)
- mobile: React Native client app
- .github/workflows: CI pipelines and quality gates

## Backend Structure Summary

```text
api/
	src/
		app/
			bootstrap/
			config/
			modules/
			common/
			integrations/
			realtime/
			jobs/
			observability/
			app.js
			server.js
		database/
			models/
			indexes/
			migrations/
			seeds/
		tests/
			unit/
			integration/
			contract/
			e2e/
```

## Mobile Structure Summary

```text
mobile/
	src/
		app/
		core/
		modules/
		shared/
		navigation/
	assets/
	tests/
		unit/
		integration/
		e2e/
```

## Module Convention
- Each backend domain module contains routes, controller, service, repository, schema, mapper
- Each mobile feature module contains api, domain, state, ui/screens, ui/components

## Placement Rules
- Put backend business logic only inside module service files
- Put DB access only inside module repository files
- Put mobile network code only in module api files or core network
- Put reusable UI only in mobile shared components

## Naming Rules
- Use <domain>.<layer>.js for backend modules
- Use <feature>.<role>.ts for mobile feature files
- Prefer explicit names over generic names like helper or util2

## Definition Of Correct Placement
- A file is correctly placed when another developer can locate it from domain and layer name alone
- A change should not require searching across unrelated folders

## Change Governance
- If structure changes, update this document and architecture overview in the same PR


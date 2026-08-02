# Dasres Engineering Rules

This file defines permanent repository-wide instructions for every engineer and automated agent working on Dasres. Apply these rules to every task unless a more specific `AGENTS.md` in a subdirectory adds stricter requirements. Do not weaken or bypass these rules to finish a task faster.

## 1. Project Overview

Dasres is a production web application built with:

- Next.js 16 using the App Router
- React 19 and TypeScript
- Tailwind CSS
- Prisma ORM
- `next-intl` for internationalization
- Neon PostgreSQL

Respect Server Component and Client Component boundaries. Prefer Server Components by default, and add `"use client"` only when browser APIs, state, effects, or interactive event handlers require it. Follow the existing routing, data-access, authentication, authorization, component, and translation architecture.

## 2. Coding Standards

- Produce production-grade code only. Do not use quick fixes, temporary solutions, placeholders, stubs, or knowingly incomplete implementations.
- Fix root causes instead of masking symptoms. Preserve existing behavior unless the task explicitly changes it.
- Keep the existing architecture, conventions, naming, and folder structure. Do not introduce a new abstraction, dependency, or architectural pattern without a clear need.
- Never use explicit or implicit `any`. Use precise domain types, generics, discriminated unions, `unknown` with narrowing, and generated Prisma types as appropriate.
- Maintain strict typing at system boundaries, including request payloads, database results, translations, environment variables, and third-party responses.
- Keep functions and components small, cohesive, and reusable. Give each unit one clear responsibility.
- Avoid duplicated logic. Reuse or extend an existing utility or component when it is the correct abstraction.
- Prefer clear, maintainable code over clever code. Use descriptive names and comments only when they explain non-obvious intent or constraints.
- Do not suppress TypeScript, ESLint, runtime, or framework errors without documenting and resolving the underlying reason.
- Do not leave dead code, debug output, commented-out implementations, or unused imports.

## 3. API Rules

- Validate and normalize all external input before authentication-dependent business logic or database writes. Use the project's established validation approach, including Zod where applicable.
- Return standardized, serializable API responses and error shapes. Do not expose stack traces, secrets, database details, or internal implementation details.
- Handle expected failures explicitly and map them to appropriate HTTP status codes. Log unexpected failures with enough context to diagnose them without logging sensitive data.
- Authenticate the caller and perform explicit permission and ownership checks before reading or mutating protected resources. Never trust client-provided identity, role, owner, price, status, or derived fields.
- Use Prisma transactions for multi-step operations that must succeed or fail atomically. Use `Serializable` isolation where concurrent writes could violate an invariant.
- Retry Prisma `P2034` transaction conflicts with a small, bounded retry policy and appropriate backoff. Never retry indefinitely or retry non-transient errors.
- Create activity or audit records for security-sensitive and significant domain mutations, following existing project conventions. When atomicity matters, write the activity record in the same transaction.
- Make mutation endpoints idempotent where retries or duplicate submissions are plausible. Enforce idempotency with database constraints or persisted keys when appropriate, not only in application memory.
- Prevent race conditions with database constraints, conditional updates, transactions, and isolation levels rather than check-then-write logic alone.
- Use safe defaults, explicit allowlists, pagination, and bounded input sizes. Do not mass-assign request objects into Prisma operations.

## 4. Internationalization

- `messages/en.json` is the canonical source for the translation key structure.
- Never rename, translate, or otherwise change JSON keys during translation work. Translate values only unless a task explicitly changes the canonical message schema.
- Every locale must contain exactly the canonical key structure: no missing keys, extra keys, or incompatible value types.
- Preserve placeholders exactly, including their names, spelling, case, and syntax. Do not add, remove, rename, or translate placeholder identifiers.
- Preserve ICU MessageFormat semantics exactly, including argument names, formatter types, plural/select branches, exact-match selectors, nesting, and balanced braces. Translate only user-facing branch text.
- Do not hardcode user-facing UI strings. Add them to `messages/en.json`, add equivalent values to every supported locale, and access them through `next-intl`.
- Preserve markup placeholders, escaping, punctuation intent, URLs, units, and interpolation behavior.
- Ensure translations are natural in context and contain no accidentally untranslated source-language text. Shared proper nouns, technical terms, and locale-valid cognates are acceptable when intentional.
- Maintain compatibility with both RTL and LTR locales. Do not construct translated sentences by concatenating fragments.

## 5. UI Rules

- Every UI change must be responsive and usable at mobile, tablet, and desktop sizes without clipping, overflow, or inaccessible controls.
- Support RTL and LTR layouts. Prefer logical CSS properties and direction-aware utilities; do not encode layout assumptions with physical left/right positioning when a logical equivalent exists.
- Meet accessibility expectations: semantic HTML, keyboard access, visible focus, correct labels, meaningful alternative text, sufficient contrast, appropriate ARIA only when native semantics are insufficient, and accessible error/status announcements.
- Reuse existing components and design patterns. Extract a reusable component when UI or behavior is duplicated or has a clear shared responsibility.
- Do not duplicate UI markup, styling logic, state transitions, or accessibility behavior across pages.
- Preserve visual consistency with the existing design system, spacing, typography, colors, states, and interaction patterns.
- Handle loading, empty, error, disabled, pending, success, and permission-denied states where relevant. Prevent duplicate submissions and provide clear feedback.
- Avoid unnecessary client-side JavaScript. Keep data fetching and non-interactive rendering on the server when practical.

## 6. Prisma and Database Rules

- Prevent N+1 queries. Fetch related data in a bounded query or deliberate batch when it is needed.
- Select only fields required by the operation or response. Do not fetch full records or relations by default.
- Use transactions when multiple reads or writes form one invariant or business operation.
- Preserve referential integrity with appropriate relations, constraints, unique indexes, foreign keys, and deletion behavior.
- Add indexes for demonstrated query patterns and verify that schema changes match actual access patterns. Avoid speculative or redundant indexes.
- Do not edit generated Prisma Client files. Update the schema and regenerate the client through repository scripts.
- Treat migrations and destructive schema operations as high risk. Never discard production data, reset a database, or rewrite migration history without explicit authorization and a recovery plan.
- Keep Neon PostgreSQL constraints in mind: transactions must be short, queries bounded, and connection usage suitable for a serverless environment.

## 7. Git and Change Scope

- Before editing, explain the planned changes and the files expected to change.
- Never modify unrelated files. Keep the diff minimal and scoped to the request.
- Preserve user-authored and pre-existing changes. Inspect the working tree before broad edits and do not revert changes you did not create.
- Never commit, amend, push, create a branch, open a pull request, or modify Git history automatically. Do so only when the user explicitly requests that action.
- Do not use destructive Git commands such as `git reset --hard` or discard local changes without explicit authorization.
- Do not include formatting-only churn, generated artifacts, lockfile changes, or dependency updates unless required by the task.
- At handoff, clearly report changed files, validation performed, warnings, and any unresolved risk.

## 8. Validation Checklist

Before finishing any task, run all checks relevant to the change and verify the following:

- `npm run check` passes.
- The production build passes.
- TypeScript type checking passes.
- Linting passes without new warnings or errors.
- Prisma schema validation passes when database code or schema may be affected.
- All edited JSON files parse successfully.
- Translation files retain the canonical `messages/en.json` key structure.
- Internationalization is valid: no missing or extra keys, no unintended English values, and no incompatible message types.
- All placeholders are preserved exactly.
- ICU MessageFormat syntax and semantics match the canonical messages.
- Permission, validation, transaction, error, idempotency, and activity-log paths are covered when applicable.
- The final diff contains only intended changes and no generated or unrelated files.

If a required check cannot run or fails for a reason outside the task scope, do not claim success. Report the exact command, failure, completed checks, and remaining risk. Never weaken validation, remove tests, or suppress errors merely to obtain a passing result.

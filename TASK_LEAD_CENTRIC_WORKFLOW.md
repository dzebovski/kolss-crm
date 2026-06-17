# Task: Lead-Centric CRM Workflow Redesign

## Context

Old lead/project workflows are no longer the product model. Keep only the existing lead import logic and rebuild the CRM around one customer/lead card.

New business flow:

```text
Lead -> Call -> Showroom -> Contract -> Prepayment -> Production
```

After production starts, the manager can later mark:

```text
Postpayment -> Installed -> Warranty
```

There is no user-facing concept of "project" anymore. Existing project data should not be physically dropped in the first release until historical data is migrated or explicitly archived.

## Primary Goals

1. Preserve lead import from Meta/Google Sheets, site webhook, and manual lead creation.
2. Replace the old lead/project split with one customer card based on the lead.
3. Add structured workflow actions for calls, showroom visits, contracts, payments, production, installation, and warranty.
4. Add mandatory manager comments for every contact attempt and workflow-changing action.
5. Rebuild dashboards for super admin and manager workflows.
6. Support English for super admin, Ukrainian for Ukraine office, Polish for Poland office.

## Recommended Data Organization

Use the `leads` table as the main customer record. Do not put every event as columns on `leads`; keep current state on `leads`, and store repeatable/history data in child tables.

### `leads` Current Snapshot

Add or repurpose fields for the current state:

- `workflow_status`
  - `new`
  - `in_work`
  - `callback_required`
  - `contacted`
  - `showroom_scheduled`
  - `showroom_visited`
  - `showroom_no_show`
  - `contract_planned`
  - `contract_signed`
  - `prepayment_received`
  - `in_production`
  - `postpayment_received`
  - `installed`
  - `warranty`
  - `bad_lead`
- `assigned_to`
- editable contact fields: name, phone, email, region/city
- editable source fields:
  - imported raw source stays in `raw_payload`
  - `source_system` stays technical
  - add `source_channel` for editable human source: Facebook, Instagram, Website, Other, etc.
  - add `source_note` for manual clarification
- current next action fields:
  - `next_task_due_at`
  - `next_task_title`
  - or derive this from open tasks
- current production lifecycle dates:
  - `production_started_at`
  - `postpayment_received_at`
  - `installed_at`
  - `warranty_started_at`

### `lead_activities`

Single audit/activity stream for every meaningful manager action.

Suggested fields:

- `id`
- `lead_id`
- `actor_id`
- `activity_type`
- `comment` required for manager-entered actions
- `old_value`
- `new_value`
- `created_at`

Activity types:

- `lead_created`
- `lead_assigned`
- `contact_attempt`
- `callback_task_created`
- `showroom_visit_scheduled`
- `showroom_visit_rescheduled`
- `showroom_visit_completed`
- `showroom_no_show`
- `contract_planned`
- `contract_signed`
- `payment_recorded`
- `production_started`
- `postpayment_received`
- `installed`
- `warranty_started`
- `bad_lead`
- `customer_data_updated`

This should replace the current split between technical events and loose comments where possible. The customer card can still show human comments separately if needed, but workflow actions should always be visible in the activity timeline.

### `lead_contact_attempts`

Store every call/contact attempt as structured data.

Fields:

- `lead_id`
- `manager_id`
- `result`
  - `reached`
  - `no_answer`
  - `cannot_talk`
  - `bad_lead`
- `comment` required
- `created_at`

Rules:

- Every call attempt requires a comment.
- `no_answer` and `cannot_talk` can create a callback task.
- `bad_lead` sets `workflow_status = bad_lead`.
- There is no system limit on number of attempts.

### `tasks`

Reuse or replace the existing `tasks` table as the CRM task queue. This should become user-facing.

Required task types:

- `callback`
- `showroom_no_show_followup`
- `showroom_visit`
- `contract_followup`
- `prepayment_followup`

Fields:

- `entity_type = lead`
- `entity_id = lead_id`
- `assignee_id`
- `title`
- `due_at`
- `status`: open, done, canceled
- `source`
- `created_by`
- `created_at`
- `completed_at`

Callback scheduling rule:

- If contact attempt happens from 09:00 to 13:00, create callback task for the same day after 14:00.
- If contact attempt happens from 13:01 to 18:00, create callback task for the next working day at 09:00.
- Proposed fallback: attempts outside business hours create task for next working day at 09:00.

### `lead_showroom_visits`

Showroom visits can happen multiple times, including reschedules.

Fields:

- `lead_id`
- `scheduled_at`
- `status`
  - `scheduled`
  - `visited`
  - `no_show`
  - `canceled`
  - `rescheduled`
- `comment`
- `materials`
- `quoted_price_amount`
- `quoted_price_currency`
- `created_by`
- `created_at`
- `updated_at`

Rules:

- Scheduling or rescheduling a showroom visit creates/updates an open showroom task.
- Marking `no_show` creates a callback task for the next day to clarify the next showroom visit time.
- Marking `visited` allows manager to record materials, price, and comment.

### `lead_contracts`

Track planned and signed contracts without creating a separate project.

Fields:

- `lead_id`
- `planned_at`
- `signed_at`
- `status`
  - `planned`
  - `signed`
  - `canceled`
- `comment`
- `created_by`
- `created_at`

Dashboard needs "planned contracts", so `planned_at` must be structured.

### `lead_payments`

Store prepayments and postpayments as payment records.

Fields:

- `lead_id`
- `payment_type`
  - `prepayment`
  - `postpayment`
- `amount`
- `currency`
  - `PLN`
  - `EUR`
  - `USD`
  - `GBP`
  - `UAH`
- `paid_at`
- `comment`
- `created_by`
- `created_at`

Rules:

- Prepayment is not always 50%; manager enters actual amount and currency.
- When first prepayment is recorded, set lead status to `prepayment_received` or `in_production`, depending on whether production should start immediately.
- Dashboard sums prepayments by currency; do not combine currencies into one number.

## Workflow Actions

### New Lead

Source:

- imported from existing import flow
- site webhook
- manual creation

Initial state:

- `workflow_status = new`
- no assignee unless manually created by a manager and business decides to auto-assign

### Take Lead In Work

Action:

- assign manager
- status `new -> in_work`
- write activity log

Manager can be changed later. Every reassignment must be recorded in history.

### Record Call Attempt

Required inputs:

- result: reached, no answer, cannot talk, bad lead
- comment required

Behavior:

- `reached`: status becomes `contacted`
- `no_answer`: status becomes `callback_required`, optionally creates callback task by scheduling rule
- `cannot_talk`: status becomes `callback_required`, creates callback task by scheduling rule
- `bad_lead`: status becomes `bad_lead`

### Schedule Showroom Visit

Inputs:

- date/time
- comment optional or required by final product decision

Behavior:

- create `lead_showroom_visits` row
- create showroom task
- set `workflow_status = showroom_scheduled`

### Mark Showroom No-Show

Behavior:

- visit status becomes `no_show`
- lead status becomes `showroom_no_show`
- create callback task for next working day
- activity log entry with comment

### Mark Showroom Visited

Inputs:

- materials
- price amount
- currency
- comment

Behavior:

- visit status becomes `visited`
- lead status becomes `showroom_visited`
- activity log entry

### Plan Contract

Inputs:

- planned date/time
- comment

Behavior:

- create contract row with `planned`
- create/fill contract follow-up task
- lead status becomes `contract_planned`

### Mark Contract Signed

Inputs:

- signed date
- comment
- optional attachment later

Behavior:

- contract status becomes `signed`
- lead status becomes `contract_signed`

### Record Prepayment

Inputs:

- amount
- currency
- payment date
- comment

Behavior:

- create payment row
- lead status becomes `prepayment_received`
- production can be started as same action or separate action, final decision needed

### Start Production

Behavior:

- set `production_started_at`
- set `workflow_status = in_production`
- this is the new "success" point from the sales workflow

### Later Lifecycle Updates

Manager can later record:

- postpayment received
- installed
- warranty started

These are not a separate project workflow; they are lifecycle events on the customer card.

## Customer Card

Replace the current lead/project detail split with one customer card. The route can remain `/app/leads/[id]` for compatibility, but UI should call it customer card.

Required sections:

1. Header
   - customer name
   - workflow status
   - assigned manager
   - office
   - next action / due date

2. Contact and Source
   - editable name, phone, email, city/region
   - technical imported source
   - editable source channel
   - raw/import metadata available in collapsed technical details

3. Primary Action Panel
   - one next-best action based on state
   - secondary actions grouped clearly

4. Call History
   - attempts with result, manager, time, comment
   - action to record new call attempt

5. Tasks
   - open tasks
   - completed/canceled tasks
   - create manual task
   - complete/cancel task

6. Showroom Visits
   - scheduled visits
   - reschedules
   - no-shows
   - visited results: materials and quoted price

7. Contract and Payments
   - planned contract date
   - signed contract
   - prepayment records
   - postpayment records

8. Production Lifecycle
   - production started
   - installed
   - warranty started

9. Activity Timeline
   - all status changes, assignments, edits, tasks, visits, contract, payments
   - actor and timestamp for every manipulation

10. Files
   - preserve existing lead attachments
   - support contract/payment/other files later if needed

## Dashboard Requirements

### Super Admin Dashboard

Filters:

- office
- manager
- period, default 30 days

Metrics:

- leads created in last 30 days
- leads not taken into work
- leads reached
- leads not reached
- reached/not reached today
- reached/not reached yesterday
- showroom visits scheduled
- showroom visits completed
- contracts planned
- contracts signed
- prepayment totals grouped by currency

Recommended additions:

- overdue tasks
- leads without any contact attempt
- no-show count
- conversion funnel:
  - new -> in work -> reached -> showroom scheduled -> showroom visited -> contract signed -> prepayment -> production

### Manager Dashboard

Show card lists, not just KPI totals:

1. New leads to take in work
2. Leads to call back
3. Customers who did not come to showroom
4. Customers scheduled for showroom
5. Customers to bring to contract or prepayment

Each card should show:

- customer name
- phone
- source
- office if relevant
- current status
- assigned manager if manager can see team records
- due date / visit date / contract date
- last activity/comment preview
- primary action link to customer card

Recommended additions:

- overdue section above normal queues
- "no contact attempt yet" badge
- quick phone/copy action if practical

## Navigation and Routes

User-facing:

- `/app/dashboard`
- `/app/leads`
- `/app/leads/new`
- `/app/leads/[id]` as customer card
- `/app/admin/users`

Remove or hide from navigation:

- `/app/projects`
- `/app/projects/[id]`

Technical decision:

- keep old project routes temporarily only for legacy admin/debug access, or remove after migration.

## Localization

Locale resolution:

- `super_admin`: English UI by default, with office filter labels still showing local office names
- Ukraine office users: Ukrainian
- Poland office users: Polish

All new labels need keys for:

- workflow statuses
- action labels
- call results
- task types
- showroom statuses
- contract statuses
- payment types
- currencies
- dashboard sections

## Implementation Plan

### Phase 1: Data and Workflow Foundation

- Add migrations for lead-centric workflow fields and child tables.
- Add RLS policies for new tables.
- Convert task table into user-facing lead task queue or replace it with a better scoped table.
- Add server actions/RPC for:
  - assign lead
  - record call attempt
  - create/complete/cancel task
  - schedule/reschedule showroom visit
  - mark no-show
  - mark visited
  - plan/sign contract
  - record payment
  - start production
  - record postpayment/install/warranty
  - edit customer/source fields
- Ensure every workflow action writes activity history.

### Phase 2: Customer Card

- Rebuild `/app/leads/[id]` into one customer card.
- Replace old lead action panel with workflow-aware actions.
- Add structured blocks for calls, tasks, showroom, contract, payments, production lifecycle, and activity timeline.
- Keep imported raw data visible but not dominant.

### Phase 3: Lists and Dashboard

- Update leads list to show workflow status, source, assignee, next action, and due date.
- Rebuild dashboard RPC/query for new data.
- Build separate super admin and manager dashboard compositions.
- Hide/remove project dashboard cards.

### Phase 4: Legacy Project Cleanup

- Decide whether to migrate old `projects` rows into lead child tables.
- Hide project nav immediately.
- Keep old project tables until migration is verified.
- Remove old project UI/actions after data retention decision.

### Phase 5: Localization and Polish/English Labels

- Introduce shared label dictionaries.
- Apply English for super admin.
- Apply office language for office users.

## Acceptance Criteria

- Imported leads still arrive and create customer records.
- A manager can take a lead into work.
- Every call attempt requires a comment.
- `no_answer` and `cannot_talk` can create callback tasks using the agreed time rule.
- Managers can schedule multiple showroom visits and reschedule them.
- No-show creates a next-day callback task.
- Visited showroom records materials and price.
- Contract planning and signing are structured data, not only comments.
- Prepayment supports PLN, EUR, USD, GBP, and UAH.
- Starting production marks the sales workflow success point.
- Postpayment, installation, and warranty can be recorded later on the same customer card.
- Every assignment and workflow manipulation appears in history with actor and timestamp.
- Super admin dashboard shows 30-day metrics, call result metrics, showroom metrics, contract metrics, and prepayment totals by currency.
- Manager dashboard shows actionable card queues.
- Project UI is not part of normal navigation.
- Ukrainian, Polish, and English labels exist for all new workflow concepts.

## Remaining Product Decisions

1. Should recording prepayment automatically start production, or should "Start production" be a separate explicit action?
2. What should happen for callback scheduling on weekends and holidays?
3. Can a customer have multiple active planned contracts, or only one active contract plan at a time?
4. Should contract/payment files be required, optional, or postponed?
5. Should managers see only their assigned leads or all office leads?
6. Should duplicated phone/email leads be merged, warned, or allowed?
7. Should bad lead have reasons, or only a mandatory comment?
8. Should source channel options be fixed globally or editable by super admin?

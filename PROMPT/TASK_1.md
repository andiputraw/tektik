Create a Project Management Application that capable of running on cloudflare workers for the backend and cloudflare pages for the frontend. The application should be able to run on a free tier.

Use Nuxt 4 for the frontend with shadcn ui for the components, compiled to static site.

Use cloudflare workers using hono for the backend, with D1 for the database. with drizzle ORM. Make sure to follow the clean code architecture by abstracting all busniness logic, database logic, and the handler logic use dependency injection. Also create the swagger for documentation. and unit test for the business logic.

Use bun for the package manager. 

separate the backend and frontend into two different repositories.

below are the feature set for the application:
---

# 🎯 Absolute Minimum Feature Set (Detailed)

We’ll structure this as:

1. What the feature does
2. What users can actually do
3. What you technically need to implement it

---

# 1️⃣ Projects

## What it does

Container for everything (tasks, users, board).

## User Capabilities

* Create project
* Edit project name/description
* Archive/delete project
* Invite members


---

# 2️⃣ Tasks (Core Work Unit)

This is the heart of the system.

## What it does

Represents a piece of work.

## User Capabilities

* Create task
* Edit task
* Delete task
* Assign to user
* Set status
* Add due date
* Add description

You do NOT need:

* Epics
* Story points
* Priority
* Complexity
* Subtasks

Those are enhancements — not MVP.

---

# 3️⃣ Status Workflow (Kanban Columns)

Without this, you don’t have visual flow.

## What it does

Defines board columns like:

* To Do
* In Progress
* Done

## User Capabilities

* Move task between statuses
* See tasks grouped by status


## UI Requirement

* Group tasks by status
* Drag & drop updates `status_id`

That’s it.

You don’t need:

* Workflow validation rules
* Status transitions
* WIP limits

Those can come later.

---

# 4️⃣ Kanban Board

This is just a visualization layer over tasks + statuses.

## What it does

Displays:

```
To Do        | In Progress | Done
-----------------------------------
Task A       | Task C      | Task D
Task B
```

## What You Need

* Fetch statuses ordered by position
* Fetch tasks grouped by status
* Endpoint to update task status

# 5️⃣ Assignees

Without assignment, collaboration breaks.

## What it does

Assign responsibility.

## User Capabilities

* Assign task to member
* Filter by "My Tasks"

---

# 6️⃣ Comments (Collaboration Layer)

This is what makes it usable by teams.

## What it does

Allow discussion on tasks.

## User Capabilities

* Add comment
* Edit own comment
* See comment history

You do NOT need:

* Threads
* Reactions
* Mentions
* Attachments

# 🧱 What This MVP Can Already Do

With just these 6 features:

✔ Create projects
✔ Add members
✔ Create tasks
✔ Assign tasks
✔ Move tasks between columns
✔ Discuss tasks

That already replaces:

* Trello (basic)
* Simple Jira boards
* Basic Taiga usage

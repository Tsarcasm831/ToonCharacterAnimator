# Agent Rules (Read First)

These rules exist to prevent accidental data loss and keep the codebase stable while changes are being made.

If you're an agent operating on this repo, follow this document **exactly**.

---

## 1) Backup Before You Edit (MANDATORY)

**Any time you need to make changes to an existing file:**
1. Create a `.bak` copy of the original **before editing**
2. Proceed with the changes you were planning

This rule exists to prevent data loss and make it easy to revert changes quickly.

✅ Required:
- `cp path/to/file.ext path/to/file.ext.bak`

❌ Not allowed:
- Editing a file directly without a backup first  
- Assuming git will save you  
- Skipping backups "just this once"

> If a `.bak` already exists, create a new one using a suffix:
- `file.ext.bak2`
- `file.ext.bak3`
- etc.

---

## 2) Fix Lint Errors Immediately (NO DELAYS)

**Fix lint errors as soon as they appear.**
Do *not* wait until things break or pile up errors.

Lint failures are often early warnings for:
- subtle bugs
- inconsistent formatting
- broken patterns
- future build failures

✅ Required:
- Fix lint errors during the same task where they show up
- Rerun lint after edits to confirm you're clean

❌ Not allowed:
- “I’ll come back to it”
- Leaving lint errors in a PR/commit
- Ignoring warnings that become tomorrow’s blocker

---

# File Operations Testing Results

This section documents what is confirmed working and what limitations exist.

Use this to avoid wasting time, causing damage, or relying on behavior that doesn’t exist.

---

## ✅ WORKING OPERATIONS

### Edit Operations
Confirmed working:

- `edit` tool  
  ✅ Works for single string replacements

- `multi_edit` tool  
  ✅ Works for multiple edits in one operation

Important behavior:
- Both tools require **exact string matching**
- Both tools **preserve formatting**
- Whitespace and indentation matter

---

### File System Operations (via bash)
Confirmed working:

- `mv`  
  ✅ Move/rename files and directories

- `cp`  
  ✅ Copy files

- `rm`  
  ✅ Delete files

- `rm -rf`  
  ✅ Delete directories and contents

- `mkdir -p`  
  ✅ Create directories + parents

---

### File Creation
Confirmed working:

- `write_to_file`  
  ✅ Creates new files with content  
  ✅ Creates parent directories automatically if needed  

---

## ⚠️ LIMITATIONS & AVOIDANCES

### Edit Tool Limitations
Constraints you must respect:

- You **must read the file first** before editing (tool requirement)
- Matching is **exact** — whitespace matters
- You **cannot edit files that don’t exist**
- There is **no built-in backup feature**
  - you must create `.bak` manually

✅ Best practice:
- Copy → Confirm → Edit

---

### Bash Operations Limitations
Bash can be dangerous because:

- There is **no built-in undo**
- Destructive operations (`rm`, `mv`) are permanent
- You should use **absolute paths**
- There are no confirmation prompts for destructive commands

✅ Best practice:
- Verify before destructive operations
- Prefer safe operations first (copy > move, list > delete)
- Only use `rm -rf` when you're *completely certain*

---

## ✅ General Best Practices

Follow these every time:

- Always create `.bak` files before major edits
- Test operations on non-critical files first
- Use absolute paths to avoid working directory confusion
- Verify file existence before operations
- Confirm output results after edits (lint/build/test)

---

# Recommended Safe Workflow

Use this sequence unless there’s a strong reason not to:

1. Locate the file you plan to edit  
2. Create a backup (`.bak`)  
3. Read the file contents  
4. Apply edits (`edit` or `multi_edit`)  
5. Fix lint issues immediately  
6. Validate changes (lint/build/test)  
7. Only then proceed to the next file

✅ This workflow prevents most self-inflicted disasters.
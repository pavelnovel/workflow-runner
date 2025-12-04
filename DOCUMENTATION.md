# 📚 Documentation Guide

This file explains the purpose of each documentation file in the project.

---

## Core Documentation

### 🚀 [GETTING_STARTED.md](GETTING_STARTED.md)
**Start here!** Quick 5-minute setup guide.
- How to start the backend and UI
- How to import the webinar template
- Common issues and fixes
- Port configuration

### 📖 [README.md](README.md)
**Project overview** and feature list.
- What FlowState is and does
- Key features
- Architecture overview
- Links to other docs

### 🔧 [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
**Technical details** for developers.
- Database schema
- API endpoints
- Migration instructions
- Troubleshooting guide
- Architecture decisions

---

## Template Documentation

### 📋 [templates/README.md](templates/README.md)
**How to use and create templates**.
- Available templates
- How to import templates
- Template JSON format
- Creating custom templates
- Best practices

### 📺 templates/post-webinar-conversion-template.json
**Ready-to-use template** for post-webinar workflows.
- 9 comprehensive steps
- 6 customizable variables
- Integrates with Zoom, YouTube, HubSpot

---

## Documentation Structure

```
/
├── README.md                    ← Project overview (start here if browsing)
├── GETTING_STARTED.md           ← Quick setup (start here if doing)
├── INTEGRATION_GUIDE.md         ← Technical details
├── DOCUMENTATION.md             ← This file
│
└── templates/
    ├── README.md                ← Template documentation
    └── post-webinar-conversion-template.json
```

---

## What Was Removed

### Deleted (Outdated)
- ❌ `UI_SETUP.md` - Incorrectly stated UI uses localStorage
- ❌ `PORT_CONFIGURATION.md` - Outdated port information
- ❌ `ui/README.md` - AI Studio boilerplate
- ❌ `QUICK_START.md` - Consolidated into GETTING_STARTED.md
- ❌ `START_HERE.md` - Consolidated into GETTING_STARTED.md
- ❌ `templates/POST-WEBINAR-PREVIEW.md` - Too verbose
- ❌ `templates/webinar-template-summary.txt` - Redundant

### Why
All deleted files contained either:
1. **Wrong information** (saying UI uses localStorage when it uses the backend)
2. **Duplicate information** (multiple quick start guides)
3. **Overly verbose** content that made it hard to find answers

---

## Quick Reference

| I want to... | Read this file |
|--------------|----------------|
| Get started quickly | [GETTING_STARTED.md](GETTING_STARTED.md) |
| Understand the project | [README.md](README.md) |
| Learn technical details | [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) |
| Create templates | [templates/README.md](templates/README.md) |
| Import the webinar template | [GETTING_STARTED.md](GETTING_STARTED.md#importing-the-webinar-template) |
| Fix an issue | [GETTING_STARTED.md](GETTING_STARTED.md#common-issues) |

---

## Contributing to Documentation

When adding new docs:
1. Keep it focused (one topic per file)
2. Use clear headings and examples
3. Update this file to reference it
4. Link to it from README.md if appropriate
5. Test all commands/code snippets

When updating existing docs:
1. Keep information accurate and up-to-date
2. Remove outdated information
3. Check for broken links
4. Maintain consistent formatting

---

**Last updated:** December 2025


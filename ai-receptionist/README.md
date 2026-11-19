# AI Receptionist (Tree Service demo)

An AI phone receptionist for tree service companies. It answers calls 24/7, handles emergencies safely, qualifies jobs, collects photos, books free estimates, and texts the owner every lead.

> Lives in this repo for now; will move to its own repo later.

## Why tree services
- Owners are up trees with chainsaws and miss calls, and a missed call goes to a competitor.
- Jobs are worth hundreds to thousands of dollars each.
- Storms create sudden spikes of calls.
- Calls are predictable: mostly "come quote my tree".

## Folder layout
| Path | What |
|---|---|
| `business/oak-ridge-tree-service.json` | Fictional demo business: services, area, hours, pricing ranges, FAQ |
| `agent/system-prompt.md` | The receptionist's instructions: tone, emergency and safety rules, intake flow |
| `agent/tools.json` | Actions the agent can take during a call (alert owner, send photo link, book estimate, save lead) |
| `agent/test-scenarios.md` | Test calls to run and score |

## Roadmap
- [x] 1. Demo business profile
- [x] 2. Call script and rules, tool definitions, test scenarios
- [ ] 3. Set up the agent on Vapi (needs a Vapi account + API key)
- [ ] 4. Backend: save leads, text owner, photo upload link, calendar booking
- [ ] 5. Run test calls and score them
- [ ] 6. Record the best calls and show them to real tree-service owners

## Secrets
Never commit API keys or phone numbers. They go in environment variables (`.env`, which is git-ignored).

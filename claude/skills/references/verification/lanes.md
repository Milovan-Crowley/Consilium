# Principales Lane Taxonomy

Per-lane routing metadata. The wrapper consults this file (or rather, the per-lane prompt template under `claude/mcps/principales/prompts/<lane>.md` that mirrors these settings) to dispatch work. Lanes flagged `enabled: false` are placeholders for the Spec B integration/expansion case — the wrapper refuses to dispatch them.

---

## Metadata Keys

- `family` — broad lane category (`artifact-text`, `grounding`, `adversarial`, `business_critical`, `diagnosis`, `campaign`).
- `default_profile` — `principalis_light` / `principalis_grounded` / `principalis_adversarial` / `principalis_batch`.
- `evidence_required` — what evidence the dispatcher must supply (`artifact`, `repo`, `diff`, `doctrine`, `command`, or combinations like `artifact_and_doctrine`).
- `tools` — host tools the lane needs (empty in v1; reserved for Spec B).
- `kimi_sound_final` — whether a Kimi SOUND verdict can stand without officer spot-check (always `false` in v1; integration case may flip per-lane).
- `max_claims_per_bundle` — soft cap on claims per dispatch.
- `max_completion_tokens` — output cap.
- `thinking_allowed` — whether the lane permits thinking mode (always `false` in v1).
- `batch_allowed` — whether the lane permits offline Batch API use (always `false` in v1).
- `enabled` — `true` if the wrapper will dispatch this lane today; `false` placeholder.

---

## V1 Enabled Lanes (substrate-callable)

### Spec Lanes (artifact-text)

```yaml
upstream-coverage:
  family: artifact-text
  default_profile: principalis_light
  evidence_required: artifact_and_doctrine
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 8
  max_completion_tokens: 1500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

ambiguity-audit:
  family: artifact-text
  default_profile: principalis_light
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 10
  max_completion_tokens: 1500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

confidence-map-sanity:
  family: artifact-text
  default_profile: principalis_light
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 10
  max_completion_tokens: 1500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

contradiction-hunt:
  family: adversarial
  default_profile: principalis_adversarial
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 6
  max_completion_tokens: 2500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

edge-case-attack:
  family: adversarial
  default_profile: principalis_adversarial
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 6
  max_completion_tokens: 2500
  thinking_allowed: false
  batch_allowed: false
  enabled: true
```

### Plan Lanes (artifact-text)

```yaml
task-ordering:
  family: artifact-text
  default_profile: principalis_light
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 10
  max_completion_tokens: 1500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

undefined-references:
  family: artifact-text
  default_profile: principalis_light
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 12
  max_completion_tokens: 1500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

test-command-plausibility:
  family: artifact-text
  default_profile: principalis_light
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 8
  max_completion_tokens: 1500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

literal-execution-failure:
  family: adversarial
  default_profile: principalis_adversarial
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 6
  max_completion_tokens: 2500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

migration-risk:
  family: adversarial
  default_profile: principalis_adversarial
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 6
  max_completion_tokens: 2500
  thinking_allowed: false
  batch_allowed: false
  enabled: true
```

---

## V1 Disabled Lanes (placeholders for Spec B)

The substrate refuses to dispatch these. The integration/expansion case enables them when host tools (Mode B), diagnosis support, campaign triad, or batch sweeps land.

```yaml
codebase:
  family: grounding
  default_profile: principalis_grounded
  evidence_required: repo
  enabled: false

types:
  family: grounding
  default_profile: principalis_grounded
  evidence_required: repo
  enabled: false

api:
  family: grounding
  default_profile: principalis_grounded
  evidence_required: repo
  enabled: false

stubs:
  family: grounding
  default_profile: principalis_light
  evidence_required: diff
  enabled: false

quality:
  family: grounding
  default_profile: principalis_light
  evidence_required: diff
  enabled: false

architecture:
  family: grounding
  default_profile: principalis_grounded
  evidence_required: repo_and_doctrine
  enabled: false

integration:
  family: grounding
  default_profile: principalis_grounded
  evidence_required: repo
  enabled: false

medusa-workflow:
  family: business_critical
  default_profile: principalis_grounded
  evidence_required: repo_and_doctrine
  enabled: false

medusa-money:
  family: business_critical
  default_profile: principalis_grounded
  evidence_required: repo_and_doctrine
  kimi_sound_final: false
  enabled: false

reproduction:
  family: diagnosis
  default_profile: principalis_grounded
  evidence_required: command
  enabled: false

root-cause-evidence:
  family: diagnosis
  default_profile: principalis_grounded
  evidence_required: repo
  enabled: false

contrary-evidence:
  family: diagnosis
  default_profile: principalis_adversarial
  evidence_required: artifact
  enabled: false

threshold-honesty:
  family: diagnosis
  default_profile: principalis_adversarial
  evidence_required: artifact
  enabled: false

verification-plan:
  family: diagnosis
  default_profile: principalis_light
  evidence_required: command
  enabled: false

fix-site:
  family: diagnosis
  default_profile: principalis_grounded
  evidence_required: repo
  enabled: false

contract-compatibility:
  family: campaign
  default_profile: principalis_grounded
  evidence_required: repo
  enabled: false
```

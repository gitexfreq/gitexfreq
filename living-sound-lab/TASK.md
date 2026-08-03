# Codex task: Heart v0.4 Form Engine

Use the known-working `Heart_v0_3_DubLurch.maxpat` as the sonic baseline.

Before editing:

```bash
python3 living-sound-lab/tools/bootstrap_baseline.py
python3 living-sound-lab/tools/validate_maxpat.py living-sound-lab
```

## Objective

Create a modular v0.4 Max/MSP project whose low-pulse synthesis remains unchanged, but whose rhythm develops recognizable form rather than repeating one short loop.

## Required behavior

Create four related 24-step pattern states:

- **A: Anchor**: stable low-pulse anchors with moderate negative space.
- **B: Lurch**: omit one expected anchor and add one late low pulse.
- **C: Static**: sparse low pulses with more active static clicks.
- **D: Void**: nearly empty dry rhythm, with dub returns carrying most of the motion.

The form engine must:

1. Change patterns only at a 24-step cycle boundary.
2. Hold each selected pattern for 2–5 complete cycles.
3. Never select the same pattern twice consecutively.
4. Permit at most one probabilistic event mutation per cycle.
5. Display current step, current pattern, and remaining hold cycles.
6. Provide manual buttons for patterns A, B, C, and D.
7. Provide manual low-pulse and click triggers for diagnostics.
8. Preserve the exact low-pulse synthesis and envelope design from the baseline.
9. Expose dry rhythm and dub return as separate stereo signal pairs before the final master mix.
10. Include visible meters for dry left/right, dub left/right, and final left/right.

## Files

Create:

- `living-sound-lab/patches/Heart_v0_4_Form.maxpat`
- abstractions, if needed, under `living-sound-lab/patches/modules/`
- `living-sound-lab/docs/v0_4_notes.md`

## Validation

Run:

```bash
python3 living-sound-lab/tools/validate_maxpat.py living-sound-lab
```

The notes must include:

- architecture overview,
- object and abstraction inventory,
- pattern definitions,
- a step-by-step Max audition checklist,
- known limitations,
- confirmation that structural validation passed,
- a reminder that musical behavior still requires human auditioning in Max.

Do not modify files outside `living-sound-lab/`. Do not overwrite the baseline.
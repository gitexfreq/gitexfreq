# Living Sound Lab agent instructions

Work only inside `living-sound-lab/` unless the user explicitly asks otherwise.

## Project goal

Develop a reliable Max/MSP rhythm-and-dub instrument from the known-working `Heart_v0_3_DubLurch.maxpat` baseline. The musical target is sparse, physical, dub-informed machine rhythm with recurrence but without a short obvious loop.

## Non-negotiable engineering rules

1. Preserve a known-working baseline. Never overwrite `baseline/Heart_v0_3_DubLurch.maxpat`.
2. Create new versions under `patches/` with increasing version numbers.
3. Use only documented Cycling '74 Max objects. Do not invent MSP variants such as `inlet~` or `outlet~`.
4. Every sound-producing module must include:
   - a manual trigger,
   - a visible meter or other diagnostic output,
   - a direct, inspectable signal path,
   - comments describing its input and output.
5. Do not use hidden routing until a direct-cord version has been validated in Max.
6. Keep dry percussion and dub return separately accessible at the final mixer.
7. Do not change the low-pulse synthesis from the baseline unless the task explicitly asks for it.
8. Prefer small abstractions over a monolithic patch, but validate each abstraction's `inlet` and `outlet` count before connecting it.
9. Run `python3 living-sound-lab/tools/validate_maxpat.py living-sound-lab` after every `.maxpat` edit.
10. Treat JSON validation as necessary but not sufficient. State clearly that final audio behavior must be auditioned in Max.

## Musical behavior for the next iteration

Build four related 24-step pattern states:

- A: stable anchors with moderate negative space.
- B: one expected anchor omitted and one late pulse added.
- C: sparse low pulses with more active static clicks.
- D: nearly empty, with dub returns carrying the motion.

The form engine must:

- change patterns only at 24-step cycle boundaries,
- hold a pattern for 2 to 5 cycles,
- never choose the same pattern twice consecutively,
- allow no more than one probabilistic event mutation per cycle,
- display the current step, pattern, and remaining hold cycles,
- expose manual pattern-selection buttons,
- preserve the existing low-pulse sound.

## Deliverables

- `patches/Heart_v0_4_Form.maxpat`
- any small abstractions needed under `patches/modules/`
- `docs/v0_4_notes.md` explaining architecture, controls, and a Max audition checklist
- validator updates if new object types or abstractions require them

Keep changes reviewable. Do not perform unrelated refactors.
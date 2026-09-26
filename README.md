# Marble Madness 3D — Momentum Lab (R1 Creation)

This is the **next version of the existing 3D Creation**, an original isometric, canvas-rendered physics prototype for a 240×282 viewport. It is not the separate 2D game. Its single floating test course is built to tune acceleration, coasting, counter-steering, climb/descent, collision, open-edge falling, checkpoint respawn and stable camera follow before level production. The seven data-defined sculptural sections include a narrow downhill bridge and lateral turn; there is no invisible outer wall or jump button. The 90-second clock, four-second fall penalty and finish feedback give a racing loop. The rendering is lightweight projected 2.5D geometry, **not WebGL or full rigid-body 3D**; the sphere uses a planar force/slope model with visual rolling, not full rotational contact dynamics.

## Controls

Tap **ROLL THE LAB**. Tilt direction requires the browser orientation permission and actual events; if unavailable, touch arrows or arrow/WASD keys remain available. A physical wheel *may* dispatch browser `wheel` events; use the visible **FORCE** control (tap or swipe) if it does not. FORCE 1–5 scales directional force. No tap jump in this initial test, per the new brief. Tap ☰ to pause/help/restart. The app intentionally does not claim the hardware tilt or wheel event path works until tested on the R1.

## Verification

`node physics-test.mjs` checks acceleration, coast, braking, gravity on slopes, post reflection, edge fall, and fast checkpoint return. `node browser-test.mjs` against a local static server checks mobile touch controls, pause/resume, no JavaScript errors and exact 240×282 layout. A dynamically steered route was simulated from spawn to finish; this is reachability evidence, not proof the controls are fun. Test on actual R1 for tilt polarity/deadzone, wheel event delivery, touch target comfort, sustained frame pacing, camera legibility, collision fairness, fall timing and whether rolling without the timer is enjoyable. Adjust physics with Rodney's feedback **before** more courses.

Deferred from the 744-line brief: production levels, moving hazards, bombs, surface variants, shortcuts, collectibles, score, audio/music, enemy marbles, sophisticated banking and 3D rigid-body/WebGL rendering. These are deliberately not substitutes for the physics feel gate. The original 2D game is unchanged. All visuals and code in this release are original procedural assets.

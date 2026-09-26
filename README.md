# Marble Madness 3D — Momentum Lab (R1 Creation)

One-course, portrait-first 240×282 physics-tuning prototype in the existing 3D Creation. This is not the separate 2D game and does not contain a second course. It uses projected 2.5D canvas geometry and a planar force/slope model rather than WebGL or full rigid-body dynamics. The seven course sections test neutral spawn, acceleration/coasting, slope, collisions, open-edge falls, checkpoint respawn, and finish detection. No invisible outer wall exists.

## Controls

Tap **ROLL THE LAB** while holding the R1 in your playing posture. Motion permission is requested when the browser requires it; the first valid orientation sample becomes neutral. The game clock does not advance until motion data arrives. If events or permission are unavailable, an explicit message explains the blockage and asks you to check motion access and replay; there is no hidden directional fallback. Tip right for screen-right, pitch down for screen-down (physical axis/polarity still needs R1 testing). Double-tap the open gameplay canvas within 340 ms to jump; menu swipes and control taps cannot jump. Hold **BRAKE** to slow down. The wheel may emit browser `wheel` events for FORCE 1–5; tap or swipe **FORCE** if it does not. Swipe left from within the rightmost 27 px to open the pause drawer; swipe right to close it (or use RESUME). The compact speaker icon is muted by default; tap it to unmute jump and result tones.

## Finish and replay

Reach the luminous goal platform near its center and enter its last 1.5 world units. The clock stops and a **COURSE COMPLETE** result reports remaining time and falls, with **REPLAY COURSE**. There is intentionally no next level in this physics-tuning gate. Timeout similarly offers replay. Falls return to the most recent checkpoint with a four-second penalty.

## Verification

Run `node physics-test.mjs`, `node controls-test.mjs`, then serve the directory on port 8765 (`python -m http.server 8765`) and run `node browser-test.mjs`. The latter exercises touch interactions and finish/replay in Chromium's 240×282 mobile viewport. Browser-injected orientation data does not prove actual R1 sensor delivery. On physical R1, verify neutral spawn, steering polarity, jump, brake, wheel/fallback force, edge swipe drawer and close, speaker, checkpoint and finish result/replay. Report exact orientation directions if reversed. The new release is not physically validated until this on-device test.

Production levels, moving hazards, bombs, surface variants, shortcuts, collectibles, enemy marbles and full rigid-body/WebGL rendering remain outside this one-course gate. All visuals and code are original procedural assets.

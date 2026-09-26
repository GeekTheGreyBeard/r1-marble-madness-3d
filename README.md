# Marble Madness 3D — 25-course R1 Creation

Portrait-first 240×282 projected 2.5D canvas game with a planar force/slope model, open edges, collisions, inertia, checkpoints, bonuses and moving rival marbles. It is an expansion of the existing Momentum Lab proof of concept, not the unrelated 2D game. Course 1 remains Momentum Lab. The 25 named courses have increasing section counts (7–13), varied lateral turns, slopes, posts and bomb hazards, bonus placements and rivals. Side cruising is not a clear lane: turns require tracking the center corridor; open edges punish drift. All assets are procedural and original.

## Play

Choose course and difficulty on the opening card, then hold the device in your playing posture and tap **ROLL THE COURSE**. A valid orientation sample calibrates neutral. The clock does not start without motion data; there is no silent steering fallback. Tilt to steer, double-tap the canvas to jump, hold **BRAKE**, and use wheel FORCE 1–5 or tap/swipe FORCE. Swipe from the right edge to open the pause drawer and swipe right to close. The speaker icon toggles sound, muted initially. Reach the glowing goal to see the result and advance to the next course, or replay. The course picker permits direct access to all 25 rather than gating progression by persistent storage.

Red bombs consume a life and trigger checkpoint respawn; red posts and purple moving rivals physically deflect the ball. Diamonds grant +8 seconds (gold), one-hit bomb protection (mint), or temporary forward boost (violet). Open-edge falls consume a life, then respawn at the latest of two checkpoints with a four-second time penalty; zero lives ends the run. Invulnerability after respawn prevents immediate repeated damage. There is no invisible outside wall.

## Difficulty rules

For course definition *i*, Standard uses its baseline hazard, feature and rival counts; later course definitions increase those baselines. Beginner gives 5 lives, no rivals, half of Standard's hazards (odd counts round up), double Standard's beneficial features and the Standard route length. Standard gives 3 lives. Pro gives 1 life, twice the Standard hazards, rivals and beneficial features, and exactly twice as many traversable sections (with twice the longitudinal route length). Counts are distributed over eligible interior sections rather than clustered at the start. Routes are generated deterministically and the center corridor stays navigable; obstacles telegraph by color/shape and do not block its core. Time allowance scales with route length. Course state and collected bonuses reset on replay.

## Verification and limitations

Run `node controls-test.mjs`, `node campaign-test.mjs`, then serve the directory at `http://127.0.0.1:8765/` and run `node browser-test.mjs`. The campaign test checks all 75 course/difficulty count matrices and follows each complete course with a simulated numerical steering controller through the actual physics integrator and moving rivals. It also checks life loss, bomb, bonus, finish and terminal transitions. The touch-browser test uses Chromium at 240×282 for calibration, brake, jump, drawer, audio, selection, result/replay and no-sensor blocking. These tests show simulated navigability, **not** that a person can finish every course on actual R1 hardware. Physical R1 sensor axes/polarity, wheel events, rendering performance and gameplay balance remain unverified until Rodney installs this release and tests it on device. This is projected geometry rather than WebGL or full rigid-body physics.

Creation card and release-specific installation QR accompany the hosted GitHub Pages release.

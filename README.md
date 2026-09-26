# Marble Madness 3D · Momentum Lab — R1 Creation

This updates the **existing 3D project**, not the separate 2D game. Twenty-five named courses now consist of three large, multi-directional hand-authored route motifs per course, selected and mirrored in course-specific combinations. Each route includes sharp lateral traverses, switchbacks, broad interconnected platforms, optional plaza detours and a compact route map showing the nearby route and next waypoint. The goal is no longer at the end of a repeated straight strip. Pro repeats the spatial module structure to approximately double route length. This is projected canvas geometry, not WebGL or a full 3D rigid-body simulation.

## Play and mechanics

Choose a course and difficulty. Hold the device in a neutral playing posture and start; **tilt is required** to steer, and the clock waits for orientation data. Double-tap the playfield to jump. Hold **BRAKE** to decelerate. Adjust **FORCE 1–5** with the wheel, or tap/swipe FORCE where wheel events are unavailable. Swipe left from the right edge to open the pause drawer and swipe right to close. The speaker icon toggles audio, initially muted. Follow the upper-right route map around the course; you may use adjacent plaza surfaces instead of only the marked primary route.

Blue moving platforms oscillate sideways and carry the marble while supported. Purple elevators raise/lower the support surface 3 world units and prevent entry onto a platform more than 1.15 units above the player's current support unless jumping. Orange fragile platforms warn in red after 2.2 seconds of residence and fall away after 4.5 seconds; they reset on respawn. A missing support surface, bomb, or collapsed platform consumes a life and respawns at the latest safe checkpoint with a four-second penalty. Posts and moving rivals deflect the marble. Diamonds give time, shield, or forward boost. The course ends at the goal platform.

| Level | Lives | Hazards | Rivals | Bonuses | Length |
|---|---:|---:|---:|---:|---:|
| Beginner | 5 | half Standard, odd rounded up | none | twice Standard | baseline |
| Standard | 3 | baseline | baseline | baseline | baseline |
| Pro | 1 | twice Standard | twice Standard | twice Standard | approximately twice baseline |

## Audio and credits

The bundled mono 16 kHz MP3 samples are adapted from the **Kenney Impact Sounds** pack: <https://kenney.nl/assets/impact-sounds>, released under **Creative Commons CC0 1.0** (<https://creativecommons.org/publicdomain/zero/1.0/>). The original pack's license is preserved at `assets/LICENSE.txt`. Concrete and wood footstep recordings provide material-dependent rolling texture; recorded impact, plate, tin, glass, bell and wood samples cue collisions, moving supports, elevator, warning/collapse, jump, pickups, checkpoint, bomb and finish. These are sampled foley effects, not oscillator beep tones. Attribution is provided voluntarily. Audio loads lazily after unmute; missing/unsupported samples fail silently for gameplay, and mute suspends playback. Total bundled audio is about 56 KB.

## Verification and known limitations

Run `node controls-test.mjs`, `node campaign-test.mjs`, and `node route-test.mjs`. Serve the directory using `python3 -m http.server 8765` and run `node browser-test.mjs` for four representative 240×282 screenshots. Campaign tests check all 75 course/difficulty combinations for rule counts, connectivity, occupancy at three animation times, turns, dynamic behavior, collapse/respawn, bomb, feature and finish. There are 25 distinct route signatures. The automated steering probe currently finishes **32/75** combinations; many fail from hazards/falls. It is a simplistic controller, but this means full end-to-end playability across all combinations is **not verified** and should not be claimed. The geometry tests establish adjacent platforms, not human-scale navigability. Physical R1 tilt-axis behavior, wheel handling, sound playback, performance, and course balance require Rodney's on-device acceptance testing after installation. This release is not a Gallery submission.

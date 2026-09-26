# Marble Madness 3D — R1 Creation

A separate, original isometric interpretation of the corrected 20-course marble game. The fixed 240×282 frame projects the scrolling physics world into a beveled, dimensional course with custom vector geometry, gradients and shadows. This is an isometric 2.5D view, not a true 3D engine or a copy of arcade artwork or music.

Tap the opening screen, choose difficulty, then Start. Tilt direction uses browser-standard `DeviceOrientationEvent` after an explicit tap. Wheel speed uses the standard DOM `wheel` event when delivered by the runtime; **the physical R1 wheel event path is undocumented/unverified**, so a discoverable speed control supports tap/swipe and the menu offers slower/faster buttons. Touch D-pad and arrows/WASD steer; touch Jump or press Space to jump, holding for a longer leap. The wheel scales acceleration; it does not modify the underlying level geometry.

`node dynamics-test.mjs` verifies collision-clear, no-edge-only and dynamically steered routes in all 60 level/difficulty combinations with the corrected logical physics. A browser touch and physical R1 test are still necessary to confirm input delivery and rendered playability on hardware. The card and decoded QR point to this HTTPS release.

# RedM acceptance checklist

Run this checklist before release and after changing images or load-screen code.

## Connection lifecycle

- Stop other load-screen resources and ensure `feather-loadscreen`.
- Join from a fully closed RedM client and verify the screen appears immediately.
- Confirm the logo, one randomized background, title, build label, and tip are visible.
- Confirm the mouse cursor appears and configured links can be selected.
- If configured, confirm the default bottom-right CFX busy spinner is hidden.
- With `ManualShutdown = true`, confirm the screen stays visible through session
  startup and closes when the character-selection menu is usable.
- Confirm Feather transitions directly from its loadscreen to Character without
  exposing RedM's black-and-white bridge/loading imagery.
- Test a new account and confirm it closes when the character-creation menu opens.
- With `ManualShutdown = false`, confirm it closes when the network session starts.
- Reconnect once and verify a different starting background can be selected.
- Restart the resource/server and repeat; check the F8 and server consoles for errors.

## Slow loading

- Test with an uncached client or throttled development connection.
- Watch at least one background cross-fade and one tip rotation.
- Confirm progress never moves backward, exceeds 100%, or becomes invalid.
- Confirm broken optional image paths fail without hiding the loading information.

## Display sizes

- Verify 1920×1080, 2560×1440, ultrawide, and a low-resolution window.
- Confirm titles do not clip, the progress percentage remains visible, and important
  subjects in each background remain unobscured.
- Verify reduced-motion mode if the operating system exposes that preference.

## Optional links

- Configure HTTPS Discord and website URLs individually and together.
- Confirm only configured links appear and open the expected destination.
- Remove both URLs and confirm the link area disappears without leaving a gap.

Record the server build, tested RedM artifact, resolutions, and result in the
release or pull-request notes. This checklist requires a live RedM client and is
not covered by the Node.js tests.

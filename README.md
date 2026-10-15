# feather-loadscreen

A lightweight, dependency-free RedM loading screen.

## Installation

```cfg
ensure feather-loadscreen
```

Only one resource should declare a load screen. Disable other load-screen
resources to avoid an unpredictable selection.

Copy the setting in `server.cfg.example` into the main `server.cfg` if the
default CFX busy spinner should be hidden. The manifest enables
`loadscreen_cursor` so configured community links can be clicked.

## Configuration

Edit `web/config.js` to change the title, subtitle, accent, logo, backgrounds,
position, overlay strength, tips, and rotation intervals. Asset paths are
relative to `web/index.html`. Place additional local images in
`web/assets/images`; the manifest packages that directory automatically.

Edit `config.lua` to control when the load screen closes. Presentation settings
belong in `web/config.js`; lifecycle settings belong in `config.lua`.

Examples:

```js
logo: 'assets/images/feather-logo-subdued.png',
backgrounds: [
    'assets/images/background-gunfighter.webp',
    'assets/images/background-town.jpg'
],
randomizeFirstBackground: true,
backgroundPosition: 'center 35%',
backgroundIntervalMs: 12000,
overlayOpacity: 0.72,
buildLabel: 'Alpha',
links: {
    discord: 'https://discord.gg/example',
    website: 'https://example.com'
},
```

The included Feather logo is enabled by default. Set `logo` to an empty string
to hide it or point it to another image in `web/assets/images`. Images must be packaged local files;
remote and data URLs are rejected. Backgrounds cross-fade when more than one
valid path is configured. Set `randomizeFirstBackground` to `false` to
always start with the first configured image.

Community links are optional, must use HTTPS, and remain hidden when empty.
Set `buildLabel` to an empty string to hide it. All loading-stage wording can
be changed under `statusMessages` without editing the UI script.

The load screen handles every event currently documented by CFX: progress,
log lines, data-file loading, map loading, and client initialization events.

### Manual shutdown

The manifest enables CFX manual shutdown. `config.lua` decides how Feather uses
it:

```lua
FeatherLoadscreenConfig = {
    ManualShutdown = true,
    ManualShutdownFallbackMs = 120000,
}
```

With `ManualShutdown = true`, Feather Character closes the load screen after
the character-selection menu (or the creation menu for a new account) opens.
The fallback closes it after the configured delay once the network session has
started, preventing a character-loading error from trapping the player behind
the overlay. Set `ManualShutdown = false` to close when the network session
starts instead. Restart `feather-loadscreen` after changing this Lua setting.

## Browser preview

Open `web/index.html?preview=1` in a browser. Preview mode simulates status and
progress updates, rotates tips and backgrounds, and requires no RedM connection.
Open `web/index.html` without the query to see the normal zero-progress state.

Run `node tests/ui.test.js` for the configuration and CFX event regression checks.

The UI uses standard CFX `loadProgress` and `onLogLine` messages. It clamps bad
progress values and never moves the displayed progress backward.

## Verification

Reconnect after restarting the resource. Confirm the progress value and bar
advance together, status text changes, tips rotate, and the layout remains
readable at 16:9, ultrawide, and low resolutions.

Run the local checks with Node.js:

```text
node --check web/config.js
node --check web/js/script.js
node --test tests/*.test.js
lua5.4 tests/lifecycle.lua
```

GitHub Actions runs the same checks from `.github/workflows/validate.yml`.
Use the [live acceptance procedure](../feather-framework-docs/feather-loadscreen/acceptance.md) for the coordinated RedM release pass.

## Configuration limits and failure behavior

`ManualShutdown` must be a boolean (invalid values use true). Fallback must be a
finite integer from 0 through 600000 milliseconds (invalid values use 120000).
Zero deliberately disables fallback and can retain the overlay indefinitely.
The fallback clock starts only after the network session exists; it does not
cover pre-session connection stalls. Shutdown closes only the retained NUI and
never activates gameplay. A native exception is logged without a closed event;
a later readiness signal or fallback can retry. Readiness events are not replayed
across resource restarts or before handler registration: reconnect after changes.
Coordinate shared-server reconnect windows; refresh before a manifest restart.

Presentation strings are bounded to 160 Unicode characters, subtitle/tips to 512;
backgrounds/tips accept the first 64 entries. Invalid labels use defaults.
Rotation intervals are finite numbers clamped to 5000–120000 ms; invalid values
use 9000 ms for tips and 12000 ms for backgrounds. Overlay opacity is a finite
number clamped to 0–1. Accent accepts six-digit hex. Background position accepts
up to 64 letters, digits, spaces, dots, percent signs and hyphens.
Images must match `assets/images/NAME.png|jpg|jpeg|webp|gif` (letters, digits,
underscore and hyphen in NAME; maximum path length 256). Empty lists use a plain
backdrop. Failed images retain the last good background; a failed first image
tries remaining candidates once. Logo failure hides the logo.

`language` sets the document language (default en). `accessibility` configures
`progress`, `community`, `discord`, `website`, and `tip` labels. `logoAlt` supplies
logo alternative text. `reducedMotion` accepts true (always), false (allow motion),
or auto/omitted (follow OS). Reduced motion removes transitions/animation and
stops tip/background rotation; changing the OS preference updates this behavior.
Links remain optional HTTPS destinations and no remote assets are required.

100% measures Cfx asset loading only. The default completion message is
“Server assets loaded; waiting for character menu” and stays visible through later
asset stage messages. Keep custom `statusMessages.complete` equally truthful.
Browser preview simulates assets and cannot establish Character readiness.

Node 22 tests cover package/config/UI behavior and source guards. Lua 5.4 tests
execute the actual client adapter with mocked Cfx events, timers and natives.
CI installs Lua 5.4; a configured workflow is not evidence of a completed CI run.

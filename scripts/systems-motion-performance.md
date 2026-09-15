# Systems diagram browser comparison

Measured September 15, 2026, using headless Chromium and Chrome DevTools
Protocol on the Astro development server. Desktop viewport: 1440 × 900;
default motion preference. Each sample observes three idle seconds after load.
The page is at scroll position zero, with all ten diagram panels below the fold.
Counts include the panel LED pseudo-elements as well as the SVG animations.

| Measurement | Before | After |
| --- | ---: | ---: |
| Running offscreen panel animations | 56 | 0 |
| Paused panel animations | 0 | 56 |
| Browser TaskDuration delta | 1.095066 s | 0.017396 s |
| Browser LayoutDuration delta | 0.568863 s | 0 s |
| Browser RecalcStyleDuration delta | 0.069108 s | 0.005446 s |

These are measured single-run, whole-page CDP counters, not isolated diagram
CPU/GPU measurements or a production benchmark. Dev-server activity, shared
container load, other page animations, and browser scheduling can change
timings. The dependable result is that all 56 panel animations stop advancing
offscreen; no broad percentage speedup or battery-life claim is made.

## Reproduce / regression checks

Start the configured application workflow, then a separate test browser:

```sh
chromium --headless --no-sandbox --disable-dev-shm-usage \
  --remote-debugging-port=9222 --user-data-dir=/tmp/systems-browser about:blank
node scripts/systems-motion-check.mjs
```

The runner defaults to the Replit development domain. At measurement time the
existing Vite host allowlist rejected that domain, so the test used
`SYSTEMS_TEST_ORIGIN=http://127.0.0.1:5000`. Preview host configuration is
separately tracked; no configuration or dependency changes were made here.
Use `--baseline` on the pre-change source to print measurements without the
new-behavior assertions.

Verified:

- All ten panels animate when visible on 1440 × 900 and 390 × 844 viewports.
- Offscreen panels have no running animations during scrolling; neither
  viewport has horizontal page overflow.
- A simulated hidden-document visibility event pauses every panel and its
  timeline remains unchanged over 300 ms; restoring visibility resumes motion.
  This exercises the handler, not a physical desktop tab switch.
- Live reduced-motion changes stop animation. Auspex audit hashes remain
  visible, with a single final decision instead of overlapping DENY/ALLOW.
- Navigation to About and back through actual Astro links restores observation.
- Disabling JavaScript leaves all ten static SVGs in place.
- Removing IntersectionObserver leaves panel animation disabled. The existing
  global reveal script separately throws in that unsupported-browser case;
  fixing that global behavior is outside this change.
- Production build succeeds. Existing Browserslist age and large-bundle
  warnings are unrelated to this change.

The diagrams' active keyframes, timing, filters, geometry, and labels remain
unchanged. Reduced-motion/static Mycelium now shows the substitute worker and
rerouting event, with explicit worker fills and no decorative token pulses.
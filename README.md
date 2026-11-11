# Functional Strength

A phone-first web app for a personal functional-strength routine: instructions,
timers and a workout log for each exercise. Plain HTML, CSS and JavaScript with
no build step and no dependencies.

## Run it

Serve the folder with any static web server and open it in a browser:

```
python3 -m http.server 8000
```

Then visit http://localhost:8000. Opening `index.html` straight from disk does
not work, because browsers block JavaScript modules on `file://` pages.

To publish, host the folder as-is (for example with GitHub Pages).

## What's in it

| File | Purpose |
| --- | --- |
| `index.html` | Page shell |
| `style.css` | All styling |
| `js/data.js` | The exercise list: instructions, intervals, presets, default targets |
| `js/app.js` | Screens, routing, the log form, history, backup export and import |
| `js/stopwatch.js` | Timer for single-hold exercises (countdown to a target, then counts up) |
| `js/interval-timer.js` | Timer for interval workouts (kettlebell, slow jogging) |
| `js/audio.js` | Beeps, vibration patterns and the cadence metronome |
| `sw.js` | Offline support |
| `manifest.webmanifest` | Lets the app be added to a phone's home screen |

## Adding an exercise

Add an entry to the `exercises` array in `js/data.js`.

- `type: 'timer'` with `defaultDuration` (seconds) gives a countdown to that target.
- `type: 'duration'` gives an open-ended stopwatch.
- `type: 'reps'` logs reps (and sets, with `inputs: ['reps', 'sets']`).
- `intervals` switches the exercise to the interval timer.

Put the icon in `assets/` (256 × 256 is plenty) and add its path to the `CORE`
list in `sw.js` so it is available offline.

## Workout history

History is kept in the browser's local storage on the device, and nowhere else.
Clearing browser data erases it. Use **Export history** on the home screen to
save a backup file, and **Import history** to restore it or move it to another
device. Importing merges with what is already there.

## Offline use

After the first visit the app opens without a connection. When online it always
loads the latest published files, so there is no version number to bump after a
change.

Timers follow the clock, so they stay correct if the phone locks. Sound and
vibration cues can still be delayed while the screen is off, because phones
pause web pages in the background. The app keeps the screen awake while a timer
runs to avoid that.

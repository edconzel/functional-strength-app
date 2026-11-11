# Notes for AI agents working on this repo

- The app is plain HTML, CSS and JavaScript with no build step. Do not add a
  framework, bundler or runtime dependency. `package.json` exists only for the
  tests.
- Run the browser tests before opening a pull request, and say in the pull
  request that they passed:

  ```
  npm install
  npx playwright install chromium   # first time only
  npm test
  ```

  If a browser can't be downloaded, point `CHROME_PATH` at an installed Chrome:
  `CHROME_PATH=/usr/bin/google-chrome npm test`.
- When you add or change behaviour, add or update a test in `tests/` in the
  same pull request.
- When you add a file the app loads (a script or an icon), add it to the `CORE`
  list in `sw.js`. A test fails if you forget.
- Workout history lives in the browser's local storage under `logs_<exercise id>`.
  Do not rename an exercise id or change the saved format without migrating
  existing entries, or the owner loses history.
- Make changes on a branch and open a pull request. Do not push to `master`.

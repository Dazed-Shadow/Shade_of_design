# SYNC SR -- Windows scheduled task (DD-037 Phase 5)

C-Build authors this file; C-Build does NOT run the `/create` line. JR runs
it by his own hand -- system settings are his, same reasoning as the
gallery publish gate (DD-037 Phase 4).

The scheduled task and the on-demand "SYNC SR" trigger both run the exact
same command:

```
python pipeline/legal/sync_sr.py
```

There is no second code path. `sync_sr.py` calls
`export_manifests.run_export()` once, prints a one-line result, appends it
to `pipeline/legal/sync_sr.log`, and never touches git. Daily is a
**ceiling**, not a target -- the corpus moves at JR's curation speed, not
faster.

## Create (run once, JR's hand)

```
schtasks /create /tn "SYNC SR" /tr "\"C:\Users\theri\AppData\Local\Microsoft\WindowsApps\PythonSoftwareFoundation.Python.3.12_qbz5n2kfra8p0\python.exe\" \"C:\Users\theri\Chief of Staff Diary\Terminal\Central Hub\pipeline\legal\sync_sr.py\"" /sc daily /st 03:15 /f
```

- `/tn "SYNC SR"` -- task name, matches the ratified skill-trigger name.
- `/tr` -- the exact command: absolute path to `python.exe`, absolute path
  to `sync_sr.py`. Both `export_manifests.py` and `sync_sr.py` resolve the
  corpus + output directories from `Path(__file__).resolve()`, not from the
  current working directory, so the task's working directory (whatever
  Task Scheduler defaults to) does not matter.
- `/sc daily /st 03:15` -- once a day, 3:15 AM local time (a quiet hour;
  nothing else on the corpus is running then). This is the cadence
  ceiling -- do not schedule more often than daily.
- `/f` -- overwrite without prompting if a task of this name already
  exists (safe to re-run this line; idempotent registration).

## Delete (JR's hand, if the task needs to come out)

```
schtasks /delete /tn "SYNC SR" /f
```

## Verifying the installed task

After JR runs the create line, a one-shot proof without waiting for
3:15 AM:

```
schtasks /run /tn "SYNC SR"
```

Then check `pipeline/legal/sync_sr.log` for a new line and confirm
`git status` in `Terminal/Central Hub/` shows no staged or committed
changes -- the run only touches the working tree.

## Notes

- The `python.exe` path above is this machine's real interpreter path
  (`sys.executable`), not the `WindowsApps\python.exe` alias stub --
  verified directly runnable, not just PATH-resolvable, so Task Scheduler
  (which does not inherit an interactive shell's PATH resolution the same
  way) launches it reliably. If Python is ever reinstalled or the venv
  changes, re-resolve via `python -c "import sys; print(sys.executable)"`
  and update both this file and the installed task (`/create` with `/f`
  again is sufficient -- no need to `/delete` first).
- No auto-git, ever. This task only regenerates manifests + the
  vault-native index in the working tree. JR's commit + merge to main is
  the publish step.

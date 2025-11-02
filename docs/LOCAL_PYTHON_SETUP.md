# Local Python Setup and NumPy Compatibility Guide

## Goals and Requirements
- Keep development, CI, and Docker environments consistent (Python 3.11).
- Ensure fast, reliable `pip install` without platform-specific compilers.
- Minimize setup time and avoid Windows C/C++ toolchain requirements.
- Maintain runtime performance and code stability.

## Options Comparison

### A) Standardize local dev on Python 3.11 (Chosen)
- Tech: Matches Docker image and CI (`python 3.11`). `numpy==1.26.4` wheels available.
- Time/Cost: Minimal; no compiler setup needed.
- Risk: Low; same stack used across environments.
- Maintenance: Easy; single version to support.

### B) Upgrade NumPy to 2.x for Python 3.13
- Tech: Wheels exist for Py3.13 (e.g. `numpy>=2.1`). Compatible with `pandas 2.2.3` and `ta 0.10.2` in most cases.
- Time/Cost: Moderate; need full test pass and watch for deprecation changes.
- Risk: Medium; cross-package compatibility to validate.
- Maintenance: Moderate; version skew vs Docker image.

### C) Build NumPy 1.26.4 from source on Windows (Py3.13)
- Tech: Requires MSVC Build Tools, SDKs, `meson-python`, `ninja`.
- Time/Cost: High; complex setup.
- Risk: High; not officially targeted for Py3.13.
- Maintenance: Hard; developer-specific fragility.

### D) Conda-based environment
- Tech: Simplifies binary availability.
- Time/Cost: Moderate; adds toolchain overhead.
- Risk: Low–Medium; diverges from `pip` workflow used in Docker/CI.
- Maintenance: Additional ecosystem to support.

## Decision
We standardize local development on Python 3.11 (Option A), aligned with Docker and CI. This avoids compiler issues while keeping consistent behavior across environments.

## Implementation Plan
1. Dependencies: Ensure `requirements.txt` includes `numpy==1.26.4` and `aiosqlite==0.20.0` (added).
2. Docker: Rebuild backend image to include `aiosqlite`.
3. Local venv:
   - Windows
     - List versions: `py -0p`
     - Create venv: `py -3.11 -m venv .venv311`
     - Activate: `.venv311\Scripts\Activate.ps1` (PowerShell) or `.venv311\Scripts\activate`
     - Upgrade pip: `python -m pip install --upgrade pip`
     - Install deps: `pip install -r requirements.txt`
4. Test locally:
   - Environment (PowerShell):
     - `set SECRET_KEY=test_secret`
     - `set FERNET_KEY=dGVzdGZlcm5ldGZlcm5ldGZlcm5ldGZlcm5ldGZlcm5ldGZlcm5ldGZs`
     - `set DATABASE_URL=sqlite+aiosqlite:///./test.db`
   - Run: `pytest -q`
5. Validation:
   - Check NumPy: `python -c "import numpy as np; print(np.__version__)"` should print `1.26.4`.
   - Docker tests: `docker compose exec backend pytest -q` (Postgres or override to SQLite as needed).
6. Documentation: Keep this guide as the canonical reference; CI already uses Python 3.11 and SQLite.

## Alternative Path (Python 3.13)
If Python 3.13 must be used locally:
1. Upgrade NumPy in `requirements.txt` to a compatible range:
   - `numpy>=2.1,<2.3`
2. Rebuild Docker backend and run full tests. Verify compatible behavior for `pandas`, `ta`, and custom modules.
3. Prefer binary wheels:
   - `python -m pip install --upgrade pip setuptools wheel`
   - `pip install --only-binary=:all: "numpy>=2.1,<2.3"`
4. Monitor deprecation warnings across the stack and adjust if needed.

## Example: NumPy Smoke Test
See `scripts/numpy_smoke.py` for dtype/shape and NaN handling checks.

## Notes
- CI (`.github/workflows/ci.yml`) pins `python-version: 3.11` and uses `sqlite+aiosqlite` for tests.
- Runtime performance unaffected by these changes; primary focus is reliable installs and consistent behavior.

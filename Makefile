PY=python3
PIP=pip3

.PHONY: venv install test lint run backend frontend manifest verify package update repair

venv:
	$(PY) -m venv venv
	. venv/bin/activate && $(PIP) install --upgrade pip

install:
	. venv/bin/activate && $(PIP) install -r requirements.txt

lint:
	@echo "No linter configured; skipping"

 test:
	. venv/bin/activate && pytest -q

run:
	. venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

backend:
	docker-compose up -d backend

frontend:
	cd frontend && npm install && npm run dev

# --- Paketleme & Güncelleme Yardımcı Hedefler ---

manifest:
	$(PY) scripts/tradebotctl.py manifest --root . --output tradebot.manifest.json

verify:
	$(PY) scripts/tradebotctl.py verify --root . --manifest tradebot.manifest.json || true

package:
	$(PY) scripts/tradebotctl.py package --root . --output dist

update:
	@if [ -z "$(PKG)" ]; then echo "Kullanım: make update PKG=dist/tradebot-YYYYMMDD-HHMMSS.tar.gz"; exit 2; fi; \
	$(PY) scripts/tradebotctl.py update --root . --package "$(PKG)"

repair:
	@if [ -z "$(PKG)" ]; then echo "Kullanım: make repair PKG=dist/tradebot-YYYYMMDD-HHMMSS.tar.gz"; exit 2; fi; \
	$(PY) scripts/tradebotctl.py repair --root . --package "$(PKG)"

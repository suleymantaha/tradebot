PY=python3
PIP=pip3

.PHONY: venv install test lint run backend frontend

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

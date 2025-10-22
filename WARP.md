# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Architecture

This repository contains a cryptocurrency trading bot with a web interface.

- **Backend**: The backend is a FastAPI application located in the `app/` directory. It handles the trading logic, API, and database interactions. Key subdirectories include:
    - `api/`: API routes
    - `core/`: Core utilities
    - `models/`: Database models
    - `schemas/`: Pydantic schemas
    - `services/`: Business logic
- **Frontend**: The frontend is a React application located in the `frontend/` directory. It provides the user interface for managing and monitoring the trading bots.
- **Database**: The application uses PostgreSQL for data storage, with migrations handled by Alembic (`alembic/` directory).
- **Deployment**: The application is containerized using Docker and can be orchestrated with `docker-compose.yml`.

## Common Commands

### Development

- **Run the backend server**:
  ```bash
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  ```
- **Run the frontend server**:
  ```bash
  cd frontend && npm install && npm run dev
  ```
- **Run tests**:
  ```bash
  pytest -q
  ```
- **Apply database migrations**:
  ```bash
  alembic upgrade head
  ```
- **Create a new database migration**:
  ```bash
  alembic revision --autogenerate -m "migration description"
  ```

### Docker

- **Start all services**:
  ```bash
  docker-compose up -d
  ```
- **Stop all services**:
  ```bash
  docker-compose down
  ```
- **View logs**:
  ```bash
  docker-compose logs -f backend
  ```

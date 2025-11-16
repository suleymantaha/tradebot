# Operational Workflows

<cite>
**Referenced Files in This Document**   
- [install.sh](file://install.sh)
- [main.py](file://installer/main.py)
- [docker-compose.yml](file://docker-compose.yml)
- [tradebotctl.py](file://scripts/tradebotctl.py)
- [setup_env.py](file://scripts/setup_env.py)
- [start_tradebot.sh](file://start_tradebot.sh)
- [stop_tradebot.sh](file://stop_tradebot.sh)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Workflow Stages](#workflow-stages)
3. [GUI Installer Implementation](#gui-installer-implementation)
4. [Command-Line Installation](#command-line-installation)
5. [User Journey Example](#user-journey-example)
6. [Operational Workflow Diagram](#operational-workflow-diagram)
7. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
8. [System Management with tradebotctl.py](#system-management-with-tradebotctlpy)

## Introduction
The TradeBot operational workflows document the complete user journey from system installation to active trading bot operation. This documentation covers both graphical user interface (GUI) and command-line installation methods, detailing the implementation of each workflow stage. The system leverages Docker containerization for service orchestration through docker-compose, ensuring consistent deployment across different environments. Users can choose between the user-friendly GUI installer (installer/main.py) or the script-based command-line installation (install.sh) based on their preference and technical expertise. The workflows are designed to guide users through environment setup, system installation, user registration, API key configuration, bot creation, and trade monitoring, providing a comprehensive path from initial setup to active trading operations.

## Workflow Stages
The TradeBot operational workflow consists of six sequential stages that guide users from initial setup to active trading. The environment setup stage verifies system requirements including Docker, Docker Compose, curl, and git, ensuring the necessary infrastructure is in place before installation begins. During system installation, the chosen method (GUI or command-line) orchestrates the deployment of all required services through docker-compose, including the PostgreSQL database, Redis cache, backend API, frontend interface, and optional pgAdmin for database management. Following installation, users proceed to user registration through the web interface, creating their account credentials for accessing the trading platform. The API key configuration stage allows users to securely integrate their Binance exchange credentials, enabling the bot to execute trades on their behalf. Bot creation involves configuring trading parameters such as strategy, leverage, and EMA periods through the intuitive dashboard interface. Finally, trade monitoring provides real-time insights into bot performance, executed trades, and portfolio metrics, allowing users to track and optimize their trading activities. Each stage includes success criteria and validation checks to ensure proper completion before proceeding to the next phase.

**Section sources**
- [install.sh](file://install.sh#L64-L124)
- [main.py](file://installer/main.py#L456-L516)
- [docker-compose.yml](file://docker-compose.yml#L1-L276)

## GUI Installer Implementation
The GUI installer, implemented in installer/main.py, provides a user-friendly five-step wizard for TradeBot installation. The implementation follows a tkinter-based graphical interface with a notebook widget organizing the installation process into sequential pages: Welcome, System Check, Configuration, Installation, and Completion. The installer class initializes with predefined configuration parameters including default port assignments (frontend: 3000, backend: 8000, PostgreSQL: 5432, pgAdmin: 5050) and environment settings. The system check page validates the presence of required dependencies by executing subprocess calls to check Docker, Docker Compose, git, and curl installations, displaying results with appropriate status indicators. The configuration page allows users to customize installation parameters through interactive elements including directory selection, password generation buttons for PostgreSQL and pgAdmin, and port configuration fields. Security features include automatic generation of cryptographically secure passwords using the secrets module and Fernet encryption keys for data protection. During the installation phase, the process executes in a background thread to maintain UI responsiveness, performing operations such as environment file creation, directory setup, nginx configuration, Docker service verification, container cleanup, and service orchestration through docker-compose. The installer implements comprehensive error logging with timestamped entries written to installer.log, including exception stack traces for debugging purposes. Upon successful installation, the completion page displays access information and creates platform-specific desktop shortcuts (.lnk for Windows, .desktop for Linux, .app for macOS) along with start_tradebot.sh/bat and stop_tradebot.sh/bat scripts for manual service management.

**Section sources**
- [main.py](file://installer/main.py#L1-L2065)

## Command-Line Installation
The command-line installation process, implemented in install.sh, provides a script-based approach to TradeBot deployment with comprehensive error handling and user guidance. The script begins with a detailed banner display and implements color-coded output functions (print_status, print_success, print_warning, print_error) to enhance readability and user experience. The installation workflow follows a structured sequence: system requirements verification, Docker service check, environment file setup, directory creation, nginx configuration, container cleanup, service building and startup, service readiness verification, and final information display. The requirements check validates the presence of Docker, Docker Compose, curl, and git, providing platform-specific installation instructions for missing components on Ubuntu/Debian, Arch Linux, and macOS. Environment setup involves copying env.example to .env and generating secure credentials using multiple fallback methods: Python's cryptography library for FERNET_KEY generation, openssl for SECRET_KEY and password creation, and /dev/urandom as a last resort. The script implements safety checks including a warning when running as root and prompts for user confirmation before proceeding. Service orchestration utilizes docker-compose with health checks to ensure dependent services are fully operational before starting subsequent containers. The wait_for_services function polls the backend health endpoint (http://localhost:8000/health) with a 60-attempt limit, providing visual feedback with progress dots. Upon successful installation, the script displays comprehensive access information including URLs for frontend, API documentation, and pgAdmin, along with database connection details and recommended next steps for user onboarding.

**Section sources**
- [install.sh](file://install.sh#L1-L442)

## User Journey Example
The complete user journey demonstrates the practical application of TradeBot installation and operation through both GUI and command-line methods. For the GUI installation, a user would navigate to the installer directory and execute "python installer/main.py" to launch the graphical interface. The welcome page presents an overview of the installation process, followed by the system check page where the user clicks "Sistem Kontrolü Yap" to verify dependencies. After successful validation, the configuration page allows the user to browse for an installation directory, generate secure passwords for PostgreSQL and pgAdmin using the "Oluştur" buttons, and adjust port settings if needed. Clicking "Kurulumu Başlat" initiates the installation process, with real-time progress displayed in the log area. Upon completion, the user receives access information and can launch the application via the desktop shortcut or start_tradebot.sh script. For the command-line approach, the user clones the repository and executes "./install.sh" after making it executable with "chmod +x install.sh". The script automatically checks requirements, generates secure credentials, creates necessary directories, configures nginx, cleans existing containers, builds and starts services, and verifies service readiness. After installation, the user accesses the frontend at http://localhost:3000 to create an account, navigates to the API Keys page to configure their Binance credentials, proceeds to the Bots page to create a new trading bot with desired parameters, and monitors trading activity through the dashboard. Throughout this journey, the user can utilize tradebotctl.py for system maintenance tasks such as manifest generation, package creation, and system verification.

**Section sources**
- [install.sh](file://install.sh#L1-L442)
- [main.py](file://installer/main.py#L1-L2065)
- [start_tradebot.sh](file://start_tradebot.sh#L1-L3)
- [stop_tradebot.sh](file://stop_tradebot.sh#L1-L5)

## Operational Workflow Diagram
```mermaid
flowchart TD
A[Start] --> B{Installation Method}
B --> C[GUI Installer]
B --> D[Command-Line Script]
C --> C1[Launch main.py]
C1 --> C2[Welcome Page]
C2 --> C3[System Check]
C3 --> C4[Configuration]
C4 --> C5[Installation Process]
C5 --> C6[Completion & Shortcuts]
D --> D1[Execute install.sh]
D1 --> D2[Requirements Check]
D2 --> D3[Environment Setup]
D3 --> D4[Service Orchestration]
D4 --> D5[Service Verification]
D5 --> D6[Display Access Info]
C6 --> E[User Registration]
D6 --> E
E --> F[API Key Configuration]
F --> G[Bot Creation]
G --> H[Trade Monitoring]
H --> I[Active Trading]
style A fill:#4CAF50,stroke:#388E3C,color:white
style I fill:#2196F3,stroke:#1976D2,color:white
classDef process fill:#f8f9fa,stroke:#dee2e6,stroke-width:1px;
classDef decision fill:#ffe0b2,stroke:#fb8c00,stroke-width:1px;
classDef success fill:#c8e6c9,stroke:#43a047,stroke-width:1px;
class C,D,decision
class C1,C2,C3,C4,C5,C6,D1,D2,D3,D4,D5,D6,E,F,G,H,process
class I,success
```

**Diagram sources**
- [install.sh](file://install.sh#L1-L442)
- [main.py](file://installer/main.py#L1-L2065)

## Common Pitfalls and Solutions
Several common pitfalls may occur during the TradeBot installation and operation process, each with specific solutions. Docker service issues are frequent, particularly on Linux systems where the Docker daemon may not be running or the user lacks proper permissions. The solution involves starting the Docker service with "sudo systemctl start docker" and adding the user to the docker group with "sudo usermod -aG docker $USER", followed by a terminal restart. Port conflicts can occur when the default ports (3000, 8000, 5432, 5050) are already in use by other applications. This can be resolved by either stopping the conflicting processes using "sudo lsof -i :[port]" to identify and "sudo kill -9 [PID]" to terminate them, or by modifying the port configuration in the GUI installer or docker-compose.yml file. Environment file issues may arise from incorrect secret key formats or missing FERNET_KEY values. The setup_env.py script can regenerate proper environment variables, ensuring the FERNET_KEY is exactly 44 characters and URL-safe. Database connection problems often stem from incorrect DATABASE_URL formatting, particularly when special characters in passwords require URL encoding. The installer automatically handles this encoding, but manual .env modifications may require attention to this detail. Redis authentication failures typically indicate a mismatch between REDIS_PASSWORD and the URLs in CELERY_BROKER_URL and CELERY_RESULT_BACKEND, which should follow the format "redis://:[password]@redis:6379/0". For GUI installer issues on Windows, missing pywin32 dependency can be resolved by installing it with "pip install pywin32". Finally, if the frontend fails to load, clearing browser cache or checking nginx configuration in nginx/nginx.conf may resolve the issue.

**Section sources**
- [SECURE_INSTALL.md](file://SECURE_INSTALL.md#L59-L64)
- [SETUP.md](file://SETUP.md#L92-L103)
- [installer/README.md](file://installer/README.md#L179-L187)

## System Management with tradebotctl.py
The tradebotctl.py script provides comprehensive system management capabilities for TradeBot deployment and maintenance. Implemented as a command-line interface with argparse, it offers several subcommands for different operational tasks. The "manifest" command generates a SHA-256 hash manifest of all project files, excluding specified patterns defined in DEFAULT_IGNORE_PATTERNS or a .manifestignore file, which includes directories like .git, venv, node_modules, and sensitive files like .env. This manifest serves as a reference for system integrity verification. The "verify" command compares the current system state against a manifest file, identifying missing, changed, or extra files, with optional JSON output for automated processing. The "package" command creates a compressed tar.gz archive containing all project files along with the manifest, enabling easy distribution and backup. The "update" and "repair" commands (aliases of each other) synchronize a target directory with source files based on manifest verification, copying missing or changed files while supporting dry-run mode for previewing changes. The tool implements sophisticated file filtering using fnmatch pattern matching, handling both file patterns and directory patterns (with trailing slash) appropriately. Security considerations are addressed by excluding sensitive files by default and implementing read-only operations for verification tasks. The script supports both package-based updates (from a .tar.gz file) and source-based updates (from a directory with a manifest), providing flexibility for different deployment scenarios. Usage examples include generating a manifest with "python scripts/tradebotctl.py manifest", verifying system integrity with "python scripts/tradebotctl.py verify --manifest tradebot.manifest.json", and updating a system with "python scripts/tradebotctl.py update --package tradebot-latest.tar.gz".

**Section sources**
- [tradebotctl.py](file://scripts/tradebotctl.py#L1-L458)
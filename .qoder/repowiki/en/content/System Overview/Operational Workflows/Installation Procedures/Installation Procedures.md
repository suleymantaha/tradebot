# Installation Procedures

<cite>
**Referenced Files in This Document**   
- [install.sh](file://install.sh)
- [installer/main.py](file://installer/main.py)
- [docker-compose.yml](file://docker-compose.yml)
- [SECURE_INSTALL.md](file://SECURE_INSTALL.md)
- [installer/preflight_check.py](file://installer/preflight_check.py)
- [installer/build_macos_app.sh](file://installer/build_macos_app.sh)
- [installer/requirements.txt](file://installer/requirements.txt)
- [env.example](file://env.example)
- [installer/nginx.conf](file://installer/nginx.conf)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Command-Line Installation (install.sh)](#command-line-installation-installsh)
3. [GUI-Based Installation (installer/main.py)](#gui-based-installation-installermainpy)
4. [Configuration and Environment Setup](#configuration-and-environment-setup)
5. [Service Dependencies and Containerized Deployment](#service-dependencies-and-containerized-deployment)
6. [Platform-Specific Considerations](#platform-specific-considerations)
7. [Troubleshooting Common Issues](#troubleshooting-common-issues)
8. [Conclusion](#conclusion)

## Introduction
The TradeBot system provides two primary installation methods: a command-line script (`install.sh`) and a graphical user interface (GUI) application (`installer/main.py`). Both methods automate the setup of a containerized trading environment using Docker, ensuring consistent deployment across different platforms. The installation process includes system requirement checks, secure environment configuration, service orchestration via Docker Compose, and integration with Nginx for reverse proxy functionality. This document details the execution flow, configuration options, and platform-specific considerations for both installation methods, along with troubleshooting guidance for common issues.

**Section sources**
- [install.sh](file://install.sh#L1-L442)
- [installer/main.py](file://installer/main.py#L1-L2066)

## Command-Line Installation (install.sh)
The `install.sh` script provides a fully automated command-line installation process for the TradeBot system. It begins by verifying system requirements, including Docker, Docker Compose, curl, and git. If any dependencies are missing, the script provides platform-specific installation instructions for Ubuntu/Debian, Arch Linux, and macOS. Upon successful dependency verification, the script generates secure cryptographic keys, including a FERNET_KEY using Python's cryptography library or fallback methods with OpenSSL or /dev/urandom. The installation then proceeds to create a `.env` file with strong, randomly generated passwords for PostgreSQL, pgAdmin, and Redis, ensuring secure defaults as outlined in SECURE_INSTALL.md. The script sets up necessary directories for logs, cache, and Nginx configuration, then orchestrates the Docker services using `docker-compose up -d`. It monitors service readiness by polling the backend health endpoint and provides a comprehensive summary of access credentials and next steps upon successful installation.

```mermaid
flowchart TD
Start([Start install.sh]) --> CheckRequirements["Check System Requirements\n(Docker, Docker Compose, curl, git)"]
CheckRequirements --> GenerateKeys["Generate FERNET_KEY\n(Python > OpenSSL > /dev/urandom)"]
GenerateKeys --> SetupEnv["Setup .env File\n(Generate Secure Passwords)"]
SetupEnv --> SetupDirs["Create Directories\n(logs, cache, nginx)"]
SetupDirs --> SetupNginx["Create Nginx Configuration"]
SetupNginx --> CheckDocker["Check Docker Service"]
CheckDocker --> Cleanup["Clean Up Existing Containers"]
Cleanup --> BuildStart["Build and Start Services\n(docker-compose build && up -d)"]
BuildStart --> WaitForServices["Wait for Services\n(Check /health endpoint)"]
WaitForServices --> ShowInfo["Show Final Access Information"]
ShowInfo --> End([Installation Complete])
CheckRequirements -- "Missing Dependencies" --> ProvideInstructions["Provide Platform-Specific\nInstallation Instructions"]
ProvideInstructions --> EndFail([Exit with Error])
CheckDocker -- "Docker Not Running" --> StartDocker["Start Docker Service\n(sudo systemctl start docker)"]
StartDocker -- "Failed" --> EndFail
WaitForServices -- "Timeout" --> EndFail
```

**Diagram sources**
- [install.sh](file://install.sh#L1-L442)

**Section sources**
- [install.sh](file://install.sh#L1-L442)

## GUI-Based Installation (installer/main.py)
The GUI-based installation is implemented in `installer/main.py` using Python's tkinter library, providing a user-friendly wizard interface. The installer consists of five sequential pages: Welcome, System Check, Configuration, Installation, and Completion. The System Check page verifies the presence of Docker, Docker Compose, git, and curl, displaying real-time status with color-coded indicators. The Configuration page allows users to customize installation settings, including the installation directory, port assignments for frontend, backend, PostgreSQL, and pgAdmin, and environment selection (Production/Development). Users can generate secure passwords for PostgreSQL and pgAdmin directly within the interface. The Installation page features a progress bar and real-time log output, providing transparency into the installation process. Upon completion, the Finish page displays access credentials and provides buttons to open the frontend, API documentation, and pgAdmin in the default web browser. The installer also creates platform-specific desktop shortcuts and startup scripts (`start_tradebot.sh/bat`, `stop_tradebot.sh/bat`) for easy project management.

```mermaid
classDiagram
class TradeBotInstaller {
+root : tk.Tk
+install_path : str
+config : dict[str, str]
+error_log : list[str]
+log_file : str
+notebook : ttk.Notebook
+nav_frame : ttk.Frame
+prev_btn : ttk.Button
+next_btn : ttk.Button
+current_page : int
+__init__(root : tk.Tk)
+setup_logging()
+log_error(message, exception)
+log_warning(message)
+log_info(message)
+create_welcome_page()
+create_system_check_page()
+create_config_page()
+create_install_page()
+create_finish_page()
+update_navigation()
+prev_page()
+next_page()
+browse_directory()
+generate_postgres_password()
+generate_pgadmin_password()
+check_system()
+validate_system()
+validate_config()
+start_installation()
+run_installation()
+setup_directories()
+setup_nginx()
+check_docker_service()
+cleanup_containers()
+create_env_file(force_recreate)
+check_password_sync()
+check_password_sync_gui()
+start_services()
+check_for_updates()
+wait_for_services()
+create_startup_scripts()
+get_start_script_content()
+get_stop_script_content()
+create_desktop_shortcut()
+get_desktop_path()
+create_windows_shortcut(desktop_path)
+create_linux_shortcut(desktop_path)
+create_macos_shortcut(desktop_path)
+open_log_file()
+open_install_directory()
+recreate_desktop_shortcut()
+quick_fix_docker_cleanup()
+quick_fix_docker_restart()
+quick_fix_network_cleanup()
+quick_fix_cleanup_images()
+quick_fix_password_sync()
+show_success_info()
+open_frontend()
+open_api_docs()
+open_pgadmin()
+close_app()
}
class tk.Tk {
+title(text)
+geometry(size)
+resizable(bool, bool)
+mainloop()
}
class ttk.Notebook {
+pack(fill, expand, padx, pady)
+add(page, text)
+select(index)
}
class ttk.Frame {
+pack(fill, expand, padx, pady)
}
class ttk.Label {
+pack(anchor, pady)
}
class ttk.Button {
+pack(side, padx)
+config(state)
}
class ttk.LabelFrame {
+pack(fill, expand, padx, pady)
}
class ttk.Entry {
+pack(side, fill, expand, padx)
}
class ttk.Radiobutton {
+pack(anchor)
}
class ttk.Checkbutton {
+pack(anchor)
}
class tk.Text {
+pack(side, fill, expand)
+insert(index, text)
+see(index)
+configure(yscrollcommand)
+config(state)
}
class ttk.Scrollbar {
+pack(side, fill)
+configure(command)
}
class messagebox {
+showwarning(title, message)
+showerror(title, message)
+showinfo(title, message)
+askyesno(title, message)
}
class filedialog {
+askdirectory(initialdir)
}
class subprocess {
+run(cmd, capture_output, text, timeout)
+Popen(cmd, stdout, stderr)
}
class threading {
+Thread(target, daemon)
}
class os {
+chdir(path)
+getenv(key)
+putenv(key, value)
+environ
+path.exists(path)
+path.join(path, *paths)
+path.dirname(path)
+path.basename(path)
+path.splitext(path)
+makedirs(path, exist_ok)
+chmod(path, mode)
+startfile(path)
+getcwd()
}
class shutil {
+copy2(src, dst)
}
class datetime {
+datetime.now()
}
class json {
+dumps(obj, indent, ensure_ascii)
}
class webbrowser {
+open(url)
}
TradeBotInstaller --> tk.Tk : "uses"
TradeBotInstaller --> ttk.Notebook : "uses"
TradeBotInstaller --> ttk.Frame : "uses"
TradeBotInstaller --> ttk.Label : "uses"
TradeBotInstaller --> ttk.Button : "uses"
TradeBotInstaller --> ttk.LabelFrame : "uses"
TradeBotInstaller --> ttk.Entry : "uses"
TradeBotInstaller --> ttk.Radiobutton : "uses"
TradeBotInstaller --> ttk.Checkbutton : "uses"
TradeBotInstaller --> tk.Text : "uses"
TradeBotInstaller --> ttk.Scrollbar : "uses"
TradeBotInstaller --> messagebox : "uses"
TradeBotInstaller --> filedialog : "uses"
TradeBotInstaller --> subprocess : "uses"
TradeBotInstaller --> threading : "uses"
TradeBotInstaller --> os : "uses"
TradeBotInstaller --> shutil : "uses"
TradeBotInstaller --> datetime : "uses"
TradeBotInstaller --> json : "uses"
TradeBotInstaller --> webbrowser : "uses"
```

**Diagram sources**
- [installer/main.py](file://installer/main.py#L21-L2066)

**Section sources**
- [installer/main.py](file://installer/main.py#L1-L2066)

## Configuration and Environment Setup
The TradeBot installation process emphasizes secure configuration management through automated environment file generation. Both installation methods create a `.env` file based on the `env.example` template, populating it with cryptographically secure values. The `SECURE_INSTALL.md` document outlines the security hardening measures applied during this process, including the use of strong passwords, secure key generation, and proper environment variable configuration. The `.env` file contains critical configuration options such as database credentials, Redis password, FERNET_KEY for data encryption, and JWT settings. The installation scripts ensure that sensitive information is never hardcoded and that default weak credentials are replaced with generated secure values. The `preflight_check.py` script validates system readiness by checking for required dependencies, including Python 3.10+, tkinter, requests, cryptography, and pywin32 on Windows. This preflight check ensures that the installation environment meets all prerequisites before proceeding with the setup process.

```mermaid
flowchart TD
Start([Start Configuration]) --> CheckTemplate["Check env.example Template"]
CheckTemplate --> GenerateSecureValues["Generate Secure Values\n(Passwords, Keys, Tokens)"]
GenerateSecureValues --> CreateEnvFile["Create .env File"]
CreateEnvFile --> ValidateEnv["Validate .env File\n(preflight_check.py)"]
ValidateEnv --> CheckDependencies["Check Dependencies\n(Python, tkinter, requests, cryptography)"]
CheckDependencies --> CheckPermissions["Check File Permissions"]
CheckPermissions --> CheckDocker["Check Docker & Docker Compose"]
CheckDocker --> CheckGit["Check git & curl"]
CheckGit --> ApplySecurity["Apply Security Hardening\n(SECURE_INSTALL.md)"]
ApplySecurity --> SetStrongJWT["Set Strong JWT Settings\n(ALGORITHM=HS512, ACCESS_TOKEN_EXPIRE_MINUTES=10080)"]
SetStrongJWT --> EnforceReadOnly["Enforce Read-Only Containers\n(read_only: true, cap_drop: ALL)"]
EnforceReadOnly --> ConfigureNginx["Configure Nginx Reverse Proxy"]
ConfigureNginx --> FinalizeConfig["Finalize Configuration"]
FinalizeConfig --> End([Configuration Complete])
ValidateEnv -- "Validation Failed" --> EndFail([Exit with Error])
CheckDependencies -- "Missing Dependencies" --> EndFail
CheckPermissions -- "Insufficient Permissions" --> EndFail
CheckDocker -- "Docker Not Available" --> EndFail
CheckGit -- "git or curl Missing" --> EndFail
```

**Diagram sources**
- [env.example](file://env.example#L1-L89)
- [SECURE_INSTALL.md](file://SECURE_INSTALL.md#L1-L77)
- [installer/preflight_check.py](file://installer/preflight_check.py#L1-L108)

**Section sources**
- [env.example](file://env.example#L1-L89)
- [SECURE_INSTALL.md](file://SECURE_INSTALL.md#L1-L77)
- [installer/preflight_check.py](file://installer/preflight_check.py#L1-L108)

## Service Dependencies and Containerized Deployment
The TradeBot system relies on several key service dependencies orchestrated through Docker Compose, as defined in `docker-compose.yml`. The primary services include PostgreSQL for data persistence, Redis for caching and Celery message brokering, a backend API server, Celery workers for asynchronous task processing, a frontend web application, and an Nginx reverse proxy for production deployment. The `SECURE_INSTALL.md` document details the security hardening measures applied to these services, such as running containers as non-root users, disabling new privileges, dropping all capabilities, and mounting read-only filesystems. The installation process ensures that services are started in the correct order, with health checks verifying the readiness of dependent services before proceeding. The Nginx configuration, generated by both installation methods, routes traffic to the frontend and backend services, providing a unified entry point for the application. The `build_macos_app.sh` script demonstrates the platform-specific build process for creating a standalone macOS application bundle, integrating PyInstaller for packaging the GUI installer.

```mermaid
graph TB
subgraph "Docker Services"
postgres[(PostgreSQL)]
redis[(Redis)]
backend[Backend API]
celery-worker[Celery Worker]
celery-beat[Celery Beat]
frontend[Frontend]
nginx[Nginx]
pgadmin[pgAdmin]
end
subgraph "Host System"
install_sh[install.sh]
main_py[installer/main.py]
build_macos_app_sh[build_macos_app.sh]
end
install_sh --> docker-compose.yml
main_py --> docker-compose.yml
build_macos_app_sh --> main_py
docker-compose.yml --> postgres
docker-compose.yml --> redis
docker-compose.yml --> backend
docker-compose.yml --> celery-worker
docker-compose.yml --> celery-beat
docker-compose.yml --> frontend
docker-compose.yml --> nginx
docker-compose.yml --> pgadmin
backend --> postgres
backend --> redis
celery-worker --> postgres
celery-worker --> redis
celery-beat --> postgres
celery-beat --> redis
frontend --> backend
nginx --> frontend
nginx --> backend
pgadmin --> postgres
style postgres fill:#f9f,stroke:#333
style redis fill:#f9f,stroke:#333
style backend fill:#bbf,stroke:#333
style celery-worker fill:#bbf,stroke:#333
style celery-beat fill:#bbf,stroke:#333
style frontend fill:#bbf,stroke:#333
style nginx fill:#bbf,stroke:#333
style pgadmin fill:#bbf,stroke:#333
style install_sh fill:#ff9,stroke:#333
style main_py fill:#ff9,stroke:#333
style build_macos_app_sh fill:#ff9,stroke:#333
```

**Diagram sources**
- [docker-compose.yml](file://docker-compose.yml#L1-L276)
- [SECURE_INSTALL.md](file://SECURE_INSTALL.md#L1-L77)
- [installer/build_macos_app.sh](file://installer/build_macos_app.sh#L1-L254)

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L1-L276)
- [SECURE_INSTALL.md](file://SECURE_INSTALL.md#L1-L77)
- [installer/build_macos_app.sh](file://installer/build_macos_app.sh#L1-L254)

## Platform-Specific Considerations
The TradeBot installation process accounts for platform-specific differences across Linux, Windows (via WSL), and macOS. The `install.sh` script provides tailored installation instructions for Ubuntu/Debian, Arch Linux, and macOS using Homebrew. The GUI installer (`installer/main.py`) detects the operating system and adjusts its behavior accordingly, such as using different methods to start Docker Desktop on Windows and macOS. The `build_macos_app.sh` script specifically targets macOS, using PyInstaller to create a standalone `.app` bundle and optionally packaging it into a DMG disk image for distribution. On Windows, the installer creates `.lnk` shortcuts and batch files (`start_tradebot.bat`, `stop_tradebot.bat`), while on Linux and macOS, it creates shell scripts (`start_tradebot.sh`, `stop_tradebot.sh`) and desktop entries. The installation scripts handle platform-specific path separators, file permissions, and command execution methods to ensure consistent behavior across different operating systems.

**Section sources**
- [install.sh](file://install.sh#L1-L442)
- [installer/main.py](file://installer/main.py#L1-L2066)
- [installer/build_macos_app.sh](file://installer/build_macos_app.sh#L1-L254)

## Troubleshooting Common Issues
Common installation issues include permission denied errors, missing dependencies, and failed container startups. The `install.sh` script addresses permission issues by advising users not to run as root and providing instructions for adding the user to the docker group. Missing dependencies are handled by providing platform-specific installation commands for Docker, Docker Compose, curl, and git. For failed container startups, the installation scripts implement comprehensive error handling and logging. The GUI installer includes a dedicated error popup with quick-fix buttons for common issues, such as Docker cleanup, Docker restart, network cleanup, image cleanup, and password synchronization. Database initialization issues are addressed by the `start_services` method in `installer/main.py`, which performs password reconciliation between the `.env` file and the PostgreSQL container, automatically resetting the database volume if necessary. The `SECURE_INSTALL.md` document provides additional troubleshooting guidance for issues such as 401/403 errors, encryption failures, database connection problems, Redis authentication errors, and port conflicts.

```mermaid
flowchart TD
Start([Installation Issue]) --> IdentifyIssue["Identify Issue Type"]
IdentifyIssue --> PermissionDenied["Permission Denied"]
IdentifyIssue --> MissingDependencies["Missing Dependencies"]
IdentifyIssue --> ContainerFailure["Container Startup Failure"]
IdentifyIssue --> DatabaseInit["Database Initialization Issue"]
PermissionDenied --> CheckRoot["Check if Running as Root"]
CheckRoot -- "Yes" --> AdviseNonRoot["Advise Against Root Execution"]
CheckRoot -- "No" --> CheckDockerGroup["Check User in Docker Group"]
CheckDockerGroup -- "No" --> AddToDockerGroup["Add User to Docker Group\nsudo usermod -aG docker \$USER"]
AddToDockerGroup --> RestartTerminal["Restart Terminal"]
MissingDependencies --> IdentifyMissing["Identify Missing Component"]
IdentifyMissing --> Docker["Docker"]
IdentifyMissing --> DockerCompose["Docker Compose"]
IdentifyMissing --> curl["curl"]
IdentifyMissing --> git["git"]
Docker --> ProvideInstallCmd["Provide Platform-Specific\nInstallation Command"]
DockerCompose --> ProvideInstallCmd
curl --> ProvideInstallCmd
git --> ProvideInstallCmd
ProvideInstallCmd --> RetryInstall["Retry Installation"]
ContainerFailure --> CheckLogs["Check Docker Logs"]
CheckLogs --> AnalyzeError["Analyze Error Message"]
AnalyzeError --> PortConflict["Port Conflict"]
AnalyzeError --> NetworkIssue["Network Issue"]
AnalyzeError --> ImageIssue["Image Issue"]
PortConflict --> ChangePorts["Change Port Configuration"]
NetworkIssue --> RunNetworkCleanup["Run Network Cleanup\n(quick_fix_network_cleanup)"]
ImageIssue --> RunImageCleanup["Run Image Cleanup\n(quick_fix_cleanup_images)"]
DatabaseInit --> CheckPasswordSync["Check Password Synchronization"]
CheckPasswordSync --> PasswordMismatch["Password Mismatch"]
PasswordMismatch --> ResetVolume["Reset Database Volume\n(docker-compose down -v)"]
ResetVolume --> Reinstall["Reinstall Services"]
AdviseNonRoot --> End
AddToDockerGroup --> End
RetryInstall --> End
ChangePorts --> End
RunNetworkCleanup --> End
RunImageCleanup --> End
Reinstall --> End
```

**Diagram sources**
- [install.sh](file://install.sh#L1-L442)
- [installer/main.py](file://installer/main.py#L1-L2066)
- [SECURE_INSTALL.md](file://SECURE_INSTALL.md#L1-L77)

**Section sources**
- [install.sh](file://install.sh#L1-L442)
- [installer/main.py](file://installer/main.py#L1-L2066)
- [SECURE_INSTALL.md](file://SECURE_INSTALL.md#L1-L77)

## Conclusion
The TradeBot system offers two robust installation methods: a command-line script (`install.sh`) and a GUI-based application (`installer/main.py`). Both methods automate the setup of a secure, containerized trading environment, ensuring consistent deployment across Linux, Windows (via WSL), and macOS. The installation process emphasizes security through automated generation of strong passwords and cryptographic keys, adherence to best practices outlined in `SECURE_INSTALL.md`, and comprehensive error handling. The integration with Docker and Nginx enables scalable and production-ready deployment, while platform-specific considerations ensure compatibility across different operating systems. The detailed troubleshooting guidance and quick-fix utilities provided in the GUI installer enhance the user experience and simplify issue resolution. By following the procedures outlined in this document, users can successfully install and configure the TradeBot system for professional trading operations.
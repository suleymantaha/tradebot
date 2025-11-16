# Installation and Setup Issues

<cite>
**Referenced Files in This Document**   
- [install.sh](file://install.sh)
- [setup_security.sh](file://scripts/setup_security.sh)
- [docker-compose.yml](file://docker-compose.yml)
- [preflight_check.py](file://installer/preflight_check.py)
- [build_macos_app.sh](file://installer/build_macos_app.sh)
- [WSL_DOCKER_KURULUM_REHBERI.md](file://WSL_DOCKER_KURULUM_REHBERI.md)
- [main.py](file://installer/main.py)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Common Installation Problems](#common-installation-problems)
3. [Docker Container Failures](#docker-container-failures)
4. [Dependency Conflicts](#dependency-conflicts)
5. [Environment Variable Misconfigurations](#environment-variable-misconfigurations)
6. [Permission Errors](#permission-errors)
7. [Platform-Specific Issues](#platform-specific-issues)
8. [Debugging Failed Installations](#debugging-failed-installations)
9. [Preflight Checks](#preflight-checks)
10. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive guidance on installation and setup issues for the TradeBot system. It covers common problems encountered during initial setup, including Docker container failures, dependency conflicts, environment variable misconfigurations, and permission errors. The content references actual installation scripts such as install.sh and setup_security.sh, explains the correct usage of docker-compose.yml for service orchestration, and addresses solutions for platform-specific issues on Windows (via WSL) and macOS. Step-by-step debugging guidance is provided for failed installations, including log inspection and preflight checks from preflight_check.py.

**Section sources**
- [install.sh](file://install.sh#L1-L442)
- [setup_security.sh](file://scripts/setup_security.sh#L1-L60)

## Common Installation Problems
The TradeBot system installation can encounter several common issues that prevent successful deployment. These include Docker service failures, missing system requirements, incorrect environment configurations, and permission-related problems. The primary installation script (install.sh) performs comprehensive system requirement checks before proceeding with the installation process, verifying the presence of Docker, Docker Compose, curl, and git. When any of these requirements are missing, the script provides specific installation instructions for different operating systems including Ubuntu/Debian, Arch Linux, and macOS.

The installation process follows a structured sequence: checking system requirements, generating encryption keys, setting up environment files, creating necessary directories, configuring Nginx, cleaning existing containers, starting services, and waiting for services to become ready. Each step includes error handling and status reporting to help identify where failures occur. The script uses color-coded output to distinguish between informational messages, warnings, and errors, making it easier to diagnose problems during the installation process.

**Section sources**
- [install.sh](file://install.sh#L64-L124)
- [preflight_check.py](file://installer/preflight_check.py#L28-L39)

## Docker Container Failures
Docker container failures are among the most common installation issues in the TradeBot system. The docker-compose.yml file defines multiple services including PostgreSQL, Redis, backend API, Celery workers, frontend, Nginx reverse proxy, and pgAdmin, each with specific health checks and dependency conditions. Container failures can occur due to various reasons such as port conflicts, insufficient system resources, or network configuration issues.

The installation scripts implement several strategies to address Docker container failures. The install.sh script includes a dedicated function to check and start the Docker service if it's not running. For macOS users, the start_tradebot.sh script attempts to automatically launch Docker Desktop if the service is not active. The docker-compose.yml file uses health checks with retry mechanisms to ensure services are fully operational before dependent services start. For example, the backend service waits for both PostgreSQL and Redis to be healthy before starting.

When container failures occur, the recommended troubleshooting steps include checking Docker service status, verifying port availability, examining container logs, and ensuring proper network configuration. The WSL_DOCKER_KURULUM_REHBERI.md guide provides specific instructions for resolving Docker issues in Windows WSL environments, including restarting WSL and verifying WSL2 backend configuration in Docker Desktop.

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L22-L27)
- [start_tradebot.sh](file://start_tradebot.sh#L49-L96)
- [WSL_DOCKER_KURULUM_REHBERI.md](file://WSL_DOCKER_KURULUM_REHBERI.md#L134-L148)

## Dependency Conflicts
Dependency conflicts can prevent successful installation of the TradeBot system. The preflight_check.py script in the installer directory performs comprehensive dependency validation, checking for required Python version (3.10 or higher), essential Python packages (requests, cryptography, tkinter), and system-level dependencies. On Windows systems, the pywin32 package is additionally required for proper functionality.

The installation process uses multiple approaches to manage dependencies. The GUI installer (main.py) creates a virtual environment and installs dependencies using pip, while the build scripts (build.sh and build_macos_app.sh) use PyInstaller with explicit hidden imports to ensure all required modules are included in the final executable. The setup_security.sh script verifies Python3 availability before proceeding with security key generation.

Common dependency-related issues include missing Python packages, incompatible Python versions, and platform-specific dependencies. The preflight_check.py script generates a JSON summary of the system state, which can be used to identify missing dependencies. For macOS users, the build_macos_app.sh script includes specific handling for creating .app packages with proper code signing and entitlements.

**Section sources**
- [preflight_check.py](file://installer/preflight_check.py#L47-L69)
- [build_macos_app.sh](file://installer/build_macos_app.sh#L35-L53)
- [setup_security.sh](file://scripts/setup_security.sh#L6-L9)

## Environment Variable Misconfigurations
Environment variable misconfigurations are a frequent cause of installation failures in the TradeBot system. The installation process relies heavily on environment variables for configuration, with the .env file serving as the central configuration point. The install.sh script automatically generates a .env file from env.example, creating secure random values for critical security parameters including FERNET_KEY, SECRET_KEY, PostgreSQL password, pgAdmin password, and Redis password.

Key environment variables include:
- **POSTGRES_PASSWORD**: Randomly generated 16-character alphanumeric password
- **SECRET_KEY**: Randomly generated 64-character URL-safe token for JWT authentication
- **FERNET_KEY**: Cryptographic key for API key encryption
- **REDIS_PASSWORD**: Randomly generated 24-character base64-encoded password
- **DATABASE_URL**: Connection string with encoded PostgreSQL password

The setup_security.sh script provides an alternative method for generating security keys and creating the .env file. It's crucial to avoid using default values in production environments, as emphasized in the security warnings output by the setup_security.sh script. The docker-compose.yml file references these environment variables extensively, using them to configure service authentication and connection parameters.

**Section sources**
- [install.sh](file://install.sh#L127-L208)
- [setup_security.sh](file://scripts/setup_security.sh#L14-L51)
- [docker-compose.yml](file://docker-compose.yml#L7-L13)

## Permission Errors
Permission errors can occur during TradeBot installation, particularly when creating directories, writing configuration files, or executing installation scripts. The installation process requires appropriate file system permissions to create necessary directories such as logs, cache/data, and nginx/ssl. The install.sh script creates these directories with specific permissions (755) to ensure proper access.

The WSL_DOCKER_KURULUM_REHBERI.md guide addresses common permission issues in Windows WSL environments, where Docker service access may be restricted. It recommends running PowerShell as an administrator when performing WSL and Docker installations. The start_tradebot.sh script on Linux systems uses sudo to start the Docker service when necessary, acknowledging that Docker operations typically require elevated privileges.

For the GUI installer (main.py), permission issues are handled by checking directory access before attempting to write files. The installer creates a log file to record installation progress and errors, which can help diagnose permission-related problems. Users should ensure they have write permissions to the installation directory and that Docker has the necessary privileges to create and manage containers.

**Section sources**
- [install.sh](file://install.sh#L224-L226)
- [WSL_DOCKER_KURULUM_REHBERI.md](file://WSL_DOCKER_KURULUM_REHBERI.md#L203-L204)
- [start_tradebot.sh](file://start_tradebot.sh#L70-L78)

## Platform-Specific Issues
Platform-specific issues require different approaches for successful TradeBot installation on various operating systems. The system supports installation on Linux, macOS, and Windows (via WSL), with specific scripts and guides for each platform.

For **Windows users** using WSL, the WSL_DOCKER_KURULUM_REHBERI.md guide provides comprehensive instructions for resolving common issues. This includes troubleshooting Docker startup problems, WSL connection issues, and port conflicts. The guide details steps for completely removing and reinstalling WSL, repairing Windows system files, and configuring Docker Desktop to use the WSL2 backend. It also addresses TPM (Trusted Platform Module) related issues that can prevent Docker from starting.

For **macOS users**, the build_macos_app.sh script creates a standalone .app package that can be easily distributed and installed. This script handles platform-specific requirements such as creating proper code signing and entitlements, generating .icns icon files, and creating DMG disk images for distribution. The start_tradebot.sh script includes specific logic for launching Docker Desktop on macOS when the Docker service is not running.

For **Linux users**, the installation process is generally straightforward, but may require manual Docker service startup using systemctl. The install.sh script provides specific package installation commands for Ubuntu/Debian and Arch Linux distributions.

**Section sources**
- [WSL_DOCKER_KURULUM_REHBERI.md](file://WSL_DOCKER_KURULUM_REHBERI.md#L1-L317)
- [build_macos_app.sh](file://installer/build_macos_app.sh#L1-L254)
- [start_tradebot.sh](file://start_tradebot.sh#L49-L96)

## Debugging Failed Installations
Debugging failed installations requires a systematic approach to identify and resolve issues. The TradeBot system provides multiple tools and techniques for troubleshooting installation problems. The preflight_check.py script performs comprehensive system validation before installation begins, checking Python version, required dependencies, Docker availability, and file system permissions.

When installations fail, the first step is to examine the output of the installation script, which uses color-coded messages to indicate status (blue for information, green for success, yellow for warnings, and red for errors). The install.sh script includes specific error messages with suggested solutions, such as installing missing dependencies or starting the Docker service.

For Docker-related issues, the following commands are useful for diagnosis:
- `docker ps -a`: List all containers (running and stopped)
- `docker-compose logs -f [service]`: View real-time logs for specific services
- `docker exec -it [container] bash`: Access a running container for inspection
- `netstat -ano | findstr :[port]`: Check for port conflicts

The WSL_DOCKER_KURULUM_REHBERI.md guide recommends checking Windows Event Viewer, Docker Desktop logs, and WSL status when troubleshooting installation issues on Windows. For persistent problems, completely removing and reinstalling WSL and Docker Desktop may be necessary.

**Section sources**
- [preflight_check.py](file://installer/preflight_check.py#L72-L102)
- [install.sh](file://install.sh#L48-L55)
- [WSL_DOCKER_KURULUM_REHBERI.md](file://WSL_DOCKER_KURULUM_REHBERI.md#L309-L317)

## Preflight Checks
Preflight checks are essential for ensuring a successful TradeBot installation. The preflight_check.py script performs comprehensive system validation before installation begins, checking multiple aspects of the system environment. This script is designed to be run before the main installation process to identify potential issues early.

The preflight checks include:
- **Operating system**: Identifies the current platform using platform.platform()
- **Python version**: Verifies Python 3.10 or higher is available
- **File permissions**: Checks read/write access to critical directories
- **Dependencies**: Validates availability of required Python packages
- **Docker**: Confirms Docker and Docker Compose are installed and accessible
- **Git**: Verifies git is available for source code operations

The script outputs a JSON summary of the system state, making it easy to parse programmatically. It returns an exit code of 1 if critical failures are detected (such as insufficient Python version, missing dependencies, or unavailable Docker Compose), allowing automated systems to halt installation before attempting to proceed with incompatible configurations.

The GUI installer (main.py) incorporates similar preflight checks in its installation wizard, providing a user-friendly interface for validating system requirements before proceeding with the installation process.

**Section sources**
- [preflight_check.py](file://installer/preflight_check.py#L1-L108)
- [main.py](file://installer/main.py#L532-L571)

## Conclusion
Successful installation of the TradeBot system requires careful attention to system requirements, proper configuration of environment variables, and resolution of platform-specific issues. The comprehensive installation scripts and guides provided with the system address common problems such as Docker container failures, dependency conflicts, environment variable misconfigurations, and permission errors.

By following the systematic approach outlined in this document, users can successfully install and configure the TradeBot system on various platforms including Linux, macOS, and Windows (via WSL). The combination of automated installation scripts, preflight checks, and detailed troubleshooting guides provides a robust framework for resolving installation issues and ensuring a smooth setup process.

For users encountering persistent problems, the detailed logging and error reporting in the installation scripts, combined with the comprehensive troubleshooting guidance in the WSL_DOCKER_KURULUM_REHBERI.md document, provide the necessary tools to diagnose and resolve even complex installation issues.
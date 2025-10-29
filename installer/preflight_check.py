import os
import sys
import json
import subprocess
import platform
from pathlib import Path


def check_permissions(paths):
    results = {}
    for p in paths:
        try:
            path = Path(p)
            results[p] = {
                "exists": path.exists(),
                "readable": os.access(path, os.R_OK),
                "writable": os.access(path, os.W_OK),
            }
        except Exception as e:
            results[p] = {"error": str(e)}
    return results


def run_cmd(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")


def check_docker():
    info = run_cmd(["docker", "info"]) 
    compose_v2 = run_cmd(["docker", "compose", "version"]) 
    compose_v1 = run_cmd(["docker-compose", "version"]) if compose_v2.returncode != 0 else None
    return {
        "docker_info": info.returncode == 0,
        "compose_v2": compose_v2.returncode == 0,
        "compose_v1": (compose_v1 and compose_v1.returncode == 0) or False,
        "docker_info_err": info.stderr,
        "compose_v2_err": compose_v2.stderr,
        "compose_v1_err": compose_v1.stderr if compose_v1 else "",
    }


def check_git():
    res = run_cmd(["git", "--version"]) 
    return {"available": res.returncode == 0, "stderr": res.stderr, "stdout": res.stdout}


def check_python():
    ok = sys.version_info >= (3, 10)
    return {"version": sys.version, "min_required": "3.10", "ok": ok}


def check_dependencies():
    mods = {
        "requests": "requests",
        "cryptography": "cryptography",
        "tkinter": "tkinter",
    }
    # Windows özel: pywin32
    if platform.system() == "Windows":
        mods["pywin32(win32api)"] = "win32api"

    results = {}
    for name, imp in mods.items():
        try:
            __import__(imp)
            results[name] = True
        except Exception as e:
            results[name] = f"missing: {e}"
    return results


def main():
    root = Path(__file__).resolve().parents[1]
    targets = [root / "installer", root / "docs", root / "docker-compose.yml"]
    perm = check_permissions([str(t) for t in targets])
    py = check_python()
    deps = check_dependencies()
    docker = check_docker()
    git = check_git()

    summary = {
        "os": platform.platform(),
        "python": py,
        "permissions": perm,
        "dependencies": deps,
        "docker": docker,
        "git": git,
    }

    print(json.dumps(summary, indent=2, ensure_ascii=False))

    # Çıkış kodu: kritik hatalar varsa 1
    critical_fail = False
    if not py["ok"]:
        critical_fail = True
    if any(v is not True for k, v in deps.items()):
        critical_fail = True
    if not (docker["compose_v2"] or docker["compose_v1"]):
        # Compose yoksa kritik say
        critical_fail = True

    sys.exit(1 if critical_fail else 0)


if __name__ == "__main__":
    main()


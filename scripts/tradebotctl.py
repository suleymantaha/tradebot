#!/usr/bin/env python3
"""
TradeBot Dağıtım Yardımcı CLI

Komutlar:
  - manifest: Proje dosyalarının SHA-256 manifestini üretir
  - verify:   Mevcut dizini manifest ile karşılaştırır
  - package:  Manifesti gömülü şekilde .tar.gz paket üretir
  - update:   Paket veya kaynak dizinden eksik/bozuk dosyaları kopyalar
  - repair:   update ile aynı davranır (alias)

Notlar:
  - Varsayılan hariç tutulacak dosya/desenleri `.manifestignore` ile
    özelleştirilebilir.
  - Kritik dosyalar (örn. `.env`) varsayılan olarak hariç tutulur.
"""

from __future__ import annotations

import argparse
import fnmatch
import hashlib
import json
import os
import shutil
import sys
import tarfile
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Set, Tuple


DEFAULT_IGNORE_PATTERNS: List[str] = [
    # VCS ve meta
    ".git/",
    ".gitignore",
    ".gitattributes",
    ".DS_Store",
    "*.log",
    "logs/",
    "tradebot_errors.log",
    "tradebot.log",
    # Ortam ve derleme çıktıları
    "venv/",
    "env/",
    "node_modules/",
    "frontend/node_modules/",
    "frontend/dist/",
    "dist/",
    "build/",
    "__pycache__/",
    "*.pyc",
    "*.pyo",
    "*.pyd",
    # Çalışma zamanı verileri
    ".env",
    "*.db",
    "dump.rdb",
    "celerybeat-schedule*",
    "cache/data/",
    # Docker runtime
    "*.pid",
]


def read_ignore_patterns(project_root: Path) -> Tuple[List[str], bool]:
    """`.manifestignore` dosyasını okur; yoksa varsayılan desenleri döndürür.

    Returns: (patterns, is_default)
    """
    ignore_file = project_root / ".manifestignore"
    if ignore_file.exists():
        patterns: List[str] = []
        for line in ignore_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            patterns.append(line)
        return patterns, False
    return DEFAULT_IGNORE_PATTERNS, True


def path_matches_any_pattern(rel_path: str, patterns: Iterable[str]) -> bool:
    """`rel_path` verilen `patterns` ile eşleşiyorsa True.

    Basit fnmatch tabanlı eşleştirme; dizinler için trailing slash deseni
    kullanımı ("dir/") önerilir.
    """
    # Normalleştir: Windows uyumu için forward slash kullan
    rel_path_norm = rel_path.replace(os.sep, "/")

    for pat in patterns:
        # Dizine özel: "dir/" pattern'i hem "dir/" hem altını kapsar
        if pat.endswith("/"):
            # "dir/" -> "dir/*" eşlemesine genişlet
            dir_pat = pat + "*"
            if rel_path_norm == pat[:-1] or rel_path_norm.startswith(pat):
                return True
            if fnmatch.fnmatch(rel_path_norm + "/", pat) or fnmatch.fnmatch(rel_path_norm, dir_pat):
                return True
        else:
            if fnmatch.fnmatch(rel_path_norm, pat):
                return True
    return False


def iter_project_files(project_root: Path, patterns: List[str]) -> Iterable[Path]:
    """Ignore desenlerini uygulayarak proje içindeki dosyaları iter eder."""
    for root, dirs, files in os.walk(project_root):
        root_path = Path(root)
        # Dizinleri yerinde filtrele (os.walk pruning)
        pruned_dirs: List[str] = []
        for d in list(dirs):
            rel_dir = (root_path / d).relative_to(project_root).as_posix() + "/"
            if path_matches_any_pattern(rel_dir, patterns):
                pruned_dirs.append(d)
        for d in pruned_dirs:
            dirs.remove(d)

        for f in files:
            rel_file = (root_path / f).relative_to(project_root).as_posix()
            if path_matches_any_pattern(rel_file, patterns):
                continue
            yield root_path / f


def sha256_file(file_path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with file_path.open("rb") as rf:
        while True:
            chunk = rf.read(chunk_size)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def detect_git_commit(project_root: Path) -> str:
    try:
        import subprocess

        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=project_root,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return "unknown"


def build_manifest(project_root: Path, patterns: List[str]) -> Dict[str, object]:
    files: Dict[str, Dict[str, object]] = {}
    for file_path in iter_project_files(project_root, patterns):
        stat = file_path.stat()
        rel = file_path.relative_to(project_root).as_posix()
        files[rel] = {
            "sha256": sha256_file(file_path),
            "size": stat.st_size,
            "mtime": int(stat.st_mtime),
        }

    manifest = {
        "name": "tradebot",
        "version": detect_git_commit(project_root),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "root": str(project_root),
        "ignore": patterns,
        "files": files,
    }
    return manifest


def write_manifest(manifest: Dict[str, object], output_path: Path) -> None:
    output_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def cmd_manifest(args: argparse.Namespace) -> int:
    project_root = Path(args.root).resolve()
    patterns, _ = read_ignore_patterns(project_root)
    manifest = build_manifest(project_root, patterns)
    output = Path(args.output).resolve() if args.output else project_root / "tradebot.manifest.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    write_manifest(manifest, output)
    print(f"✅ Manifest yazıldı: {output}")
    print(f"🧮 Dosya sayısı: {len(manifest['files'])}")
    return 0


def load_manifest(path: Path) -> Dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def cmd_verify(args: argparse.Namespace) -> int:
    project_root = Path(args.root).resolve()
    manifest_path = Path(args.manifest).resolve()
    manifest = load_manifest(manifest_path)
    patterns = manifest.get("ignore") or []

    # Mevcut dosyaları yeniden hash'le
    current = build_manifest(project_root, patterns)
    expected_files: Dict[str, Dict[str, object]] = manifest["files"]  # type: ignore[index]
    current_files: Dict[str, Dict[str, object]] = current["files"]  # type: ignore[index]

    missing: List[str] = [p for p in expected_files.keys() if p not in current_files]
    changed: List[str] = [
        p for p, meta in expected_files.items() if p in current_files and meta["sha256"] != current_files[p]["sha256"]
    ]
    extra: List[str] = [p for p in current_files.keys() if p not in expected_files]

    if args.json:
        print(
            json.dumps(
                {
                    "missing": missing,
                    "changed": changed,
                    "extra": extra,
                    "counts": {
                        "missing": len(missing),
                        "changed": len(changed),
                        "extra": len(extra),
                    },
                },
                indent=2,
                ensure_ascii=False,
            )
        )
    else:
        print(f"🔎 Doğrulama: {manifest_path}")
        print(f" - Eksik:   {len(missing)}")
        print(f" - Değişik: {len(changed)}")
        print(f" - Fazla:   {len(extra)}")
        if missing:
            print("  Eksik dosyalar:")
            for p in missing[:50]:
                print(f"   • {p}")
            if len(missing) > 50:
                print(f"   … {len(missing) - 50} daha")
        if changed:
            print("  Değişen dosyalar:")
            for p in changed[:50]:
                print(f"   • {p}")
            if len(changed) > 50:
                print(f"   … {len(changed) - 50} daha")

    return 0 if not missing and not changed else 1


def create_package(project_root: Path, output_dir: Path, patterns: List[str]) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    pkg_name = f"tradebot-{timestamp}.tar.gz"
    pkg_path = output_dir / pkg_name

    manifest = build_manifest(project_root, patterns)

    with tarfile.open(pkg_path, "w:gz") as tf:
        # Dosyalar
        for file_path in iter_project_files(project_root, patterns):
            arcname = file_path.relative_to(project_root).as_posix()
            tf.add(file_path, arcname=arcname, recursive=False)

        # Manifesti paket köküne ekle
        manifest_bytes = json.dumps(manifest, indent=2, ensure_ascii=False).encode("utf-8")
        info = tarfile.TarInfo(name="tradebot.manifest.json")
        info.size = len(manifest_bytes)
        info.mtime = int(datetime.now(timezone.utc).timestamp())
        tf.addfile(info, fileobj=_BytesIO(manifest_bytes))

        # `.manifestignore` varsa ekle (belge amaçlı)
        ign_file = project_root / ".manifestignore"
        if ign_file.exists():
            tf.add(ign_file, arcname=".manifestignore", recursive=False)

    return pkg_path


class _BytesIO:
    # Minimal bytes buffer; tarfile dosyaobjesi için yeterli
    def __init__(self, data: bytes):
        self._data = data
        self._pos = 0

    def read(self, n: int = -1) -> bytes:
        if n < 0:
            n = len(self._data) - self._pos
        start = self._pos
        end = min(len(self._data), self._pos + n)
        self._pos = end
        return self._data[start:end]


def cmd_package(args: argparse.Namespace) -> int:
    project_root = Path(args.root).resolve()
    output_dir = Path(args.output).resolve() if args.output else (project_root / "dist")
    patterns, _ = read_ignore_patterns(project_root)
    pkg_path = create_package(project_root, output_dir, patterns)
    print(f"📦 Paket oluşturuldu: {pkg_path}")
    return 0


def extract_package(package_path: Path, temp_dir: Path) -> Path:
    with tarfile.open(package_path, "r:gz") as tf:
        tf.extractall(temp_dir)
    return temp_dir


def copy_file(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def cmd_update(args: argparse.Namespace) -> int:
    project_root = Path(args.root).resolve()
    dry_run = bool(args.dry_run)

    if args.package:
        package_path = Path(args.package).resolve()
        if not package_path.exists():
            print(f"❌ Paket bulunamadı: {package_path}")
            return 2
        with tempfile.TemporaryDirectory(prefix="tradebot_pkg_") as tmpd:
            tmp_dir = Path(tmpd)
            extract_package(package_path, tmp_dir)
            manifest_path = tmp_dir / "tradebot.manifest.json"
            if not manifest_path.exists():
                print("❌ Pakette manifest yok: tradebot.manifest.json")
                return 2
            manifest = load_manifest(manifest_path)
            source_root = tmp_dir
            return _sync_from_source(project_root, source_root, manifest, dry_run)

    if args.source and args.manifest:
        source_root = Path(args.source).resolve()
        manifest_path = Path(args.manifest).resolve()
        if not source_root.exists() or not manifest_path.exists():
            print("❌ Kaynak dizin veya manifest bulunamadı")
            return 2
        manifest = load_manifest(manifest_path)
        return _sync_from_source(project_root, source_root, manifest, dry_run)

    print("❌ Geçersiz kullanım. --package veya --source + --manifest verin.")
    return 2


def _sync_from_source(project_root: Path, source_root: Path, manifest: Dict[str, object], dry_run: bool) -> int:
    expected_files: Dict[str, Dict[str, object]] = manifest["files"]  # type: ignore[index]

    actions: List[Tuple[str, Path, Path]] = []  # (reason, src, dst)
    for rel, meta in expected_files.items():
        src = source_root / rel
        dst = project_root / rel
        src_hash = meta.get("sha256")  # type: ignore[assignment]

        if not dst.exists():
            actions.append(("missing", src, dst))
            continue

        try:
            current_hash = sha256_file(dst)
        except Exception:
            actions.append(("unreadable", src, dst))
            continue

        if current_hash != src_hash:
            actions.append(("changed", src, dst))

    if not actions:
        print("✅ Tüm dosyalar güncel görünüyor. Yapılacak işlem yok.")
        return 0

    print(f"🛠️ Senkronize edilecek dosyalar: {len(actions)}")
    for reason, src, dst in actions:
        print(f" - {reason:8s} -> {dst.relative_to(project_root).as_posix()}")

    if dry_run:
        print("🧪 Dry-run: Dosyalar kopyalanmadı.")
        return 0

    copied = 0
    for _, src, dst in actions:
        if not src.exists():
            print(f"⚠️ Kaynakta yok, atlanıyor: {src}")
            continue
        copy_file(src, dst)
        copied += 1

    print(f"✅ Tamamlandı. Kopyalanan dosya: {copied}")
    return 0


def cmd_print_ignore(args: argparse.Namespace) -> int:
    project_root = Path(args.root).resolve()
    patterns, is_default = read_ignore_patterns(project_root)
    header = "(varsayılan)" if is_default else "(.manifestignore)"
    print(f"🎯 Hariç tutulan desenler {header}:")
    for pat in patterns:
        print(f" - {pat}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="TradeBot paketleme ve güncelleme aracı")
    parser.add_argument("--root", default=str(Path.cwd()), help="Proje kök dizini (varsayılan: çalışma dizini)")

    sub = parser.add_subparsers(dest="command", required=True)

    p_manifest = sub.add_parser("manifest", help="Manifest üret")
    p_manifest.add_argument("--output", default=None, help="Manifest çıkış yolu (vars: tradebot.manifest.json)")
    p_manifest.set_defaults(func=cmd_manifest)

    p_verify = sub.add_parser("verify", help="Manifest ile doğrula")
    p_verify.add_argument("--manifest", required=True, help="Manifest dosyası")
    p_verify.add_argument("--json", action="store_true", help="JSON çıktı üret")
    p_verify.set_defaults(func=cmd_verify)

    p_package = sub.add_parser("package", help="Paket oluştur (.tar.gz)")
    p_package.add_argument("--output", default=None, help="Çıkış dizini (vars: ./dist)")
    p_package.set_defaults(func=cmd_package)

    p_update = sub.add_parser("update", help="Eksik/bozuk dosyaları senkronize et")
    grp = p_update.add_mutually_exclusive_group(required=True)
    grp.add_argument("--package", help="Girdi paketi (.tar.gz)")
    # Alternatif: kaynak dizin + manifest
    p_update.add_argument("--source", help="Kaynak dizin (paketsiz kullanım)")
    p_update.add_argument("--manifest", help="Kaynak manifest yolu (paketsiz kullanım)")
    p_update.add_argument("--dry-run", action="store_true", help="Kopyalamadan önce sadece göster")
    p_update.set_defaults(func=cmd_update)

    p_repair = sub.add_parser("repair", help="Eksik/bozuk dosyaları onar (update alias)")
    p_repair.add_argument("--package", help="Girdi paketi (.tar.gz)")
    p_repair.add_argument("--source", help="Kaynak dizin (paketsiz kullanım)")
    p_repair.add_argument("--manifest", help="Kaynak manifest (paketsiz kullanım)")
    p_repair.add_argument("--dry-run", action="store_true", help="Kopyalamadan önce sadece göster")
    p_repair.set_defaults(func=cmd_update)

    p_ign = sub.add_parser("print-ignore", help="Hariç desenlerini yazdır")
    p_ign.set_defaults(func=cmd_print_ignore)

    return parser


def main(argv: List[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return int(args.func(args))  # type: ignore[misc]


if __name__ == "__main__":
    sys.exit(main())



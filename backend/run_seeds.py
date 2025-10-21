#!/usr/bin/env python3
"""
Script to run all seed files in the seeds directory.
Usage: python run_seeds.py
"""

import os
import sys
import importlib.util
from pathlib import Path

def run_seed_file(seed_file_path):
    """Run a single seed file."""
    try:
        # Load the module from file path
        spec = importlib.util.spec_from_file_location("seed_module", seed_file_path)
        if spec is None:
            print(f"Could not load spec for {seed_file_path}")
            return False

        module = importlib.util.module_from_spec(spec)

        # Execute the module
        spec.loader.exec_module(module)

        print(f"✅ Successfully ran {seed_file_path.name}")
        return True

    except Exception as e:
        print(f"❌ Error running {seed_file_path.name}: {str(e)}")
        return False

def main():
    """Run all seed files."""
    # Get the backend directory
    backend_dir = Path(__file__).parent
    seeds_dir = backend_dir / "seeds"

    if not seeds_dir.exists():
        print(f"❌ Seeds directory not found: {seeds_dir}")
        sys.exit(1)

    # Find all Python files in seeds directory
    seed_files = []
    for file_path in seeds_dir.iterdir():
        if file_path.is_file() and file_path.suffix == ".py" and not file_path.name.startswith("__"):
            seed_files.append(file_path)

    if not seed_files:
        print("❌ No seed files found in seeds directory")
        sys.exit(1)

    print(f"🔄 Found {len(seed_files)} seed files to run:")
    for seed_file in seed_files:
        print(f"  • {seed_file.name}")

    print("\n🚀 Starting seed execution...")

    # Run each seed file
    success_count = 0
    for seed_file in sorted(seed_files):
        print(f"\n📄 Running {seed_file.name}...")
        if run_seed_file(seed_file):
            success_count += 1

    print("🎉 Seed execution completed!" )
    print(f"✅ Successfully ran {success_count}/{len(seed_files)} seed files")

    if success_count == len(seed_files):
        print("🎊 All seeds completed successfully!")
        sys.exit(0)
    else:
        print(f"⚠️  {len(seed_files) - success_count} seed files failed")
        sys.exit(1)

if __name__ == "__main__":
    main()

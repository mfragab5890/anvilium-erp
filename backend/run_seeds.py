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

        # Try to call main function if it exists
        if hasattr(module, 'run_all'):
            print(f"🔄 Calling run_all() from {seed_file_path.name}...")
            with module.app.app_context():
                result = module.run_all()
                print(f"✅ {seed_file_path.name} completed: {result}")
        elif hasattr(module, 'main'):
            print(f"🔄 Calling main() from {seed_file_path.name}...")
            try:
                # Ensure app context is available for this module
                if hasattr(module, 'app'):
                    with module.app.app_context():
                        result = module.main()
                        print(f"✅ {seed_file_path.name} completed: {result}")
                else:
                    # Fallback: try to call without context (might already be in context)
                    result = module.main()
                    print(f"✅ {seed_file_path.name} completed: {result}")
            except TypeError as e:
                if "missing" in str(e) and "argument" in str(e):
                    # Handle seed files that need arguments
                    if "seed_employees_from_excel" in seed_file_path.name:
                        # Pass the sample Excel file path
                        xlsx_path = seed_file_path.parent / "sample_Labor List_2025.XLSX"
                        if xlsx_path.exists():
                            print(f"🔄 Calling main() with Excel file: {xlsx_path}")
                            if hasattr(module, 'app'):
                                with module.app.app_context():
                                    result = module.main(str(xlsx_path))
                            else:
                                result = module.main(str(xlsx_path))
                            print(f"✅ {seed_file_path.name} completed: {result}")
                        else:
                            print(f"⚠️  Excel file not found: {xlsx_path}")
                            return False
                    else:
                        print(f"⚠️  {seed_file_path.name} requires arguments, skipping...")
                        return False
                else:
                    raise
        else:
            print(f"⚠️  No main function found in {seed_file_path.name}")
            return False

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
    failed_seeds = []
    for seed_file in sorted(seed_files):
        print(f"\n📄 Running {seed_file.name}...")
        try:
            if run_seed_file(seed_file):
                success_count += 1
            else:
                failed_seeds.append(seed_file.name)
        except Exception as e:
            print(f"❌ Exception running {seed_file.name}: {e}")
            failed_seeds.append(seed_file.name)

    print("🎉 Seed execution completed!" )
    print(f"✅ Successfully ran {success_count}/{len(seed_files)} seed files")

    if failed_seeds:
        print(f"⚠️  Failed seeds: {', '.join(failed_seeds)}")
        print("   Continuing deployment... (some seeds may have failed but app will still start)")

    # Always exit with success so deployment continues
    print("🚀 Deployment continuing...")
    sys.exit(0)

if __name__ == "__main__":
    main()

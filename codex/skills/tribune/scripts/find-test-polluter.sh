#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf '%s\n' 'Usage: find-test-polluter.sh --check PATH --list COMMAND --run COMMAND [--dry-run]'
  printf '%s\n' 'LIST COMMAND must print one test file path per line.'
  printf '%s\n' 'COMMAND must include {} where the shell-quoted test file path should be inserted.'
  printf '%s\n' "Example: find-test-polluter.sh --check .next --list 'fd -g -t f \"*.test.ts\" src' --run 'pnpm run test -- {}'"
}

CHECK_PATH=''
LIST_COMMAND=''
RUN_TEMPLATE=''
DRY_RUN='0'

while [ "$#" -gt 0 ]; do
  case "$1" in
    --check)
      CHECK_PATH="${2:-}"
      shift 2
      ;;
    --list)
      LIST_COMMAND="${2:-}"
      shift 2
      ;;
    --run)
      RUN_TEMPLATE="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN='1'
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      usage
      exit 2
      ;;
  esac
done

if [ -z "$CHECK_PATH" ] || [ -z "$LIST_COMMAND" ] || [ -z "$RUN_TEMPLATE" ]; then
  usage
  exit 2
fi

case "$RUN_TEMPLATE" in
  *'{}'*)
    ;;
  *)
    printf '%s\n' 'Error: --run command must include {}'
    exit 2
    ;;
esac

TEST_FILES=()
while IFS= read -r test_file; do
  if [ -z "$test_file" ]; then
    continue
  fi
  TEST_FILES+=("$test_file")
done < <(bash -lc "$LIST_COMMAND")

if [ "${#TEST_FILES[@]}" -eq 0 ]; then
  printf '%s\n' 'List command returned no test files'
  exit 1
fi

printf '%s\n' "Checking for pollution path: $CHECK_PATH"
printf '%s\n' "Matched test files: ${#TEST_FILES[@]}"

for test_file in "${TEST_FILES[@]}"; do
  if [ -e "$CHECK_PATH" ]; then
    printf '%s\n' "Pollution already exists before running: $test_file"
    exit 1
  fi

  quoted_test_file=$(printf '%q' "$test_file")
  run_command="${RUN_TEMPLATE//\{\}/$quoted_test_file}"

  if [ "$DRY_RUN" = '1' ]; then
    printf '%s\n' "DRY RUN: $run_command"
    continue
  fi

  printf '%s\n' "Running: $run_command"
  if ! bash -lc "$run_command" >/dev/null 2>&1; then
    printf '%s\n' "Command failed but pollution check will still run: $test_file"
  fi

  if [ -e "$CHECK_PATH" ]; then
    printf '%s\n' 'Found polluting test'
    printf '%s\n' "Test: $test_file"
    printf '%s\n' "Created: $CHECK_PATH"
    exit 1
  fi
done

printf '%s\n' 'No polluting test found'

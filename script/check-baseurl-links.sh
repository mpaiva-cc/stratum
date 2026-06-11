#!/usr/bin/env bash
#
# check-baseurl-links.sh — guard against baseurl-unaware internal links.
#
# The site is served under a baseurl (/stratum). Jekyll does NOT rewrite
# hardcoded links, so a body link written as  href="/engineering/x.html"
# ships verbatim and 404s on the live site. Internal links MUST go through
# the relative_url filter:  href="{{ '/engineering/x.html' | relative_url }}"
#
# html-proofer can't catch this: _site/engineering/x.html exists whether or
# not the link carries the baseurl, so the link resolves locally either way.
# This source-level guard is the only thing that catches the regression.
#
# Exits non-zero and prints every offending line if any are found.
#
# What it flags:  href="/…" or src="/…"  (single leading slash, internal)
# What it ignores:
#   - {{ … }}           already routed through relative_url (correct)
#   - //…               protocol-relative / external
#   - &lt;…             entity-encoded markup inside doc/code examples
#   - _site/            build output
#
# Known gap: only scans .html. Markdown [](/path) links and fenced HTML
# examples are out of scope (the one fenced example in the repo is not served).

set -euo pipefail
cd "$(dirname "$0")/.."

hits="$(grep -rEn '(href|src)="/[^/{]' --include='*.html' . \
          --exclude-dir=_site --exclude-dir=vendor --exclude-dir=node_modules --exclude-dir=.git \
        | grep -vE '(href|src)="//' \
        | grep -vE '\{\{' \
        | grep -vE '&lt;' || true)"

if [[ -n "$hits" ]]; then
  echo "✗ baseurl-unaware internal links found (will 404 under the /stratum baseurl)."
  echo "  Fix: wrap the path in  {{ '/path' | relative_url }}"
  echo
  echo "$hits"
  echo
  echo "Total: $(printf '%s\n' "$hits" | wc -l | tr -d ' ') offending line(s)."
  exit 1
fi

echo "✓ No baseurl-unaware internal links. All internal href/src use relative_url."

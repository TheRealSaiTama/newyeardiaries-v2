#!/bin/bash
# nyd-cache-diag.sh
# Purpose: find WHO is serving the stale WP-Rocket-generated cached HTML after
#          wp-rocket was deleted, then (optionally) activate WP Super Cache with
#          a raised PHP memory limit.
# Mostly READ-ONLY. Writes: backup of advanced-cache.php, WP Super Cache activation.
# Run from cPanel Terminal (jailshell).

set -u

WP_DIR="$HOME/public_html"
PFX="[cache-diag]"

say() { echo "$PFX $*"; }
ok()  { echo "$PFX PASS: $*"; }
bad() { echo "$PFX FAIL: $*"; }

cd "$WP_DIR" || { echo "$PFX FATAL: cannot cd $WP_DIR"; exit 1; }
[ -f wp-config.php ] || { echo "$PFX FATAL: wp-config.php missing"; exit 1; }

TS=$(date +%Y%m%d-%H%M%S)
BAK="$HOME/nyd-cache-diag-$TS"
mkdir -p "$BAK"
[ -f wp-content/advanced-cache.php ] && cp -p wp-content/advanced-cache.php "$BAK/advanced-cache.before.php"
[ -f .htaccess ] && cp -p .htaccess "$BAK/htaccess.before"
say "backup dir: $BAK"

# ---------------------------------------------------------------- 1. drop-in owner
echo ""
echo "$PFX ============ 1. advanced-cache.php (who owns it?) ==========="
if [ -f wp-content/advanced-cache.php ]; then
  echo "size: $(wc -c < wp-content/advanced-cache.php) bytes"
  echo "--- content (first 45 lines) ---"
  head -45 wp-content/advanced-cache.php
  echo "--- end ---"
  echo ""
  echo "--- signature grep ---"
  grep -oiE 'rocket|w3tc|sw-?minify|fastest|sw Supercache|litespeed|super-?cache|cache-?enabler|elementor|statik|simply-?static' wp-content/advanced-cache.php | sort | uniq -c
else
  say "advanced-cache.php DOES NOT EXIST"
fi

# ---------------------------------------------------------------- 2. cache dirs
echo ""
echo "$PFX ============ 2. wp-content/cache/ contents ==========="
ls -la wp-content/cache/ 2>/dev/null || say "(no wp-content/cache dir)"

echo ""
echo "$PFX --- each cache subdir, size + file count ---"
for d in wp-content/cache/*/; do
  [ -d "$d" ] || continue
  echo "  $d  files=$(find "$d" -type f 2>/dev/null | wc -l)  size=$(du -sh "$d" 2>/dev/null | cut -f1)"
done

# ---------------------------------------------------------------- 3. hunt the cached HTML
echo ""
echo "$PFX ============ 3. where is the WP-Rocket cached HTML? ==========="
echo "--- grep for the WP Rocket cache signature ---"
for scope in "wp-content/cache" "wp-content/mu-plugins" "wp-content/plugins" "."; do
  echo "  [scope: $scope]"
  grep -rl --binary-files=without-match 'Performance optimized by WP Rocket' "$scope" 2>/dev/null \
    --exclude-dir=uploads --exclude-dir=upgrade-temp-backup --exclude-dir=cache | head -8
done
echo ""
echo "--- any file containing 'cached@' outside uploads ---"
grep -rl --binary-files=without-match 'cached@' wp-content/cache wp-content/mu-plugins . 2>/dev/null \
  --exclude-dir=uploads --exclude-dir=upgrade-temp-backup | head -8

# ---------------------------------------------------------------- 4. docroot listing
echo ""
echo "$PFX ============ 4. docroot top level ==========="
ls -la . 2>/dev/null | head -45

# ---------------------------------------------------------------- 5. full plugin list
echo ""
echo "$PFX ============ 5. full plugin list ==========="
wp --path="$WP_DIR" --allow-root plugin list --format=csv --fields=name,status,version,update 2>/dev/null

# ---------------------------------------------------------------- 6. drop-ins
echo ""
echo "$PFX ============ 6. wp-content drop-in files ==========="
ls -la wp-content/*.php 2>/dev/null | head -20

# ---------------------------------------------------------------- 7. htaccess
echo ""
echo "$PFX ============ 7. .htaccess (full) ==========="
if [ -f .htaccess ]; then cat .htaccess; else say "(no .htaccess)"; fi

# ---------------------------------------------------------------- 8. memory + disk
echo ""
echo "$PFX ============ 8. memory / disk ==========="
php -r 'echo "CLI memory_limit: ".ini_get("memory_limit")."  peak: ".ini_get("memory_limit")."\n";' 2>/dev/null
df -h "$HOME" 2>/dev/null
echo "--- biggest dirs in home ---"
du -sh "$HOME"/* 2>/dev/null | sort -rh | head -12

# ---------------------------------------------------------------- 9. activate WP Super Cache
echo ""
echo "$PFX ============ 9. activate WP Super Cache (raised memory) ==========="
export WP_CLI_PHP_ARGS="-d memory_limit=768M"
if wp --path="$WP_DIR" --allow-root plugin activate wp-super-cache 2>&1 | tail -4; then
  :
fi
sleep 2
ST=$(wp --path="$WP_DIR" --allow-root plugin get wp-super-cache --field=status 2>/dev/null)
if [ "$ST" = "active" ]; then
  ok "WP Super Cache is ACTIVE"
else
  bad "WP Super Cache status = '$ST'"
  echo "$PFX retrying with --skip-plugins --skip-themes ..."
  wp --path="$WP_DIR" --allow-root --skip-plugins --skip-themes plugin activate wp-super-cache 2>&1 | tail -4
  sleep 2
  ST2=$(wp --path="$WP_DIR" --allow-root plugin get wp-super-cache --field=status 2>/dev/null)
  if [ "$ST2" = "active" ]; then
    ok "WP Super Cache ACTIVE on retry (skip-plugins)"
  else
    bad "WP Super Cache still = '$ST2'"
  fi
fi

# ---------------------------------------------------------------- 10. verify
echo ""
echo "$PFX ============ 10. verify ==========="
wp --path="$WP_DIR" --allow-root plugin list --format=csv --fields=name,status,version 2>/dev/null | grep -Ei 'super-cache|rocket|minify' || true

echo "$PFX --- drop-in after activation ---"
if [ -f wp-content/advanced-cache.php ]; then
  echo "  size=$(wc -c < wp-content/advanced-cache.php) bytes"
  grep -oiE 'rocket|w3tc|sw-?minify|fastest|super-?cache|cache-?enabler' wp-content/advanced-cache.php | sort | uniq -c
else
  say "  advanced-cache.php absent"
fi

echo "$PFX --- .htaccess WP core block after activation ---"
awk '
  /# BEGIN WordPress/,/# END WordPress/ { print }
' .htaccess 2>/dev/null

echo "$PFX --- external check ---"
for u in "/" "/shop/" "/cart/" "/wp-login.php"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://newyeardiaries.in$u")
  echo "  $u -> $code"
done
echo "$PFX --- rocket markers on homepage now ---"
echo "  data-rocket-src count: $(curl -sL https://newyeardiaries.in/ | grep -c 'data-rocket-src')"
echo "  cached@ signature    : $(curl -sL https://newyeardiaries.in/ | grep -o 'cached@[0-9]*' | head -1)"
echo "  malware marker       : $(curl -sL https://newyeardiaries.in/ | grep -c 'xlxjMiihfcPDc26Vy4U58h+CAeZP')"

echo ""
echo "$PFX ============ DONE ==========="
echo "$PFX backups in: $BAK"

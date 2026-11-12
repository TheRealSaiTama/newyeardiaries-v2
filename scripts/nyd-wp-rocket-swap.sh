#!/bin/bash
# nyd-wp-rocket-swap.sh
# Purpose:
#   1. Assert we can actually reach the WordPress DB (never trust an empty result).
#   2. Deactivate + DELETE WP Rocket (unlicensed, 3.12.5.1, vulnerable: CVE-2026-97075/97076/5934).
#   3. Purge WP Rocket's cache dir + drop-in (advanced-cache.php) IF it belongs to WP Rocket.
#   4. Install + activate WP Super Cache (free, Apache/mod_rewrite native) as the replacement.
#   5. Verify: .htaccess core rewrite pairing intact, plugin state, site reachable, no rocket markers.
#
# Read-only for the DB. Writes: plugin files, .htaccess (WP Super Cache), wp-content/cache.
# Run from cPanel Terminal (jailshell). Self-verifying: prints PASS/FAIL for every check.

set -u

WP_DIR="$HOME/public_html"
PFX="[rocket-swap]"
FAILS=0

say() { echo "$PFX $*"; }
ok()  { echo "$PFX PASS: $*"; }
bad() { echo "$PFX FAIL: $*"; FAILS=$((FAILS+1)); }

echo "$PFX ============================================"
echo "$PFX WP Rocket -> WP Super Cache swap"
echo "$PFX ============================================"

# ---------------------------------------------------------------- 0. paths
if [ ! -d "$WP_DIR" ]; then
  echo "$PFX FATAL: $WP_DIR not found"
  exit 1
fi
cd "$WP_DIR" || { echo "$PFX FATAL: cannot cd $WP_DIR"; exit 1; }
if [ ! -f wp-config.php ]; then
  echo "$PFX FATAL: wp-config.php missing in $WP_DIR"
  exit 1
fi
say "docroot: $WP_DIR"

# ---------------------------------------------------------------- 1. DB creds
# Regex must include the closing quote, otherwise the value comes back empty.
getcfg() {
  local key="${1:-}" raw=""
  raw=$(grep -oE "['\"]${key}['\"],[[:space:]]*['\"][^'\"]*['\"]" wp-config.php 2>/dev/null | head -1)
  raw="${raw##*, }"
  raw="${raw#\'}"; raw="${raw%\'}"
  raw="${raw#\"}"; raw="${raw%\"}"
  printf '%s' "$raw"
}

DB_NAME=$(getcfg DB_NAME)
DB_USER=$(getcfg DB_USER)
DB_PASS=$(getcfg DB_PASSWORD)
DB_HOST=$(getcfg DB_HOST)

if [ -z "$DB_NAME" ]; then
  echo "$PFX FATAL: DB_NAME parsed empty. wp-config.php parse failed. ABORT."
  exit 1
fi
say "DB_NAME=$DB_NAME  DB_USER=$DB_USER  DB_HOST=$DB_HOST"

# ---------------------------------------------------------------- 2. DB connect ASSERT
CNF="$HOME/.nydmysql.$$"
umask 077
{
  echo "[client]"
  echo "host=$DB_HOST"
  echo "user=$DB_USER"
  echo "password=$DB_PASS"
} > "$CNF"
chmod 600 "$CNF"

GOT=$(mysql --defaults-extra-file="$CNF" -N -B "$DB_NAME" -e "SELECT DATABASE();" 2>&1)
if [ "$GOT" != "$DB_NAME" ]; then
  echo "$PFX FATAL: DB connect failed. mysql said: $GOT"
  rm -f "$CNF"
  exit 1
fi
ok "DB connection verified (SELECT DATABASE() = $GOT)"
rm -f "$CNF"

# ---------------------------------------------------------------- 3. WP-CLI
if ! command -v wp >/dev/null 2>&1; then
  echo "$PFX FATAL: wp-cli not found in PATH. ABORT."
  exit 1
fi
WPP="wp --path=$WP_DIR --allow-root"
say "wp-cli: $(command -v wp)"

# ---------------------------------------------------------------- 4. backup
TS=$(date +%Y%m%d-%H%M%S)
BAK="$HOME/nyd-rocket-swap-$TS"
mkdir -p "$BAK" || { echo "$PFX FATAL: cannot create $BAK"; exit 1; }
if [ -f .htaccess ]; then
  cp -p .htaccess "$BAK/htaccess.before"
  ok "backed up .htaccess -> $BAK/htaccess.before"
fi
if [ -f wp-config.php ]; then
  cp -p wp-config.php "$BAK/wp-config.before"
  ok "backed up wp-config.php"
fi
say "backup dir: $BAK"

# ---------------------------------------------------------------- 5. deactivate + delete WP Rocket
if $WPP plugin is-installed wp-rocket 2>/dev/null; then
  say "WP Rocket is installed. Deactivating..."
  $WPP plugin deactivate wp-rocket 2>&1 | tail -3
  sleep 2
  ST=$($WPP plugin get wp-rocket --field=status 2>/dev/null)
  if [ "$ST" = "inactive" ] || [ "$ST" = "active" ]; then
    ok "WP Rocket status now: $ST"
  else
    bad "WP Rocket status unexpected: '$ST' (plugin may be missing from DB)"
  fi

  say "Deleting WP Rocket files..."
  $WPP plugin delete wp-rocket 2>&1 | tail -3
  if [ ! -d wp-content/plugins/wp-rocket ]; then
    ok "wp-content/plugins/wp-rocket removed"
  else
    bad "wp-content/plugins/wp-rocket STILL EXISTS"
  fi
else
  ok "WP Rocket already not installed"
fi

# ---------------------------------------------------------------- 6. drop-in + cache purge
if [ -f wp-content/advanced-cache.php ]; then
  if grep -qiE 'rocket' wp-content/advanced-cache.php 2>/dev/null; then
    rm -f wp-content/advanced-cache.php
    ok "removed WP Rocket drop-in wp-content/advanced-cache.php"
  else
    ok "advanced-cache.php does NOT belong to WP Rocket, left in place"
  fi
else
  say "no advanced-cache.php present"
fi

if [ -d wp-content/cache/wp-rocket ]; then
  rm -rf wp-content/cache/wp-rocket
  if [ ! -d wp-content/cache/wp-rocket ]; then
    ok "purged wp-content/cache/wp-rocket"
  else
    bad "wp-content/cache/wp-rocket still present"
  fi
else
  say "no wp-content/cache/wp-rocket present"
fi

# ---------------------------------------------------------------- 7. install + activate WP Super Cache
if $WPP plugin is-installed wp-super-cache 2>/dev/null; then
  say "WP Super Cache already installed, activating..."
  $WPP plugin activate wp-super-cache 2>&1 | tail -3
else
  say "Installing WP Super Cache..."
  $WPP plugin install wp-super-cache --activate 2>&1 | tail -5
fi

sleep 2
SC_STATUS=$($WPP plugin get wp-super-cache --field=status 2>/dev/null)
if [ "$SC_STATUS" = "active" ]; then
  ok "WP Super Cache is ACTIVE"
else
  bad "WP Super Cache status = '$SC_STATUS' (expected 'active')"
fi

# try to turn caching on (WP Super Cache ships a WP-CLI command)
if $WPP super-cache enable >/dev/null 2>&1; then
  ok "WP Super Cache: caching enabled via CLI"
else
  say "NOTE: 'wp super-cache enable' not available; enable caching from the plugin Settings screen"
fi

if grep -q "WP_CACHE" wp-config.php 2>/dev/null; then
  ok "WP_CACHE is defined in wp-config.php"
else
  bad "WP_CACHE missing in wp-config.php (caching will not work until added)"
fi

# ---------------------------------------------------------------- 8. .htaccess integrity
if [ -f .htaccess ]; then
  if grep -qE 'RewriteRule[[:space:]]+\.[[:space:]]+/index\.php[[:space:]]+\[L\]' .htaccess; then
    ok ".htaccess still contains the WordPress core rewrite rule"
  else
    bad ".htaccess core rewrite rule MISSING"
  fi

  # the RewriteCond REQUEST_FILENAME !-f / !-d must sit directly above it
  awk '
    /RewriteCond[[:space:]]+%\{REQUEST_FILENAME\}[[:space:]]+!-f[[:space:]]+\/[[:space:]]+!-d/ { c=NR }
    /RewriteRule[[:space:]]+\.[[:space:]]+\/index\.php[[:space:]]+\[L\]/ {
      if (c>0 && NR==c+1) { print "PAIR_OK line " NR; found=1 }
      else { print "PAIR_BAD cond_line=" c " rule_line=" NR; found=1 }
    }
    END { if (!found) print "PAIR_NONE" }
  ' .htaccess
else
  bad ".htaccess missing"
fi

# ---------------------------------------------------------------- 9. plugin state table
echo "$PFX --- plugin state ---"
$WPP plugin list --format=csv --fields=name,status,version 2>/dev/null | grep -Ei 'wp-rocket|wp-super-cache|sw-minify|advanced-cache' || echo "(no matching plugins listed)"

# ---------------------------------------------------------------- 10. external verification
echo "$PFX --- external verification (https://newyeardiaries.in) ---"
for u in "/" "/shop/" "/cart/" "/contact-us/" "/wp-login.php"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://newyeardiaries.in$u")
  if [ "$code" = "200" ] || [ "$code" = "301" ] || [ "$code" = "302" ]; then
    ok "$u -> $code"
  else
    bad "$u -> $code"
  fi
done

echo "$PFX --- rocket markers on homepage ---"
ROCKET_N=$(curl -sL https://newyeardiaries.in/ | grep -c 'data-rocket-src' || true)
if [ "$ROCKET_N" = "0" ]; then
  ok "0 data-rocket-src markers (WP Rocket no longer injecting)"
else
  bad "$ROCKET_N data-rocket-src markers still present"
fi

PAY_N=$(curl -sL https://newyeardiaries.in/ | grep -c 'xlxjMiihfcPDc26Vy4U58h+CAeZP' || true)
if [ "$PAY_N" = "0" ]; then
  ok "0 malware loader markers"
else
  bad "$PAY_N malware loader markers found"
fi

# ---------------------------------------------------------------- summary
echo "$PFX ============================================"
if [ "$FAILS" -eq 0 ]; then
  echo "$PFX RESULT: ALL CHECKS PASSED"
  echo "$PFX Backup of .htaccess + wp-config.php: $BAK"
  echo "$PFX ============================================"
  exit 0
else
  echo "$PFX RESULT: $FAILS CHECK(S) FAILED - see FAIL lines above"
  echo "$PFX Rollback copies in: $BAK"
  echo "$PFX ============================================"
  exit 1
fi

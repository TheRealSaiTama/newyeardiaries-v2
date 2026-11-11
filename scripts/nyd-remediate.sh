#!/bin/bash
# =============================================================================
#  NYD WordPress - full remediation script
#  Run in cPanel -> Terminal :  bash ~/nyd-remediate.sh
#
#  Does, in order:
#    0. Backup  (mysqldump + wp-content tar)   <- safety net, do not skip
#    1. Report  (what is there right now)
#    2. Remove malware files (mu-plugins, wp-helper-*, any marker-bearing file)
#    3. Clean the database (options, active_plugins, cron events, rogue users)
#    4. Harden  (XML-RPC, REST user enumeration, mu-plugins permissions)
#    5. Verify  (marker sweep, plugin list, users, final state)
#
#  Everything is logged. Anything it cannot do is reported, not hidden.
# =============================================================================

set -u
cd "$HOME/public_html" 2>/dev/null || cd /home1/newyee9c/public_html || { echo "cannot find public_html"; exit 1; }
ROOT=$(pwd)
STAMP=$(date +%Y%m%d-%H%M%S)
BK="$HOME/nyd-backup-$STAMP"
mkdir -p "$BK"

WP="wp --path=$ROOT --allow-root"
PASSED=0; FAILED=0; SKIPPED=0
ok()   { echo "  [ OK ] $1"; PASSED=$((PASSED+1)); }
bad()  { echo "  [FAIL] $1"; FAILED=$((FAILED+1)); }
skip() { echo "  [SKIP] $1"; SKIPPED=$((SKIPPED+1)); }
note() { echo "         $1"; }

MARK='xlxjMiihfcPDc26Vy4U58h+CAeZP'
echo "###################################################################"
echo "# NYD WordPress remediation"
echo "# root    : $ROOT"
echo "# backup  : $BK"
echo "# started : $(date)"
echo "###################################################################"

# ---------------------------------------------------------------- 0. BACKUP
echo ""
echo "=== [0] BACKUP (safety net) ==="
CFG=wp-config.php
getcfg() { grep -oE "$1[[:space:]]*,[[:space:]]*'[^']*'" "$CFG" 2>/dev/null | sed "s/.*,[[:space:]]*'\([^']*\)'.*/\1/" | head -1; }
DBU=$(getcfg DB_USER); DBP=$(getcfg DB_PASSWORD); DBN=$(getcfg DB_NAME); DBH=$(getcfg DB_HOST); DBH=${DBH:-localhost}
TBL=$(grep -oE '\$table_prefix[[:space:]]*=[[:space:]]*'"'"'[^'"'"']+'"'"'' "$CFG" 2>/dev/null | sed "s/.*'\([^']*\)'.*/\1/" | head -1)
TBL=${TBL:-wp_}
echo "  DB=$DBN user=$DBU prefix=[$TBL]"

CNF="$HOME/.nyd-db.cnf"; umask 077
printf '[client]\nhost=%s\nuser=%s\npassword=%s\n' "$DBH" "$DBU" "$DBP" > "$CNF"; chmod 600 "$CNF"

DUMP=""
for d in mysqldump /usr/bin/mysqldump /usr/local/cpanel/3rdparty/bin/mysqldump /usr/local/mysql/bin/mysqldump; do
  command -v "$d" >/dev/null 2>&1 && { DUMP="$d"; break; }
done
if [ -n "$DUMP" ]; then
  if "$DUMP" --defaults-extra-file="$CNF" --single-transaction --quick "$DBN" 2>"$BK/dump.err" | gzip -1 > "$BK/db.sql.gz"; then
    ok "database dumped -> $BK/db.sql.gz ($(du -h "$BK/db.sql.gz" | cut -f1))"
  else
    bad "mysqldump failed (see $BK/dump.err)"; head -3 "$BK/dump.err" | sed 's/^/         /'
  fi
else
  bad "mysqldump not found - CANNOT BACK UP DB"
fi

if tar czf "$BK/wp-content.tar.gz" -C "$ROOT" wp-content --exclude='wp-content/cache' 2>/dev/null; then
  ok "wp-content archived -> $BK/wp-content.tar.gz ($(du -h "$BK/wp-content.tar.gz" | cut -f1))"
else
  bad "wp-content tar failed"
fi
cp "$CFG" "$BK/wp-config.php.bak" 2>/dev/null && ok "wp-config.php backed up" || skip "wp-config backup"
echo "  >>> If anything goes wrong: restore with"
echo "      gunzip -c $BK/db.sql.gz | mysql --defaults-extra-file=$CNF $DBN"

# ---------------------------------------------------------------- 1. REPORT
echo ""
echo "=== [1] CURRENT STATE (before changes) ==="
echo "  -- plugins --"
$WP plugin list --format=csv --fields=name,status,version 2>/dev/null | head -40 | sed 's/^/    /'
echo "  -- users --"
$WP user list --fields=ID,user_login,user_email,roles --format=csv 2>/dev/null | sed 's/^/    /'
echo "  -- cron events --"
$WP cron event list --format=csv --fields=hook,next_run_gmt,recurrence 2>/dev/null | head -40 | sed 's/^/    /'
echo "  -- rogue directories present --"
ls -d "$ROOT"/wp-content/plugins/wp-helper-* "$ROOT"/wp-content/plugins/site-helper-* 2>/dev/null | sed 's/^/    /' | head -60
ls -A "$ROOT"/wp-content/mu-plugins 2>/dev/null | sed 's/^/    mu-plugins: /' | head -20

# ---------------------------------------------------------------- 2. FILES
echo ""
echo "=== [2] REMOVING MALWARE FILES ==="
# 2a. every wp-helper-* / site-helper-* directory
for pat in wp-helper site-helper wp_pf; do
  for d in "$ROOT"/wp-content/plugins/${pat}-*; do
    [ -d "$d" ] || continue
    rm -rf "$d" && ok "removed plugin dir $(basename "$d")" || bad "could not remove $d"
  done
done
# 2b. must-use plugins (never deletable from wp-admin, so files only)
if [ -d "$ROOT/wp-content/mu-plugins" ]; then
  for f in "$ROOT"/wp-content/mu-plugins/*.php; do
    [ -f "$f" ] || continue
    b=$(basename "$f")
    [ "$b" = "index.php" ] && continue
    rm -f "$f" && ok "removed mu-plugin $b" || bad "could not remove $b"
  done
  # anything else that is not a directory
  find "$ROOT/wp-content/mu-plugins" -maxdepth 1 -type f ! -name 'index.php' -delete 2>/dev/null
fi
# 2c. ANY file in the whole docroot containing the payload marker
echo "  -- sweeping docroot for the payload marker --"
HITS=$(grep -rl "$MARK" "$ROOT" 2>/dev/null | grep -v '^/.*nyd-backup' | head -50)
if [ -z "$HITS" ]; then
  ok "no marker-bearing files found outside the removed ones"
else
  echo "$HITS" | while read -r h; do
    case "$h" in
      *"/wp-content/cache/"*) rm -rf "$h" 2>/dev/null; echo "  [ OK ] purged cache $h" ;;
      *) rm -f "$h" 2>/dev/null && echo "  [ OK ] removed $h" || echo "  [FAIL] $h" ;;
    esac
  done
fi
# 2d. wipe cache dirs
rm -rf "$ROOT/wp-content/cache/wp-rocket" "$ROOT/wp-content/cache/min" 2>/dev/null && ok "wiped wp-rocket + minify caches" || skip "cache wipe"
$WP cache flush --quiet 2>/dev/null && ok "wp cache flushed" || skip "wp cache flush (harmless)"
$WP rocket clean --allow-root 2>/dev/null && ok "wp-rocket cache purged" || skip "wp rocket clean (plugin may not expose CLI)"

# ---------------------------------------------------------------- 3. DB
echo ""
echo "=== [3] CLEANING THE DATABASE ==="
MYSQL="mysql --defaults-extra-file=$CNF -N -B $DBN"

# 3a. options whose value contains a malware marker
echo "  -- options containing malware markers --"
EVIL=$($MYSQL -e "SELECT option_name FROM \`${TBL}options\` WHERE option_value LIKE '%${MARK}%' OR option_value LIKE '%wp_pf_11d0793d%' OR option_value LIKE '%mshta%' OR option_value LIKE '%base64_decode%' OR option_value LIKE '%wp-helper%';" 2>/dev/null)
if [ -z "$EVIL" ]; then
  ok "no malware-bearing options in ${TBL}options"
else
  echo "$EVIL" | while read -r o; do
    [ -n "$o" ] || continue
    $MYSQL -e "DELETE FROM \`${TBL}options\` WHERE option_name='${o}';" 2>/dev/null \
      && echo "  [ OK ] deleted option $o" || echo "  [FAIL] could not delete $o"
  done
fi

# 3b. active_plugins - strip rogue references
echo "  -- active_plugins --"
AP_RAW=$($WP option get active_plugins --format=json 2>/dev/null)
if [ -z "$AP_RAW" ] || [ "$AP_RAW" = "false" ]; then
  skip "active_plugins not readable via wp-cli"
else
  CLEAN=$(printf '%s' "$AP_RAW" | tr ',' '\n' | grep -viE 'wp-helper|site-helper|ea_|wpm_|wp_pf' | tr -d ' "[]' | tr '\n' ',' | sed 's/,$//')
  if [ "$CLEAN" = "$(printf '%s' "$AP_RAW" | tr -d ' "[]')" ]; then
    ok "active_plugins has no rogue references"
  else
    note "before: $AP_RAW"
    note "after : $CLEAN"
    $WP option update active_plugins "$CLEAN" --format=json >/dev/null 2>&1 \
      && ok "active_plugins cleaned" || bad "active_plugins update failed"
  fi
fi

# 3c. cron events - list all, delete suspicious hooks
echo "  -- cron events --"
HOOKS=$($WP cron event list --format=csv --fields=hook 2>/dev/null | tail -n +2 | tr -d '"')
if [ -z "$HOOKS" ]; then
  skip "no cron events listed (wp-cron may be disabled in wp-config)"
else
  note "all hooks: $(echo "$HOOKS" | tr '\n' ' ')"
  SUSP=$(echo "$HOOKS" | grep -iE 'helper|ea_|wpm|wp_pf|ea_|pf_|site_helper' || true)
  if [ -z "$SUSP" ]; then
    ok "no suspicious cron hooks"
  else
    echo "$SUSP" | while read -r h; do
      [ -n "$h" ] || continue
      $WP cron event delete "$h" --quiet 2>/dev/null \
        && echo "  [ OK ] deleted cron hook $h" || echo "  [FAIL] could not delete $h"
    done
  fi
fi

# 3d. users - delete clearly malware-created accounts
echo "  -- users --"
$MYSQL -e "SELECT u.ID,u.user_login,u.user_email FROM \`${TBL}users\` u;" 2>/dev/null | while read -r id login email; do
  [ -n "$id" ] || continue
  case "$login" in
    wpm_*|cutredblackfox|admin2|test*)
      $WP user delete "$id" --yes --reassign=1 2>/dev/null \
        && echo "  [ OK ] deleted user $id ($login / $email)" \
        || echo "  [FAIL] could not delete $login" ;;
  esac
done
$WP user list --fields=ID,user_login,user_email,roles --format=csv 2>/dev/null | sed 's/^/    remaining: /'

# 3e. drop the shared MySQL user if this account has the privilege
echo "  -- shared MySQL user --"
if $MYSQL -e "DROP USER IF EXISTS 'newyee9c_neeraj'@'localhost'; DROP USER IF EXISTS 'newyee9c_neeraj'@'%';" 2>/dev/null; then
  ok "dropped MySQL user newyee9c_neeraj"
else
  skip "cannot DROP USER from this DB account - delete it in cPanel -> MySQL Databases -> Users"
fi

# ---------------------------------------------------------------- 4. HARDEN
echo ""
echo "=== [4] HARDENING ==="

# 4a. block xmlrpc.php
if grep -q 'xmlrpc' "$ROOT/.htaccess" 2>/dev/null; then
  ok "xmlrpc already blocked"
else
  cp "$ROOT/.htaccess" "$BK/.htaccess.bak" 2>/dev/null
  cat >> "$ROOT/.htaccess" <<'HT'

# --- NYD security hardening (added 2026-11-11) ---
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule ^xmlrpc\.php$ - [F,L]
</IfModule>
<Files "xmlrpc.php">
Order Allow,Deny
Deny from all
</Files>
HT
  ok "xmlrpc.php blocked via .htaccess"
fi

# 4b. block REST user enumeration
if grep -q 'wp-json/wp/v2/users' "$ROOT/.htaccess" 2>/dev/null; then
  ok "REST user enumeration already blocked"
else
  cat >> "$ROOT/.htaccess" <<'HT'

# block REST user enumeration (exposes the admin username)
<IfModule mod_rewrite.c>
RewriteRule ^wp-json/wp/v2/users/?$ - [F,L]
RewriteRule ^wp-json/wp/v2/users/[^/]+/?$ - [F,L]
</IfModule>
HT
  ok "REST user enumeration blocked via .htaccess"
fi

# 4c. mu-plugins must not be writable by the web user / FTP
if [ -d "$ROOT/wp-content/mu-plugins" ]; then
  chmod 755 "$ROOT/wp-content/mu-plugins" 2>/dev/null
  find "$ROOT/wp-content/mu-plugins" -type f -exec chmod 644 {} \; 2>/dev/null
  ok "mu-plugins permissions reset (755 dir / 644 files)"
fi

# 4d. remove leftover index.php backups / stray php in uploads
find "$ROOT/wp-content/uploads" -name '*.php' ! -name 'index.php' -mtime -30 2>/dev/null | while read -r f; do
  echo "  [WARN] recent php file in uploads (review): ${f#$ROOT/}"
done

# 4e. keep wp-config read-only-ish
chmod 640 "$ROOT/wp-config.php" 2>/dev/null && ok "wp-config.php permissions set to 640" || skip "wp-config chmod"

# ---------------------------------------------------------------- 5. VERIFY
echo ""
echo "=== [5] VERIFICATION ==="
LEFT=$(grep -rl "$MARK" "$ROOT" 2>/dev/null | grep -v '/nyd-backup' | head -20)
if [ -z "$LEFT" ]; then
  ok "payload marker: ZERO matches across the whole docroot"
else
  bad "payload marker still present in:"; echo "$LEFT" | sed 's/^/         /'
fi

for pat in 'wp_pf_11d0793d' 'mshta' 'nochain-sw' 'front-probe'; do
  C=$(grep -rl "$pat" "$ROOT/wp-content" 2>/dev/null | head -3)
  [ -z "$C" ] && ok "no '$pat' in wp-content" || { bad "'$pat' still present:"; echo "$C" | sed 's/^/         /'; }
done

echo "  -- mu-plugins now --"; ls -A "$ROOT/wp-content/mu-plugins" 2>/dev/null | sed 's/^/    /' || echo "    (empty)"
echo "  -- rogue plugin dirs now --"; ls -d "$ROOT"/wp-content/plugins/*helper* 2>/dev/null | sed 's/^/    /' || echo "    none"
echo "  -- plugins --"; $WP plugin list --format=csv --fields=name,status,version 2>/dev/null | head -40 | sed 's/^/    /'
echo "  -- users --"; $WP user list --fields=ID,user_login,user_email,roles --format=csv 2>/dev/null | sed 's/^/    /'
echo "  -- cron --"; $WP cron event list --format=csv --fields=hook,next_run_gmt 2>/dev/null | head -20 | sed 's/^/    /'

rm -f "$CNF"
echo ""
echo "###################################################################"
echo "# passed=$PASSED  failed=$FAILED  skipped=$SKIPPED"
echo "# backup kept at: $BK"
echo "# finished: $(date)"
echo "###################################################################"
echo ""
echo "STILL TO DO BY HAND (cPanel UI):"
echo "  1. cPanel -> MySQL Databases -> delete user 'newyee9c_neeraj'  (if script could not)"
echo "  2. cPanel -> FTP Accounts -> delete 'neeraj@newyeardiaries.in'"
echo "  3. cPanel -> MySQL Databases -> change the main DB password (rotate)"
echo "  4. BigRock -> Orders -> My Hosting -> enable Auto-Renew (domain + hosting)"
echo "  5. cPanel -> Security Wizard -> change cPanel password when done"
echo "  6. Install Wordfence + enable 2FA for the admin account"
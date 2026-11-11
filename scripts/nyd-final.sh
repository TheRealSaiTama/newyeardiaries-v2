#!/bin/bash
# =============================================================================
#  NYD WordPress - final pass: access-log forensics + remaining backdoors
#  Run:  bash ~/nyd-final.sh
#
#  Eradication pass removed the rogue admins and the payload, and WP core now
#  verifies clean. Still outstanding:
#    - wp-includes/Text/Diff/Engine/shell.php   (real webshell, found but not
#      deleted by the previous pass)
#    - loginizer/upgrade.php                      (checksum says "File was added")
#    - 7.4 GB public_html_backup_2026-07-30.zip  (possible infection source)
#    - the entry vector itself, which lives in the Apache domlogs
# =============================================================================

set -u
cd "$HOME/public_html" 2>/dev/null || cd /home1/newyee9c/public_html || { echo "no public_html"; exit 1; }
ROOT=$(pwd); STAMP=$(date +%Y%m%d-%H%M%S); BK="$HOME/nyd-final-$STAMP"; mkdir -p "$BK"
WP="wp --path=$ROOT --allow-root"
PASS=0; FAIL=0
ok()  { echo "  [ OK ] $1"; PASS=$((PASS+1)); }
bad() { echo "  [FAIL] $1"; FAIL=$((FAIL+1)); }
note(){ echo "         $1"; }

echo "###################################################################"
echo "# NYD FINAL PASS   $(date)"
echo "###################################################################"

# ================================================== 1. ACCESS LOG FORENSICS
echo ""
echo "############ 1. ENTRY VECTOR - Apache access logs ############"
DOMLOG=$(readlink -f "$HOME/access-logs" 2>/dev/null || echo "")
[ -z "$DOMLOG" ] && DOMLOG="/etc/apache2/logs/domlogs/newyee9c"
echo "  domlogs path: $DOMLOG"
ls -la "$DOMLOG" 2>/dev/null | head -20 | sed 's/^/  /'

ALLLOGS=""
if [ -d "$DOMLOG" ]; then
  ALLLOGS=$(find "$DOMLOG" -type f -name '*.log' -o -type f -name '*newyeardiaries*' 2>/dev/null | head -20)
fi
[ -z "$ALLLOGS" ] && ALLLOGS=$(find "$DOMLOG" -type f 2>/dev/null | head -20)
echo "  log files found: $(echo "$ALLLOGS" | grep -c . )"

cat $ALLLOGS > "$BK/all-access.log" 2>/dev/null
TOT=$(wc -l < "$BK/all-access.log" 2>/dev/null || echo 0)
echo "  total log lines: $TOT"

echo ""
echo "  -- 1a. SUCCESSFUL wp-login.php POSTs (302 = password worked) --"
if [ "$TOT" -gt 0 ]; then
  grep -E '"POST /wp-login\.php' "$BK/all-access.log" 2>/dev/null \
    | grep -E '" 30[12] ' | awk '{print $1}' | sort | uniq -c | sort -rn | head -20 | sed 's/^/      /'
  echo "      (IP, count) -- top successful login sources"
  grep -E '"POST /wp-login\.php' "$BK/all-access.log" 2>/dev/null \
    | grep -E '" 30[12] ' | awk '{print $1, $4, $7}' | sort -u | head -25 | sed 's/^/      /'
fi

echo ""
echo "  -- 1b. FIRST requests to wp-helper-* / mu-plugins / shell.php --"
if [ "$TOT" -gt 0 ]; then
  for pat in 'wp-helper' 'mu-plugins' 'shell\.php' 'ea_04e70780' 'wp_pf'; do
    echo "      [$pat]"
    grep -E "$pat" "$BK/all-access.log" 2>/dev/null | awk '{print $1, $4, $7}' | sort -u | head -12 | sed 's/^/        /'
  done
fi

echo ""
echo "  -- 1c. plugin upload / install endpoints (how a shell gets in) --"
if [ "$TOT" -gt 0 ]; then
  grep -E 'plugin-install|plugin-editor|upload\.php|wp-admin/install|theme-install|update\.php\?.*action' "$BK/all-access.log" 2>/dev/null \
    | awk '{print $1, $4, $7}' | sort -u | head -20 | sed 's/^/      /'
fi

echo ""
echo "  -- 1d. every distinct IP in the logs, top 30 --"
if [ "$TOT" -gt 0 ]; then
  awk '{print $1}' "$BK/all-access.log" 2>/dev/null | sort | uniq -c | sort -rn | head -30 | sed 's/^/      /'
fi

echo ""
echo "  -- 1e. IPs that ONLY touched admin paths (candidate attackers) --"
if [ "$TOT" -gt 0 ]; then
  grep -E '/wp-admin/|/wp-login\.php' "$BK/all-access.log" 2>/dev/null | awk '{print $1}' | sort | uniq -c | sort -rn | head -20 | sed 's/^/      /'
fi

echo ""
echo "  -- 1f. user-agents used on wp-admin / wp-login --"
if [ "$TOT" -gt 0 ]; then
  grep -E '/wp-admin/|/wp-login\.php' "$BK/all-access.log" 2>/dev/null | awk -F'"' '{print $6}' | sort | uniq -c | sort -rn | head -12 | sed 's/^/      /'
fi

echo ""
echo "  -- 1g. ftp / cpanel endpoints (file drops via FTP show as ftp/ or a cPanel user agent) --"
if [ "$TOT" -gt 0 ]; then
  awk '{print $1, $4, $7}' "$BK/all-access.log" 2>/dev/null | grep -iE 'ftp|admin/|cpanel' | sort -u | head -20 | sed 's/^/      /'
fi

# ================================================== 2. REMAINING BACKDOORS
echo ""
echo "############ 2. REMAINING BACKDOORS ############"
echo "=== 2a. the real webshell ==="
SHELLF="$ROOT/wp-includes/Text/Diff/Engine/shell.php"
if [ -f "$SHELLF" ]; then
  echo "  --- ${SHELLF#$ROOT/} ($(wc -c < "$SHELLF") bytes, mtime $(date -r "$SHELLF" '+%Y-%m-%d %H:%M')) ---"
  cp "$SHELLF" "$BK/shell.php.evidence" 2>/dev/null
  cat "$SHELLF" | head -c 2500 | sed 's/^/      /'
  echo
  rm -f "$SHELLF" && ok "DELETED webshell wp-includes/Text/Diff/Engine/shell.php" || bad "could not delete shell.php"
else
  ok "shell.php already gone"
fi

echo ""
echo "=== 2b. any other PHP file in wp-includes or wp-admin that core does not ship ==="
$WP core verify-checksums 2>&1 | grep -v '^Success' | head -20 | sed 's/^/      /'
CORE_BAD=$($WP core verify-checksums 2>&1 | grep -cE 'Warning|Error')
[ "$CORE_BAD" = "0" ] && ok "wp core verifies clean (no unexpected files)" || note "$CORE_BAD core warnings (re-run the output above)"

echo ""
echo "=== 2c. loginizer/upgrade.php (checksum said 'File was added') ==="
for f in "$ROOT/wp-content/plugins/loginizer/upgrade.php" "$ROOT/wp-content/plugins/loginizer/maintenance.php"; do
  [ -f "$f" ] && { echo "  --- ${f#$ROOT/} ($(wc -c < "$f") bytes) ---"; head -c 1200 "$f" | sed 's/^/      /'; echo; }
done

echo ""
echo "=== 2d. scan EVERY php file in wp-includes + wp-admin for webshell signatures ==="
SUSP=$(grep -rlE 'eval\(base64_decode|system\(|shell_exec\(|passthru\(|proc_open\(|popen\(|assert\(\$|preg_replace\(.+/e' \
       "$ROOT/wp-includes" "$ROOT/wp-admin" 2>/dev/null | head -20)
if [ -z "$SUSP" ]; then
  ok "no eval/system/shell_exec signatures in wp-includes or wp-admin"
else
  echo "$SUSP" | while read -r f; do
    cp "$f" "$BK/susp_$(echo "${f#$ROOT/}" | tr '/' '_')" 2>/dev/null
    echo "      HIT ${f#$ROOT/}"
    grep -oE '.{0,50}(eval\(base64_decode|system\(|shell_exec\(|passthru\(|proc_open\(|popen\().{0,80}' "$f" | head -2 | sed 's/^/        /'
  done
fi

echo ""
echo "=== 2e. mu-plugins and plugins dir final state ==="
ls -A "$ROOT/wp-content/mu-plugins" 2>/dev/null | sed 's/^/      mu: /' || echo "      mu: (empty)"
ls -d "$ROOT/wp-content/plugins"/* 2>/dev/null | wc -l | sed 's/^/      plugin dirs: /'

# ================================================== 3. THE 7.4GB BACKUP
echo ""
echo "############ 3. THE 7.4GB BACKUP ZIP ############"
ZIP="$HOME/public_html_backup_2026-07-30.zip"
if [ -f "$ZIP" ]; then
  echo "  file: $ZIP"
  echo "  size: $(du -h "$ZIP" | cut -f1)   mtime: $(date -r "$ZIP" '+%Y-%m-%d %H:%M')"
  echo "  -- top-level entries (listing only, not extracting) --"
  unzip -l "$ZIP" 2>/dev/null | head -25 | sed 's/^/      /'
  echo "  -- does it contain the malware? --"
  unzip -l "$ZIP" 2>/dev/null | grep -iE 'wp-helper|mu-plugins|shell\.php|ea_' | head -20 | sed 's/^/      /'
  echo "  -- disk space before cleanup --"
  df -h "$HOME" | sed 's/^/      /'
  note "keeping this file for now (it may be a clean pre-infection snapshot)."
  note "it occupies 7.4 GB - move it to a cloud drive or delete after we have a fresh DB dump."
else
  note "backup zip not found at $HOME"
fi

# ================================================== 4. FINAL VERIFY
echo ""
echo "############ 4. FINAL VERIFY ############"
$WP core verify-checksums 2>&1 | tail -2 | sed 's/^/  /'
echo "  -- users --"; $WP user list --fields=ID,user_login,user_email,roles --format=csv 2>/dev/null | sed 's/^/    /'
echo "  -- mu-plugins --"; ls -A "$ROOT/wp-content/mu-plugins" 2>/dev/null | sed 's/^/    /' || echo "    (empty)"
M=$(grep -rl 'xlxjMiihfcPDc26Vy4U58h+CAeZP' "$ROOT" 2>/dev/null | grep -v '/nyd-' | head -5)
[ -z "$M" ] && ok "payload marker: zero matches in docroot" || { bad "marker present:"; echo "$M" | sed "s|$ROOT/|         |"; }
find "$ROOT" -type f -name 'shell.php' 2>/dev/null | head -5 | sed "s|$ROOT/|  leftover shell.php: |"

echo ""
echo "###################################################################"
echo "# final: passed=$PASS failed=$FAIL   evidence+logs: $BK"
echo "###################################################################"
echo ""
echo "NEXT (manual):"
echo "  1. wp-admin -> change admin PASSWORD (assume it leaked)"
echo "  2. wp-admin -> enable 2FA on admin"
echo "  3. cPanel -> MySQL Databases -> delete user 'newyee9c_neeraj'"
echo "  4. cPanel -> FTP Accounts -> delete 'neeraj@newyeardiaries.in'"
echo "  5. cPanel -> MySQL Databases -> rotate the main DB password"
echo "  6. BigRock -> Orders -> My Hosting -> Auto-Renew ON (domain + hosting)"
echo "  7. wp-admin -> Plugins -> install Wordfence, then enable 2FA"
echo "  8. Block C2 at the network edge: 210.193.142.11, 44.14.240.4"
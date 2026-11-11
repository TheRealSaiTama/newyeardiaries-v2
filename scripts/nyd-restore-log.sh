#!/bin/bash
# =============================================================================
#  NYD WordPress - restore core + deep entry-vector log analysis
#  Run:  bash ~/nyd-restore-log.sh
#
#  URGENT: the previous pass deleted wp-includes/Text/Diff/Engine/shell.php,
#  which is a legitimate WordPress core file (Text_Diff_Engine_shell from the
#  Horde project, shipped since WP 6.3). It was wrongly assumed to be a
#  webshell. This restores it from the official WordPress release.
#
#  Then it mines the Apache domlogs properly, using the real log format,
#  for the moment the attacker first touched the server.
# =============================================================================

set -u
cd "$HOME/public_html" 2>/dev/null || cd /home1/newyee9c/public_html || { echo "no public_html"; exit 1; }
ROOT=$(pwd); STAMP=$(date +%Y%m%d-%H%M%S); BK="$HOME/nyd-restore-$STAMP"; mkdir -p "$BK"
WP="wp --path=$ROOT --allow-root"
PASS=0; FAIL=0
ok()  { echo "  [ OK ] $1"; PASS=$((PASS+1)); }
bad() { echo "  [FAIL] $1"; FAIL=$((FAIL+1)); }
note(){ echo "         $1"; }

echo "###################################################################"
echo "# NYD RESTORE + LOG ANALYSIS   $(date)"
echo "###################################################################"

# ============================================ 1. RESTORE THE CORE FILE
echo ""
echo "############ 1. RESTORE DELETED CORE FILE ############"
VER=$($WP core version 2>/dev/null | tr -d '[:space:]')
note "WordPress version on disk: $VER"
cp wp-config.php "$BK/wp-config.php.bak" 2>/dev/null && ok "wp-config.php backed up before core restore"

echo "  -- re-downloading core files for $VER --"
if $WP core download --version="$VER" --force --skip-content --allow-root > "$BK/coredl.log" 2>&1; then
  ok "core files re-downloaded (wp-content and wp-config untouched)"
else
  bad "core download failed - see $BK/coredl.log"; tail -5 "$BK/coredl.log" | sed 's/^/         /'
fi

echo ""
echo "  -- verify-checksums after restore --"
$WP core verify-checksums 2>&1 | tail -3 | sed 's/^/    /'
$WP core verify-checksums 2>&1 | grep -q '^Success' \
  && ok "wp core verifies CLEAN again" \
  || bad "core still does not verify - run the output above"

echo ""
echo "  -- confirm the restored file is the real core file --"
F="$ROOT/wp-includes/Text/Diff/Engine/shell.php"
if [ -f "$F" ]; then
  ok "restored: wp-includes/Text/Diff/Engine/shell.php ($(wc -c < "$F") bytes)"
  grep -m1 'class Text_Diff_Engine_shell' "$F" | sed 's/^/         /'
else
  bad "file still missing"
fi

# ============================================ 2. LOG FORMAT + RANGE
echo ""
echo "############ 2. ACCESS LOG FORMAT AND COVERAGE ############"
DOMLOG=$(readlink -f "$HOME/access-logs" 2>/dev/null || echo "/etc/apache2/logs/domlogs/newyee9c")
cat "$DOMLOG"/* > "$BK/all.log" 2>/dev/null
TOT=$(wc -l < "$BK/all.log" 2>/dev/null || echo 0)
note "log dir : $DOMLOG"
note "lines   : $TOT"
echo "  -- first line of the log (shows the real format) --"
head -1 "$BK/all.log" | sed 's/^/    /'
echo "  -- last line --"
tail -1 "$BK/all.log" | sed 's/^/    /'
echo "  -- date range covered --"
FIRST=$(head -1 "$BK/all.log" | grep -oE '\[[0-9]{2}/[A-Za-z]{3}/[0-9]{4}' | head -1)
LAST=$(tail -1 "$BK/all.log" | grep -oE '\[[0-9]{2}/[A-Za-z]{3}/[0-9]{4}' | tail -1)
note "from $FIRST  to  $LAST"

# helper: extract field 1 (ip) and field 4 (time) and the request path
IPF='{print $1}'
PATF='{print $7}'

# ============================================ 3. FIRST TOUCH OF EACH MALWARE PATH
echo ""
echo "############ 3. FIRST REQUEST FOR EACH MALWARE PATH ############"
for pat in 'wp-helper' 'site-helper' 'mu-plugins' '\.tmb' 'shell\.php' 'wp_pf' 'ea_[0-9a-f]{8}'; do
  echo "  -- $pat --"
  H=$(grep -E "$pat" "$BK/all.log" 2>/dev/null | head -1)
  if [ -n "$H" ]; then
    echo "$H" | awk '{print "      FIRST: "$1"  "$4"  "$7}'
    echo "      total hits: $(grep -cE "$pat" "$BK/all.log" 2>/dev/null)"
    echo "      distinct IPs: $(grep -E "$pat" "$BK/all.log" 2>/dev/null | awk '{print $1}' | sort -u | wc -l)"
    echo "      top IPs:"
    grep -E "$pat" "$BK/all.log" 2>/dev/null | awk '{print $1}' | sort | uniq -c | sort -rn | head -5 | sed 's/^/        /'
  else
    echo "      (no hits in the retained log window)"
  fi
done

# ============================================ 4. THE STAGING DIR .tmb
echo ""
echo "############ 4. .tmb STAGING DIRECTORY (file drop staging) ############"
grep -E '\.tmb' "$BK/all.log" 2>/dev/null | awk '{print $1, $4, $7}' | sort -u | head -30 | sed 's/^/    /'
note "count: $(grep -cE '\.tmb' "$BK/all.log" 2>/dev/null)"
echo "  -- is .tmb present on disk right now? --"
find "$ROOT" -maxdepth 3 -name '.tmb' -type d 2>/dev/null | sed "s|$ROOT/|      DIR: |"
find "$ROOT" -maxdepth 4 -path '*.tmb*' -type f 2>/dev/null | head -20 | sed "s|$ROOT/|      FILE: |"

# ============================================ 5. ADMIN POSTS AND UPLOADS
echo ""
echo "############ 5. ADMIN POSTS AND FILE UPLOADS ############"
echo "  -- all POST requests, with method+path+IP (first 40) --"
grep -E '"POST ' "$BK/all.log" 2>/dev/null | awk '{print $1, $4, $7}' | sort -u | head -40 | sed 's/^/    /'
echo "  -- requests to plugin/theme install or edit screens --"
grep -E 'plugin-install|plugin-editor|theme-editor|theme-install|upload\.php|wp-admin/install|update\.php' "$BK/all.log" 2>/dev/null \
  | awk '{print $1, $4, $7}' | sort -u | head -30 | sed 's/^/    /'
echo "  -- requests reading wp-config or .env or SQL --"
grep -E 'wp-config|\.env|\.sql|\.bak|\.zip' "$BK/all.log" 2>/dev/null | awk '{print $1, $4, $7}' | sort -u | head -25 | sed 's/^/    /'
echo "  -- admin-ajax actions used (top 25) --"
grep -oE 'action=[a-zA-Z0-9_\-]+' "$BK/all.log" 2>/dev/null | sort | uniq -c | sort -rn | head -25 | sed 's/^/    /'

# ============================================ 6. LOGIN ANALYSIS (correct regex)
echo ""
echo "############ 6. LOGIN ATTEMPTS ############"
echo "  -- status codes returned for POST /wp-login.php --"
grep -E '"POST /wp-login\.php' "$BK/all.log" 2>/dev/null | grep -oE '" [0-9]{3} ' | sort | uniq -c | sed 's/^/    /'
echo "  -- distinct IPs posting to wp-login.php --"
grep -E '"POST /wp-login\.php' "$BK/all.log" 2>/dev/null | awk '{print $1}' | sort | uniq -c | sort -rn | head -20 | sed 's/^/    /'
echo "  -- 302 responses on wp-login (successful auth) --"
grep -E '"POST /wp-login\.php' "$BK/all.log" 2>/dev/null | grep -E '" 302 ' | awk '{print $1, $4}' | sort -u | head -25 | sed 's/^/    /'
echo "  -- cookies set after wp-login (Set-Cookie / wordpress_logged_in in refererless hits) --"
grep -E 'wordpress_logged_in|wp-postpass' "$BK/all.log" 2>/dev/null | awk '{print $1, $4, $7}' | sort -u | head -20 | sed 's/^/    /'

# ============================================ 7. THE BIG-TRAFFIC IP
echo ""
echo "############ 7. TOP TRAFFIC IP PROFILE ############"
for ip in 144.76.32.120 49.206.12.148 182.77.70.220 143.244.57.121 103.59.161.168; do
  N=$(grep -cE "^$ip " "$BK/all.log" 2>/dev/null)
  [ "$N" = "0" ] && continue
  echo "  -- $ip ($N requests) --"
  grep -E "^$ip " "$BK/all.log" 2>/dev/null | awk '{print $6, $7}' | sort | uniq -c | sort -rn | head -6 | sed 's/^/      /'
  grep -E "^$ip " "$BK/all.log" 2>/dev/null | awk -F'"' '{print $6}' | sort -u | head -2 | sed 's/^/      UA: /'
  echo "      first: $(grep -E "^$ip " "$BK/all.log" 2>/dev/null | head -1 | awk '{print $4}')"
  echo "      last : $(grep -E "^$ip " "$BK/all.log" 2>/dev/null | tail -1 | awk '{print $4}')"
done

# ============================================ 8. THE 6.9GB ZIP
echo ""
echo "############ 8. THE 6.9GB BACKUP ZIP ############"
ZIP="$HOME/public_html_backup_2026-07-30.zip"
if [ -f "$ZIP" ]; then
  note "size $(du -h "$ZIP" | cut -f1), mtime $(date -r "$ZIP" '+%Y-%m-%d')"
  note "CONTAINS wp-helper malware dated 2026-07-17+, so it is POST-infection."
  note "DO NOT restore this zip over the live site."
  echo "  -- how many malware entries inside --"
  unzip -l "$ZIP" 2>/dev/null | grep -cE 'wp-helper|site-helper|mu-plugins/ea_' | sed 's/^/      /'
  echo "  -- clean updraft backups inside (candidates for a clean restore) --"
  unzip -l "$ZIP" 2>/dev/null | grep -iE 'updraft/backup_.*(database|files)\.zip' | head -12 | sed 's/^/      /'
  echo "  -- disk --"
  df -h "$HOME" | tail -1 | sed 's/^/      /'
fi

echo ""
echo "###################################################################"
echo "# restore+log: passed=$PASS failed=$FAIL   evidence: $BK"
echo "###################################################################"
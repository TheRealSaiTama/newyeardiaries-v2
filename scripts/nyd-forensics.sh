#!/bin/bash
# =============================================================================
#  NYD WordPress - FORENSICS (read only, changes nothing)
#  Run:  bash ~/nyd-forensics.sh
#
#  Answers three questions with evidence, not guesses:
#    A. WHAT exactly was the malware? (analyse the real code from our backups)
#    B. HOW did it get in? (access logs, MySQL privileges, option history)
#    C. WHO / WHEN? (timeline, source IPs, account forensics)
# =============================================================================

set -u
cd "$HOME/public_html" 2>/dev/null || cd /home1/newyee9c/public_html || { echo "no public_html"; exit 1; }
ROOT=$(pwd)
WP="wp --path=$ROOT --allow-root"
W="$HOME/.nyd-forensics"; rm -rf "$W"; mkdir -p "$W"

echo "###################################################################"
echo "# NYD FORENSICS   $(date)"
echo "###################################################################"

# --------------------------------------------------------------- creds
CFG=wp-config.php
getcfg() { local k="$1"; grep -oE "['\"]${k}['\"][[:space:]]*,[[:space:]]*['\"][^'\"]*['\"]" "$CFG" 2>/dev/null | head -1 | sed -E "s/.*,[[:space:]]*['\"]([^'\"]*)['\"][[:space:]]*\$/\1/"; }
DBU=$(getcfg DB_USER); DBP=$(getcfg DB_PASSWORD); DBN=$(getcfg DB_NAME); DBH=$(getcfg DB_HOST); DBH=${DBH:-localhost}
TBL=$(grep -oE '\$table_prefix[[:space:]]*=[[:space:]]*'"'"'[^'"'"']+'"'"'' "$CFG" 2>/dev/null | sed "s/.*'\([^']*\)'.*/\1/" | head -1); TBL=${TBL:-wp_}
CNF="$HOME/.nyd-f.cnf"; umask 077
printf '[client]\nhost=%s\nuser=%s\npassword=%s\n' "$DBH" "$DBU" "$DBP" > "$CNF"; chmod 600 "$CNF"
MYSQL="mysql --defaults-extra-file=$CNF -N -B $DBN"
echo "DB=$DBN user=$DBU prefix=$TBL"

# =========================================================== A. THE MALWARE
echo ""
echo "############ A. WHAT WAS THE MALWARE? ############"
echo "=== A1. Our backup tarballs (contain the deleted malware) ==="
ls -la "$HOME"/nyd-*.tar.gz "$HOME"/nyd-backup-*/*.tar.gz 2>/dev/null | sed 's/^/  /'

MU_TGZ=$(ls -t "$HOME"/nyd-malware-backup-*.tar.gz 2>/dev/null | head -1)
WH_TGZ=$(ls -t "$HOME"/nyd-wphelper-backup-*.tar.gz 2>/dev/null | head -1)
BK_DIR=$(ls -dt "$HOME"/nyd-backup-* 2>/dev/null | head -1)

echo ""
echo "=== A2. The must-use plugin payload (ea_04e70780.php) ==="
if [ -n "$MU_TGZ" ]; then
  tar xzf "$MU_TGZ" -C "$W" 2>/dev/null
  MUF=$(find "$W" -name 'ea_*.php' | head -1)
  if [ -n "$MUF" ]; then
    echo "  file: $(basename "$MUF")  size: $(wc -c < "$MUF") bytes"
    echo "  --- first 40 lines ---"
    head -40 "$MUF" | sed 's/^/    /'
    echo "  --- strings of interest ---"
    grep -oiE 'https?://[a-z0-9\.\-/:_]+' "$MUF" 2>/dev/null | sort -u | head -20 | sed 's/^/    URL: /'
    grep -oiE '([0-9]{1,3}\.){3}[0-9]{1,3}' "$MUF" 2>/dev/null | sort -u | head -10 | sed 's/^/    IP:  /'
    grep -oiE '[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}' "$MUF" 2>/dev/null | sort -u | head -10 | sed 's/^/    MAIL:/'
    grep -oiE '(eval|base64_decode|gzinflate|str_rot13|assert|create_function|shell_exec|passthru|system|popen|proc_open|file_put_contents|fopen|fwrite|curl_exec|wp_insert_user|wp_set_auth_cookie|add_user_to_blog)' "$MUF" 2>/dev/null | sort | uniq -c | sort -rn | head -20 | sed 's/^/    FUNC:/'
  else
    echo "  mu-plugin not found in $MU_TGZ"
  fi
else
  echo "  (no mu-plugin backup tarball found)"
fi

echo ""
echo "=== A3. The 42 wp-helper-* plugin drops ==="
if [ -n "$WH_TGZ" ]; then
  tar xzf "$WH_TGZ" -C "$W" 2>/dev/null
  echo "  directories recovered: $(find "$W" -type d -name 'wp-helper-*' | wc -l)"
  echo "  --- one representative file, full content ---"
  RF=$(find "$W" -path '*wp-helper-*' -name '*.php' | head -1)
  if [ -n "$RF" ]; then
    echo "  file: ${RF#$W/}  ($(wc -c < "$RF") bytes)"
    head -60 "$RF" | sed 's/^/    /'
  fi
  echo "  --- every distinct URL / IP / mail across ALL helper plugins ---"
  find "$W" -path '*wp-helper-*' -type f -exec cat {} \; 2>/dev/null \
    | grep -oiE 'https?://[a-z0-9\.\-/:_]+' | sort -u | head -30 | sed 's/^/    URL: /'
  find "$W" -path '*wp-helper-*' -type f -exec cat {} \; 2>/dev/null \
    | grep -oiE '([0-9]{1,3}\.){3}[0-9]{1,3}' | sort -u | head -15 | sed 's/^/    IP:  /'
  find "$W" -path '*wp-helper-*' -type f -exec cat {} \; 2>/dev/null \
    | grep -oiE '[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}' | sort -u | head -15 | sed 's/^/    MAIL:/'
  echo "  --- timestamps of every recovered helper plugin (attack timeline) ---"
  find "$W" -path '*wp-helper-*' -type f -printf '%TY-%Tm-%Td %TH:%TM  %p\n' 2>/dev/null \
    | sed "s|$W/||" | sort | head -50 | sed 's/^/    /'
else
  echo "  (no wp-helper backup tarball found)"
fi

# =========================================================== B. HOW
echo ""
echo "############ B. HOW DID IT GET IN? ############"
echo "=== B1. cPanel access / error logs (the smoking gun) ==="
LOGDIR=$(ls -d /home1/newyee9c/logs 2>/dev/null || ls -d "$HOME/logs" 2>/dev/null || echo "$HOME/logs")
echo "  log dir: $LOGDIR"
ls -la "$LOGDIR" 2>/dev/null | head -15 | sed 's/^/  /'

echo ""
echo "  -- POSTs to wp-login.php (successful logins = compromised password) --"
for f in "$LOGDIR"/access.log "$LOGDIR"/*.log; do
  [ -f "$f" ] || continue
  echo "  [$f]"
  grep -E 'POST /wp-login\.php' "$f" 2>/dev/null | awk '{print $1, $4, $9, $11}' | sort | uniq -c | sort -rn | head -25 | sed 's/^/    /'
  echo "  -- successful auth markers (POST + 302 to wp-admin) --"
  grep -E 'POST /wp-login\.php' "$f" 2>/dev/null | grep -E ' 302 ' | awk '{print "    IP="$1"  time="$4"  ua="$NF}' | sort -u | head -25
  break
done

echo ""
echo "  -- requests touching wp-helper-* or mu-plugins (when the dropper was served) --"
for f in "$LOGDIR"/access.log; do
  [ -f "$f" ] || continue
  grep -E 'wp-helper|mu-plugins' "$f" 2>/dev/null | awk '{print $1, $4, $7}' | sort -u | head -30 | sed 's/^/    /'
  echo "  -- unique IPs in the whole access log, top 25 by request count --"
  awk '{print $1}' "$f" 2>/dev/null | sort | uniq -c | sort -rn | head -25 | sed 's/^/    /'
  break
done

echo ""
echo "=== B2. Could the MySQL account WRITE FILES? (the INTO OUTFILE route) ==="
echo "  -- grants for every MySQL user --"
$MYSQL -e "SELECT user,host FROM mysql.user WHERE user NOT IN ('','mysql.sys','mysql.session','mysql.infoschema');" 2>&1 | head -20 | while read -r u h; do
  [ -n "$u" ] || continue
  g=$($MYSQL -e "SHOW GRANTS FOR '$u'@'$h';" 2>&1 | tr '\n' ' ')
  case "$g" in *ERROR*) echo "    $u@$h -> (cannot read grants from this account)" ;;
  *) echo "    $u@$h -> $g" ;; esac
done
echo "  -- secure_file_priv (empty = INTO OUTFILE can write ANYWHERE the web user can) --"
$MYSQL -e "SHOW VARIABLES LIKE 'secure_file_priv';" 2>&1 | sed 's/^/    /'
echo "  -- FILE privilege check --"
$MYSQL -e "SELECT user,host FROM mysql.user WHERE File_priv='Y';" 2>&1 | head -10 | sed 's/^/    /'

echo ""
echo "=== B3. Plugin install / activation trail in the DB ==="
echo "  -- recently_activated (WordPress keeps a rolling list) --"
$WP option get recently_activated --format=json 2>/dev/null | head -c 2000 | sed 's/^/    /' ; echo
echo "  -- any option row mentioning helper/ea_/wpm --"
$MYSQL -e "SELECT option_name, LEFT(option_value,120) FROM \`${TBL}options\` WHERE option_name LIKE '%helper%' OR option_name LIKE '%ea_%' OR option_name LIKE '%wpm%' OR option_value LIKE '%wp-helper%' OR option_value LIKE '%ea_04e70780%' OR option_value LIKE '%wpm_f7cd8384%' LIMIT 30;" 2>&1 | sed 's/^/    /'
echo "  -- transients referencing the malware --"
$MYSQL -e "SELECT option_name, LEFT(option_value,80) FROM \`${TBL}options\` WHERE option_name LIKE '%transient%' AND (option_value LIKE '%helper%' OR option_value LIKE '%ea_%' OR option_value LIKE '%wpm%') LIMIT 20;" 2>&1 | sed 's/^/    /'

# =========================================================== C. WHO / WHEN
echo ""
echo "############ C. WHO AND WHEN ############"
echo "=== C1. User forensics ==="
$MYSQL -e "SELECT u.ID,u.user_login,u.user_email,u.user_registered FROM \`${TBL}users\` u ORDER BY u.ID;" 2>&1 | while read -r id login email reg; do
  [ -n "$id" ] || continue
  posts=$($WP post list --author="$id" --format=count --allow-root 2>/dev/null)
  lastl=$($WP user meta get "$id" last_login --allow-root 2>/dev/null || echo "-")
  caps=$($MYSQL -e "SELECT meta_value FROM \`${TBL}usermeta\` WHERE user_id=$id AND meta_key='${TBL}capabilities';" 2>/dev/null)
  echo "    ID=$id login=$login"
  echo "        email      = $email"
  echo "        registered = $reg"
  echo "        posts      = $posts"
  echo "        last_login = $lastl"
  echo "        caps       = $caps"
done

echo ""
echo "=== C2. Session tokens (active logins) ==="
$MYSQL -e "SELECT u.user_login, s.session_key, FROM_UNIXTIME(s.session_expiration) FROM \`${TBL}usersessionsessions\` s;" 2>/dev/null | head -5 | sed 's/^/    /'
$MYSQL -e "SELECT meta_key, LEFT(meta_value,60) FROM \`${TBL}usermeta\` WHERE meta_key='session_tokens';" 2>&1 | head -5 | sed 's/^/    /'

echo ""
echo "=== C3. Filesystem timeline (attack window) ==="
echo "  -- files modified since 2026-08-25 in wp-content, oldest first --"
find "$ROOT/wp-content" -type f -newermt '2026-08-25' ! -path '*/cache/*' -printf '%TY-%Tm-%Td %TH:%TM  %p\n' 2>/dev/null \
  | sed "s|$ROOT/||" | sort | head -40 | sed 's/^/    /'

echo ""
echo "=== C4. WP core / plugin integrity spot-check ==="
echo "  -- WP version --"; $WP core version 2>/dev/null | sed 's/^/    /'
echo "  -- checksums (expect '1 error' or similar only for modified files) --"
$WP core verify-checksums 2>&1 | head -8 | sed 's/^/    /'
echo "  -- plugin verify, active plugins only --"
for p in product-designer revslider advanced-google-recaptcha wp-rocket smart-slider-3; do
  echo "    [$p]"
  $WP plugin verify-checksums "$p" 2>&1 | head -4 | sed 's/^/      /'
done

echo ""
echo "=== C5. Site-level anomalies ==="
echo "  -- any PHP file in uploads (dropper staging) --"
find "$ROOT/wp-content/uploads" -name '*.php' ! -name 'index.php' 2>/dev/null | sed "s|$ROOT/|    |" | head -20
echo "  -- .htaccess files present --"
find "$ROOT" -maxdepth 3 -name '.htaccess' 2>/dev/null | sed "s|$ROOT/|    |"
echo "  -- recently modified .htaccess content --"
for h in "$ROOT/.htaccess" "$ROOT/wp-content/.htaccess" "$ROOT/wp-content/uploads/.htaccess"; do
  [ -f "$h" ] && { echo "    --- $h ($(date -r "$h" '+%Y-%m-%d %H:%M')) ---"; grep -viE '^\s*#|^\s*$' "$h" | head -20 | sed 's/^/      /'; }
done

rm -f "$CNF"
echo ""
echo "###################################################################"
echo "# Forensics complete. Nothing was modified."
echo "###################################################################"
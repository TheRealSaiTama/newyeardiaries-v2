#!/usr/bin/env bash
# =============================================================================
#  NYD WordPress - close the door
#  Run:  bash ~/nyd-lockdown.sh
#
#  Proven entry vector (Apache domlogs, 11/Nov/2026):
#    182.77.70.220  UA "curl/8.16.0"
#      14:04  GET /wp-content/uploads/seo.zip, backup.zip
#      14:04  GET /wp-content/mu-plugins/  + site-helper{,-1,-core,-loader,-updater,-pro,-helper}
#      14:06  GET /wp-config.php and 14 backup variants (.bak .save .txt ~ .swp .orig .1 ...)
#      14:07  GET /.env, /backup.sql, /dump.sql, /db.sql, /wp-content/uploads/dump.sql
#      15:47  GET /wp-content/plugins/wp-helper-1a31f4/
#
#  Live exploit attempt in the same log:
#    130.94.20.64  POST /_ignition/execute-solution
#      -> WP Rocket 3.12.5.1 is vulnerable to CVE-2023-49493/49494/49495
#         (unauthenticated file write) and to several 2026 CVEs.
#
#  Live uploader webshell still on disk:
#    /.tmb/  (52.242.132.37 requested /.tmb/worksec.php twice)
#    Its base64-named file decodes to a write target path, which is how the
#    attacker wrote into wp-content/mu-plugins/ and the docroot.
#
#  This script removes those, blocks the IPs and the endpoint, then verifies.
# =============================================================================

set -u
cd "$HOME/public_html" 2>/dev/null || cd /home1/newyee9c/public_html || { echo "no public_html"; exit 1; }
ROOT=$(pwd); STAMP=$(date +%Y%m%d-%H%M%S); BK="$HOME/nyd-lockdown-$STAMP"; mkdir -p "$BK"
WP="wp --path=$ROOT --allow-root"
PASS=0; FAIL=0
ok()  { echo "  [ OK ] $1"; PASS=$((PASS+1)); }
bad() { echo "  [FAIL] $1"; FAIL=$((FAIL+1)); }
note(){ echo "         $1"; }

CFG=wp-config.php
getcfg() { local k="$1"; grep -oE "['\"]${k}['\"][[:space:]]*,[[:space:]]*['\"][^'\"]*['\"]" "$CFG" 2>/dev/null | head -1 | sed -E "s/.*,[[:space:]]*['\"]([^'\"]*)['\"][[:space:]]*\$/\1/"; }
DBU=$(getcfg DB_USER); DBP=$(getcfg DB_PASSWORD); DBN=$(getcfg DB_NAME); DBH=$(getcfg DB_HOST); DBH=${DBH:-localhost}
TBL=$(grep -oE '\$table_prefix[[:space:]]*=[[:space:]]*'"'"'[^'"'"']+'"'"'' "$CFG" 2>/dev/null | sed "s/.*'\([^']*\)'.*/\1/" | head -1); TBL=${TBL:-wp_}

echo "###################################################################"
echo "# NYD LOCKDOWN   $(date)"
echo "###################################################################"

# =========================================== 1. EVIDENCE + REMOVE .tmb
echo ""
echo "############ 1. THE .tmb UPLOADER WEBSHELL ############"
if [ -d "$ROOT/.tmb" ]; then
  echo "  --- full listing ---"
  find "$ROOT/.tmb" -type f -printf '      %s bytes  %TY-%Tm-%Td %TH:%TM  %p\n' 2>/dev/null | sed "s|$ROOT/|        |" | head -30
  cp -r "$ROOT/.tmb" "$BK/tmb-evidence" 2>/dev/null
  echo "  --- content of each file (first 1200 chars) ---"
  find "$ROOT/.tmb" -type f 2>/dev/null | head -10 | while read -r f; do
    echo "      --- ${f#$ROOT/} ---"
    head -c 1200 "$f" | sed 's/^/        /'; echo
  done
  echo "  --- decoding the base64 filename ---"
  find "$ROOT/.tmb" -type f 2>/dev/null | head -5 | while read -r f; do
    b=$(basename "$f")
    d=$(echo "$b" | sed 's/^l1_//' | cut -d. -f1)
    echo "      $(echo "$d" | base64 -d 2>/dev/null || echo '(decode failed)')   <- $b"
  done
  rm -rf "$ROOT/.tmb" && ok "DELETED the .tmb uploader webshell directory" || bad "could not delete .tmb"
else
  ok ".tmb already gone"
fi

# =========================================== 2. WP ROCKET IGNITION
echo ""
echo "############ 2. WP ROCKET /_ignition EXPLOIT ############"
$WP plugin get wp-rocket --field=version 2>/dev/null | sed 's/^/  wp-rocket version: /'
echo "  -- locating the _ignition folder --"
find "$ROOT" -maxdepth 4 -name '_ignition' -type d 2>/dev/null | sed "s|$ROOT/|    FOUND: |"
IGN=$(find "$ROOT" -maxdepth 4 -name '_ignition' -type d 2>/dev/null | head -1)
if [ -n "$IGN" ]; then
  echo "  -- contents --"; ls -la "$IGN" 2>/dev/null | sed 's/^/      /'
  cp -r "$IGN" "$BK/ignition-evidence" 2>/dev/null
  for f in "$IGN"/*.php; do [ -f "$f" ] && { echo "      --- ${f#$ROOT/} ---"; head -c 900 "$f" | sed 's/^/        /'; echo; }; done
  rm -rf "$IGN" && ok "DELETED the _ignition folder (exploit surface)" || bad "could not delete _ignition"
else
  note "_ignition folder not found at the usual paths"
fi

# =========================================== 3. REMAINING DROPS
echo ""
echo "############ 3. REMAINING MALWARE DROPS ############"
for pat in 'wp-helper' 'site-helper' 'wp_pf'; do
  for d in "$ROOT"/wp-content/plugins/${pat}-* "$ROOT"/wp-content/mu-plugins/${pat}-*; do
    [ -e "$d" ] || continue
    rm -rf "$d" && ok "removed ${d#$ROOT/}" || bad "could not remove $d"
  done
done
for z in "$ROOT"/wp-content/uploads/seo.zip "$ROOT"/wp-content/uploads/backup.zip "$ROOT"/wp-content/uploads/dump.sql; do
  [ -f "$z" ] && { cp "$z" "$BK/" 2>/dev/null; rm -f "$z" && ok "removed ${z#$ROOT/}"; }
done
echo "  -- any helper/site-helper left anywhere in the docroot --"
find "$ROOT" -maxdepth 5 \( -name '*wp-helper*' -o -name '*site-helper*' -o -name '_ignition' \) 2>/dev/null | sed "s|$ROOT/|    |" | head -20
echo "  -- mu-plugins content --"; ls -A "$ROOT/wp-content/mu-plugins" 2>/dev/null | sed 's/^/      /' || echo "      (empty)"

# =========================================== 4. WAF / IP BLOCK
echo ""
echo "############ 4. BLOCKING ATTACKERS AND EXPLOIT PATHS ############"
HT="$ROOT/.htaccess"
cp "$HT" "$BK/.htaccess.bak" 2>/dev/null

BLOCK='# --- NYD-LOCKDOWN (added 2026-11-11) ---
# Attacker IPs observed in Apache domlogs
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{REMOTE_ADDR} ^(182\.77\.70\.220|103\.59\.161\.168|52\.242\.132\.37|143\.244\.57\.121|130\.94\.20\.64|193\.187\.110\.205|45\.61\.184\.170|88\.161\.234\.109|85\.174\.180\.123|103\.49\.255\.81)$
RewriteRule .* - [F,L]
# Block the WP Rocket ignition RCE endpoint
RewriteRule ^_ignition(/.*)?$ - [F,L]
# Block leftover staging / uploader dirs
RewriteRule ^\.tmb(/.*)?$ - [F,L]
RewriteRule ^wp-content/(plugins|mu-plugins)/(wp-helper|site-helper) - [F,L]
# Block wp-config and backup variants from being served
RewriteRule ^(\.env|wp-config\.php|wp-config\.php\.(bak|save|txt|orig|dist|backup|old)|wp-config(-copy|-backup|-sample)?\.php|wp-config\.php~|wp-config\.php\.swp|backup\.sql|dump\.sql|db\.sql)$ - [F,L]
</IfModule>
'
if grep -q 'NYD-LOCKDOWN' "$HT" 2>/dev/null; then
  note "htaccess lockdown block already present"
else
  if grep -q 'RewriteRule \. /index\.php' "$HT" 2>/dev/null; then
    awk -v blk="$BLOCK" '{ if (!done && $0 ~ /RewriteRule \. \/index\.php/) { print blk; done=1 } print }' "$HT" > "$HT.tmp" && mv "$HT.tmp" "$HT"
    ok "lockdown rules inserted ABOVE the catch-all"
  else
    printf '%s\n' "$BLOCK" >> "$HT"
    ok "lockdown rules appended"
  fi
fi

# =========================================== 5. REAL DB BACKUP
echo ""
echo "############ 5. REAL DATABASE BACKUP ############"
CNF="$HOME/.nyd-l.cnf"; umask 077
printf '[client]\nhost=%s\nuser=%s\npassword=%s\n' "$DBH" "$DBU" "$DBP" > "$CNF"; chmod 600 "$CNF"
MYSQL="mysql --defaults-extra-file=$CNF -N -B $DBN"
PROBE=$($MYSQL -e "SELECT DATABASE();" 2>&1)
case "$PROBE" in
  *"$DBN"*) ok "mysql connected to $DBN" ;;
  *) bad "mysql connection failed: $PROBE" ;;
esac
DUMP=""
for d in mysqldump /usr/bin/mysqldump /usr/local/cpanel/3rdparty/bin/mysqldump /usr/local/mysql/bin/mysqldump; do
  command -v "$d" >/dev/null 2>&1 && { DUMP="$d"; break; }
done
if [ -n "$DUMP" ]; then
  "$DUMP" --defaults-extra-file="$CNF" --single-transaction --quick --routines --triggers "$DBN" 2>"$BK/dump.err" | gzip -1 > "$BK/db.sql.gz"
  SZ=$(stat -c%s "$BK/db.sql.gz" 2>/dev/null || echo 0)
  if [ "$SZ" -gt 100000 ]; then
    ok "database dumped -> $BK/db.sql.gz ($(du -h "$BK/db.sql.gz" | cut -f1))"
  else
    bad "dump too small ($SZ bytes) - see $BK/dump.err"; head -3 "$BK/dump.err" | sed 's/^/         /'
  fi
else
  bad "mysqldump not found"
fi
echo "  >>> restore: gunzip -c $BK/db.sql.gz | mysql --defaults-extra-file=$CNF $DBN"

# =========================================== 6. THE 6.9GB ZIP
echo ""
echo "############ 6. THE 6.9GB POST-INFECTION BACKUP ZIP ############"
ZIP="$HOME/public_html_backup_2026-07-30.zip"
if [ -f "$ZIP" ]; then
  note "size $(du -h "$ZIP" | cut -f1), contains wp-helper malware dated 2026-07-17+"
  note "it is a POST-infection snapshot, restoring it would bring the malware back"
  mv "$ZIP" "$BK/public_html_backup_2026-07-30.zip.INFECTED-DELETE-ME" 2>/dev/null \
    && ok "moved out of the account (still on disk, delete when you are ready)" \
    || note "could not move it"
  df -h "$HOME" | tail -1 | sed 's/^/      /'
fi

# =========================================== 7. FINAL VERIFY
echo ""
echo "############ 7. FINAL VERIFY ############"
$WP core verify-checksums 2>&1 | tail -1 | sed 's/^/  /'
$WP core verify-checksums 2>&1 | grep -q '^Success' && ok "wp core verifies clean" || bad "core verification issue"
M=$(grep -rl 'xlxjMiihfcPDc26Vy4U58h+CAeZP' "$ROOT" 2>/dev/null | grep -v '/nyd-' | head -5)
[ -z "$M" ] && ok "drainer payload marker: zero matches" || { bad "marker present:"; echo "$M" | sed "s|$ROOT/|         |"; }
[ -d "$ROOT/.tmb" ] && bad ".tmb still present" || ok ".tmb uploader webshell gone"
IGN2=$(find "$ROOT" -maxdepth 4 -name '_ignition' -type d 2>/dev/null | head -1)
[ -z "$IGN2" ] && ok "_ignition folder gone" || bad "_ignition still at $IGN2"
H=$(find "$ROOT/wp-content" -maxdepth 2 \( -name '*helper*' \) 2>/dev/null | head -5)
[ -z "$H" ] && ok "no helper plugin drops remain" || { bad "helper dirs remain"; echo "$H" | sed "s|$ROOT/|         |"; }
echo "  -- users --"; $WP user list --fields=ID,user_login,user_email,roles --format=csv 2>/dev/null | sed 's/^/    /'
echo "  -- xmlrpc --"; curl -s -o /dev/null -w "    HTTP %{http_code}\n" --max-time 15 "$ROOT/xmlrpc.php" 2>/dev/null
echo "  -- _ignition --"; curl -s -o /dev/null -w "    HTTP %{http_code}\n" --max-time 15 "$ROOT/_ignition/execute-solution" 2>/dev/null
echo "  -- .tmb --"; curl -s -o /dev/null -w "    HTTP %{http_code}\n" --max-time 15 "$ROOT/.tmb/worksec.php" 2>/dev/null

rm -f "$CNF"
echo ""
echo "###################################################################"
echo "# lockdown: passed=$PASS failed=$FAIL   evidence: $BK"
echo "###################################################################"
echo ""
echo "STILL MANUAL (important):"
echo "  1. cPanel -> MySQL Databases -> DELETE user 'newyee9c_neeraj'"
echo "  2. cPanel -> FTP Accounts -> DELETE 'neeraj@newyeardiaries.in'"
echo "  3. cPanel -> MySQL Databases -> rotate the main DB password"
echo "  4. wp-admin -> change the ADMIN password, enable 2FA"
echo "  5. wp-admin -> UPDATE WP Rocket to 3.23.5+ (3.12.5.1 is vulnerable to RCE)"
echo "     or deactivate WP Rocket - the block on /_ignition is a stopgap, not a fix"
echo "  6. BigRock -> Orders -> My Hosting -> Auto-Renew ON (domain + hosting)"
echo "  7. wp-admin -> install Wordfence"
echo "  8. Firewall the C2 addresses: 210.193.142.11, 44.14.240.4"
echo "  9. Delete the 6.9GB INFECTED zip from $BK once you have a fresh dump"
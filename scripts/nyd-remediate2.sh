#!/bin/bash
# =============================================================================
#  NYD WordPress - remediation pass 2
#  Run:  bash ~/nyd-remediate2.sh
#
#  Fixes what pass 1 missed:
#    - getcfg regex was broken (missing closing quote) -> DB creds resolved
#      empty, so mysqldump produced a 4 KB stub and the DB option scan was
#      a FALSE NEGATIVE because mysql never connected.
#      This pass hard-aborts if credentials do not resolve.
#    - the two rogue admin accounts were never deleted (same root cause)
#    - the REST user-enumeration block did not work: the rules were appended
#      AFTER the catch-all "RewriteRule . /index.php [L]", which matches first
#      and stops processing. Fixed by a must-use plugin (order independent)
#      plus correct .htaccess placement.
# =============================================================================

set -u
cd "$HOME/public_html" 2>/dev/null || cd /home1/newyee9c/public_html || { echo "cannot find public_html"; exit 1; }
ROOT=$(pwd); STAMP=$(date +%Y%m%d-%H%M%S); BK="$HOME/nyd-backup-$STAMP"; mkdir -p "$BK"
WP="wp --path=$ROOT --allow-root"
PASS=0; FAIL=0
ok()  { echo "  [ OK ] $1"; PASS=$((PASS+1)); }
bad() { echo "  [FAIL] $1"; FAIL=$((FAIL+1)); }
note(){ echo "         $1"; }

MARK='xlxjMiihfcPDc26Vy4U58h+CAeZP'
echo "###################################################################"
echo "# NYD remediation pass 2   root=$ROOT   backup=$BK"
echo "###################################################################"

# ---------------------------------------------------------------- CREDENTIALS
echo ""
echo "=== [0] CREDENTIALS (hard fail if not resolved) ==="
CFG=wp-config.php
getcfg() {
  local k="$1"
  grep -oE "['\"]${k}['\"][[:space:]]*,[[:space:]]*['\"][^'\"]*['\"]" "$CFG" 2>/dev/null \
    | head -1 | sed -E "s/.*,[[:space:]]*['\"]([^'\"]*)['\"][[:space:]]*\$/\1/"
}
DBU=$(getcfg DB_USER); DBP=$(getcfg DB_PASSWORD); DBN=$(getcfg DB_NAME); DBH=$(getcfg DB_HOST); DBH=${DBH:-localhost}
TBL=$(grep -oE '\$table_prefix[[:space:]]*=[[:space:]]*'"'"'[^'"'"']+'"'"'' "$CFG" 2>/dev/null | sed "s/.*'\([^']*\)'.*/\1/" | head -1)
TBL=${TBL:-wp_}

if [ -z "$DBU" ] || [ -z "$DBN" ]; then
  echo "  [FAIL] could not parse DB credentials from wp-config.php"
  echo "         DB_USER='$DBU' DB_NAME='$DBN' prefix='$TBL'"
  echo "         grep your own config:  grep -nE \"DB_(NAME|USER|PASSWORD|HOST)\" wp-config.php"
  echo "         then export them manually and re-run this script."
  exit 1
fi
echo "  DB_NAME=$DBN  DB_USER=$DBU  DB_HOST=$DBH  prefix=$TBL"

CNF="$HOME/.nyd-db.cnf"; umask 077
printf '[client]\nhost=%s\nuser=%s\npassword=%s\n' "$DBH" "$DBU" "$DBP" > "$CNF"; chmod 600 "$CNF"
MYSQL="mysql --defaults-extra-file=$CNF -N -B $DBN"

PROBE=$($MYSQL -e "SELECT DATABASE();" 2>&1)
case "$PROBE" in
  *"$DBN"*) ok "mysql connected to '$DBN'" ;;
  *) bad "mysql connection failed: $PROBE"; exit 1 ;;
esac
NTAB=$($MYSQL -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DBN';" 2>/dev/null)
note "tables in database: $NTAB"

# ---------------------------------------------------------------- BACKUP
echo ""
echo "=== [1] REAL BACKUP ==="
DUMP=""
for d in mysqldump /usr/bin/mysqldump /usr/local/cpanel/3rdparty/bin/mysqldump /usr/local/mysql/bin/mysqldump; do
  command -v "$d" >/dev/null 2>&1 && { DUMP="$d"; break; }
done
if [ -z "$DUMP" ]; then
  bad "mysqldump not found"
else
  "$DUMP" --defaults-extra-file="$CNF" --single-transaction --quick --routines --triggers "$DBN" 2>"$BK/dump.err" | gzip -1 > "$BK/db.sql.gz"
  SZ=$(du -h "$BK/db.sql.gz" | cut -f1)
  if [ "$(stat -c%s "$BK/db.sql.gz" 2>/dev/null || echo 0)" -gt 100000 ]; then
    ok "database dumped -> $BK/db.sql.gz ($SZ)"
  else
    bad "database dump looks too small ($SZ) - see $BK/dump.err"; head -3 "$BK/dump.err" | sed 's/^/         /'
  fi
fi
cp "$CFG" "$BK/wp-config.php.bak" 2>/dev/null && ok "wp-config.php backed up"
echo "  >>> restore: gunzip -c $BK/db.sql.gz | mysql --defaults-extra-file=$CNF $DBN"

# ---------------------------------------------------------------- DB SCAN
echo ""
echo "=== [2] DATABASE SCAN (now with working credentials) ==="
echo "  -- options carrying malware markers --"
EVIL=$($MYSQL -e "SELECT option_name FROM \`${TBL}options\` WHERE option_value LIKE '%${MARK}%' OR option_value LIKE '%wp_pf_11d0793d%' OR option_value LIKE '%mshta%' OR option_value LIKE '%base64_decode%' OR option_value LIKE '%wp-helper%' OR option_value LIKE '%site-helper%' OR option_value LIKE '%_ea_%' LIMIT 40;" 2>&1)
if echo "$EVIL" | grep -qiE 'ERROR'; then
  bad "query failed: $EVIL"
elif [ -z "$EVIL" ]; then
  ok "no malware-bearing options in ${TBL}options"
else
  echo "$EVIL" | while read -r o; do
    [ -n "$o" ] || continue
    $MYSQL -e "DELETE FROM \`${TBL}options\` WHERE option_name='${o}';" 2>/dev/null \
      && echo "  [ OK ] deleted option $o" || echo "  [FAIL] $o"
  done
fi

echo "  -- widget / site options of interest --"
$MYSQL -e "SELECT option_name, LEFT(option_value,100) FROM \`${TBL}options\` WHERE option_name IN ('widget_custom_html','widget_block','site_url','home','active_plugins','template','stylesheet') OR option_name LIKE '%ea_%' OR option_name LIKE '%wpm%' OR option_name LIKE '%helper%' LIMIT 30;" 2>&1 | sed 's/^/    /'

echo "  -- MySQL users and their grants on this DB --"
$MYSQL -e "SELECT user,host FROM mysql.user WHERE user NOT IN ('','mysql.sys','mysql.session','mysql.infoschema');" 2>&1 | head -20 | while read -r u h; do
  [ -n "$u" ] || continue
  g=$($MYSQL -e "SHOW GRANTS FOR '$u'@'$h';" 2>&1 | tr '\n' ' ')
  case "$g" in *ERROR*) echo "    $u@$h -> (cannot read grants: needs higher privilege)" ;;
  *) case "$g" in *"$DBN"*) echo "    ${RED}*** $u@$h  HAS ACCESS TO $DBN ***${RST}  ${g:0:90}" ;; *) echo "    $u@$h -> ${g:0:90}" ;; esac ;; esac
done

# ---------------------------------------------------------------- USERS
echo ""
echo "=== [3] USER FORENSICS ==="
$MYSQL -e "SELECT u.ID,u.user_login,u.user_email,u.user_registered FROM \`${TBL}users\` u ORDER BY u.ID;" 2>&1 | while read -r id login email reg; do
  [ -n "$id" ] || continue
  posts=$($WP post list --author="$id" --format=count --allow-root 2>/dev/null)
  lastlog=$($WP user meta get "$id" last_login --allow-root 2>/dev/null || echo "-")
  sess=$($WP user session list "$id" --format=csv --allow-root 2>/dev/null | wc -l)
  caps=$($MYSQL -e "SELECT meta_value FROM \`${TBL}usermeta\` WHERE user_id=$id AND meta_key='${TBL}capabilities';" 2>/dev/null)
  echo "    ID=$id  login=$login"
  echo "           email=$email"
  echo "           registered=$reg   posts=$posts   last_login=$lastlog   session_rows=$sess"
  echo "           caps=$caps"
done

echo ""
echo "  -- deleting clearly malware-created account --"
for login in wpm_f7cd8384; do
  uid=$($MYSQL -e "SELECT ID FROM \`${TBL}users\` WHERE user_login='$login';" 2>/dev/null)
  if [ -n "$uid" ]; then
    $WP user delete "$uid" --yes --reassign=1 --allow-root >/dev/null 2>&1 \
      && ok "deleted user $login (ID $uid)" || bad "could not delete $login"
  else
    note "$login not found"
  fi
done

echo "  -- remaining users --"
$WP user list --fields=ID,user_login,user_email,roles --format=csv 2>/dev/null | sed 's/^/    /'

# ---------------------------------------------------------------- REST BLOCK
echo ""
echo "=== [4] FIXING REST USER-ENUMERATION BLOCK ==="
# a) must-use plugin: works regardless of .htaccess rewrite order
MU="$ROOT/wp-content/mu-plugins/nyd-security-hardening.php"
cat > "$MU" <<'PHP'
<?php
/**
 * Plugin Name: NYD Security Hardening
 * Description: Blocks anonymous REST user enumeration and hides author slugs.
 * Version: 1.0
 */
add_filter( 'rest_endpoints', function ( $endpoints ) {
	if ( ! is_user_logged_in() ) {
		unset( $endpoints['/wp/v2/users'] );
		unset( $endpoints['/wp/v2/users/(?P<id>[\d]+)'] );
	}
	return $endpoints;
}, 99 );

add_filter( 'rest_pre_dispatch', function ( $result ) {
	if ( ! empty( $result ) ) {
		return $result;
	}
	if ( is_user_logged_in() ) {
		return $result;
	}
	$uri = isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '';
	if ( preg_match( '#/wp-json/wp/v2/users#', $uri ) || preg_match( '#rest_route=/wp/v2/users#', $uri ) ) {
		return new WP_Error( 'rest_forbidden', 'Forbidden', array( 'status' => 403 ) );
	}
	return $result;
}, 99 );

// hide author archives and user name from oEmbed / RSS
add_filter( 'the_author_meta_link', function ( $link ) {
	return is_admin() ? $link : '';
}, 99 );
PHP
if [ -f "$MU" ]; then ok "security mu-plugin written -> ${MU#$ROOT/}"; else bad "could not write mu-plugin"; fi
chmod 644 "$MU" 2>/dev/null

# b) .htaccess: put the rewrite rules BEFORE the catch-all
HT="$ROOT/.htaccess"
cp "$HT" "$BK/.htaccess.bak" 2>/dev/null
if ! grep -q 'NYD-REST-BLOCK' "$HT" 2>/dev/null; then
  BLOCK='# --- NYD-REST-BLOCK (must stay above the catch-all rule) ---
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule ^wp-json/wp/v2/users(/.*)?$ - [F,L]
RewriteRule ^index\.php\?rest_route=/wp/v2/users(/.*)?$ - [F,L]
</IfModule>
'
  # insert before the first "RewriteRule . /index.php" line, else append
  if grep -q 'RewriteRule \. /index\.php' "$HT" 2>/dev/null; then
    awk -v blk="$BLOCK" '{ if (!done && $0 ~ /RewriteRule \. \/index\.php/) { print blk; done=1 } print }' "$HT" > "$HT.tmp" && mv "$HT.tmp" "$HT"
    ok "REST rewrite rule inserted above the catch-all"
  else
    printf '%s\n' "$BLOCK" >> "$HT"
    ok "REST rewrite rule appended (no catch-all found)"
  fi
else
  note "htaccess REST block already present"
fi

# xmlrpc: make sure it is also above the catch-all
if ! grep -q 'NYD-XMLRPC-BLOCK' "$HT" 2>/dev/null; then
  XB='# --- NYD-XMLRPC-BLOCK ---
<Files "xmlrpc.php">
Order Allow,Deny
Deny from all
</Files>
'
  if grep -q 'RewriteRule \. /index\.php' "$HT" 2>/dev/null; then
    awk -v blk="$XB" '{ if (!done && $0 ~ /RewriteRule \. \/index\.php/) { print blk; done=1 } print }' "$HT" > "$HT.tmp" && mv "$HT.tmp" "$HT"
    ok "xmlrpc block inserted above the catch-all"
  else
    printf '%s\n' "$XB" >> "$HT"
    ok "xmlrpc block appended"
  fi
fi

# c) purge caches so the new rules take effect immediately
rm -rf "$ROOT/wp-content/cache/wp-rocket" "$ROOT/wp-content/cache/min" 2>/dev/null
$WP cache flush --allow-root --quiet 2>/dev/null
ok "caches purged"

# ---------------------------------------------------------------- VERIFY
echo ""
echo "=== [5] VERIFY ==="
LEFT=$(grep -rl "$MARK" "$ROOT" 2>/dev/null | grep -v '/nyd-backup' | head -20)
[ -z "$LEFT" ] && ok "payload marker: ZERO matches in docroot" || { bad "marker still present:"; echo "$LEFT" | sed 's/^/         /'; }
CNT=$($MYSQL -e "SELECT COUNT(*) FROM \`${TBL}options\` WHERE option_value LIKE '%${MARK}%' OR option_value LIKE '%wp_pf_11d0793d%' OR option_value LIKE '%mshta%' OR option_value LIKE '%wp-helper%';" 2>&1)
case "$CNT" in
  0) ok "DB options with malware markers: 0" ;;
  *) bad "DB options with malware markers: $CNT" ;;
esac
echo "  -- final users --"; $WP user list --fields=ID,user_login,user_email,roles --format=csv 2>/dev/null | sed 's/^/    /'
echo "  -- mu-plugins --"; ls -A "$ROOT/wp-content/mu-plugins" 2>/dev/null | sed 's/^/    /'
echo "  -- cron (non-standard hooks only) --"
$WP cron event list --format=csv --fields=hook 2>/dev/null | tail -n +2 | tr -d '"' | grep -viE 'rocket|woocommerce|wc_|rank_math|jetpack|imagify|updraft|mc4wp|elementor|wpforms|wffn|yith|monster|ai1wm|wpseo|wp_|delete_expired|sbi_|recovery_mode|jp_|redirection|google|action_scheduler' | sed 's/^/    /' || true

rm -f "$CNF"
echo ""
echo "###################################################################"
echo "# pass2: passed=$PASS failed=$FAIL   backup=$BK"
echo "###################################################################"
echo ""
echo "STILL MANUAL (cPanel / BigRock UI):"
echo "  1. cPanel -> MySQL Databases -> delete user 'newyee9c_neeraj'"
echo "  2. cPanel -> FTP Accounts -> delete 'neeraj@newyeardiaries.in'"
echo "  3. cPanel -> MySQL Databases -> change the main DB password"
echo "  4. BigRock -> Orders -> My Hosting -> Auto-Renew ON (domain + hosting)"
echo "  5. wp-admin -> Plugins -> install Wordfence; Users -> admin -> 2FA ON"
echo "  6. Decide on 'cutredblackfox' (ID 2) after reading the forensics above"
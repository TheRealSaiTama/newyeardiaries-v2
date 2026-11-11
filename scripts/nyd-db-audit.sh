#!/bin/bash
# NYD WordPress - database audit (READ ONLY)
# Auto-detects the real table prefix, shows errors instead of swallowing them.
set -u
cd ~/public_html 2>/dev/null || cd "$HOME/public_html" || { echo "cannot cd to public_html"; exit 1; }

CFG=wp-config.php
[ -f "$CFG" ] || { echo "wp-config.php not found in $(pwd)"; exit 1; }

# ---- extract config -------------------------------------------------------
getcfg() {
  grep -oE "$1[[:space:]]*,[[:space:]]*'[^']*'" "$CFG" 2>/dev/null \
    | sed "s/.*,[[:space:]]*'\([^']*\)'.*/\1/" | head -1
}
U=$(getcfg DB_USER)
P=$(getcfg DB_PASSWORD)
N=$(getcfg DB_NAME)
H=$(getcfg DB_HOST); H=${H:-localhost}
TBL=$(grep -oE '\$table_prefix[[:space:]]*=[[:space:]]*'"'"'[^'"'"']+'"'"'' "$CFG" 2>/dev/null \
      | sed "s/.*'\([^']*\)'.*/\1/" | head -1)
TBL=${TBL:-wp_}

echo "DB name : $N"
echo "DB user : $U"
echo "DB host : $H"
echo "PREFIX  : [$TBL]"
echo "========================================================================="

CNF="$HOME/.nyd-db.cnf"
umask 077
printf '[client]\nhost=%s\nuser=%s\npassword=%s\n' "$H" "$U" "$P" > "$CNF"
chmod 600 "$CNF"

run() {
  mysql --defaults-extra-file="$CNF" -N -B "$N" -e "$1" 2>&1
}

echo ""
echo "=== 0. connectivity ==="
run "SELECT 'CONNECTED' AS status;"

echo ""
echo "=== 1. all tables in the database ==="
run "SHOW TABLES;" | head -40

echo ""
echo "=== 2. options table row count ==="
run "SELECT COUNT(*) FROM \`${TBL}options\`;"

echo ""
echo "=== 3. OPTIONS CONTAINING A PAYLOAD MARKER ==="
run "SELECT option_name, LEFT(option_value,160) FROM \`${TBL}options\`
     WHERE option_value LIKE '%xlxjMiihfcPDc26Vy4U58h+CAeZP%'
        OR option_value LIKE '%wp_pf_11d0793d%'
        OR option_value LIKE '%mshta%'
        OR option_value LIKE '%base64_decode%'
        OR option_value LIKE '%wp-helper%'
        OR option_value LIKE '%wp_pf_%'
     LIMIT 30;"

echo ""
echo "=== 4. widget / site option names worth inspecting ==="
run "SELECT option_name, LEFT(option_value,120) FROM \`${TBL}options\`
     WHERE option_name IN ('widget_custom_html','widget_block','widget_text','site_url','home','active_plugins','template','stylesheet')
        OR option_name LIKE '%ea_%' OR option_name LIKE '%wpm%' OR option_name LIKE '%helper%'
     LIMIT 30;"

echo ""
echo "=== 5. active_plugins - rogue references ==="
run "SELECT option_value FROM \`${TBL}options\` WHERE option_name='active_plugins';" \
  | tr ';' '\n' | sed 's/^ *//' | head -60

echo ""
echo "=== 6. wp-cron: scheduled hook names (self-heal trigger lives here) ==="
run "SELECT option_value FROM \`${TBL}options\` WHERE option_name='cron';" \
  | grep -oE 's:[0-9]+:"[A-Za-z0-9_]+"' | sed 's/.*:"//;s/"//' | sort -u | head -60

echo ""
echo "=== 7. cron: recurring hashes (dropper signatures) ==="
run "SELECT option_value FROM \`${TBL}options\` WHERE option_name='cron';" \
  | grep -oE '"[a-f0-9]{30,}"' | sort -u | head -30

echo ""
echo "=== 8. cron array entry count ==="
run "SELECT LENGTH(option_value) FROM \`${TBL}options\` WHERE option_name='cron';"

echo ""
echo "=== 9. ALL users ==="
run "SELECT u.ID,u.user_login,u.user_email,u.user_registered FROM \`${TBL}users\` u ORDER BY u.ID;"

echo ""
echo "=== 10. administrators (capabilities) ==="
run "SELECT u.ID,u.user_login,u.user_email,m.meta_value FROM \`${TBL}users\` u
     JOIN \`${TBL}usermeta\` m ON m.user_id=u.ID AND m.meta_key='${TBL}capabilities'
     WHERE m.meta_value LIKE '%administrator%';"

echo ""
echo "=== 11. usermeta rows that look malware-created (wpm_ / ea_ / audit@) ==="
run "SELECT user_id,meta_key,LEFT(meta_value,120) FROM \`${TBL}usermeta\`
     WHERE user_id NOT IN (SELECT ID FROM \`${TBL}users\`) OR meta_value LIKE '%wpm_%' OR meta_value LIKE '%audit@%'
     LIMIT 25;"

echo ""
echo "=== 12. transients + recent security-relevant options ==="
run "SELECT option_name,LEFT(option_value,100) FROM \`${TBL}options\`
     WHERE option_name LIKE '%transient%' AND option_name LIKE '%timeout%'
     LIMIT 15;"

rm -f "$CNF"
echo ""
echo "========================================================================="
echo "Audit complete (read-only, nothing was modified)."

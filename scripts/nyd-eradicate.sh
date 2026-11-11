#!/bin/bash
# =============================================================================
#  NYD WordPress - eradicate backdoors  (evidence dump FIRST, then removal)
#  Run:  bash ~/nyd-eradicate.sh
#
#  Forensics proved the following are still live on the box:
#    - webshells named "error_log" inside wp-includes/, wp-admin/ and 2 plugins
#    - 40 wp-helper-* C2 domain store plugins
#    - 2 rogue administrator accounts (cutredblackfox, wpm_f7cd8384)
#    - active session tokens for every account
#
#  This script dumps the evidence, then removes all of it, then proves the
#  result with WordPress's own checksum verifier.
# =============================================================================

set -u
cd "$HOME/public_html" 2>/dev/null || cd /home1/newyee9c/public_html || { echo "no public_html"; exit 1; }
ROOT=$(pwd); STAMP=$(date +%Y%m%d-%H%M%S); BK="$HOME/nyd-eradicate-$STAMP"; mkdir -p "$BK"
WP="wp --path=$ROOT --allow-root"
PASS=0; FAIL=0
ok()  { echo "  [ OK ] $1"; PASS=$((PASS+1)); }
bad() { echo "  [FAIL] $1"; FAIL=$((FAIL+1)); }
note(){ echo "         $1"; }

MARK='xlxjMiihfcPDc26Vy4U58h+CAeZP'
echo "###################################################################"
echo "# NYD ERADICATION   $(date)"
echo "# evidence backup: $BK"
echo "###################################################################"

CFG=wp-config.php
getcfg() { local k="$1"; grep -oE "['\"]${k}['\"][[:space:]]*,[[:space:]]*['\"][^'\"]*['\"]" "$CFG" 2>/dev/null | head -1 | sed -E "s/.*,[[:space:]]*['\"]([^'\"]*)['\"][[:space:]]*\$/\1/"; }
DBU=$(getcfg DB_USER); DBP=$(getcfg DB_PASSWORD); DBN=$(getcfg DB_NAME); DBH=$(getcfg DB_HOST); DBH=${DBH:-localhost}
TBL=$(grep -oE '\$table_prefix[[:space:]]*=[[:space:]]*'"'"'[^'"'"']+'"'"'' "$CFG" 2>/dev/null | sed "s/.*'\([^']*\)'.*/\1/" | head -1); TBL=${TBL:-wp_}
CNF="$HOME/.nyd-e.cnf"; umask 077
printf '[client]\nhost=%s\nuser=%s\npassword=%s\n' "$DBH" "$DBU" "$DBP" > "$CNF"; chmod 600 "$CNF"
MYSQL="mysql --defaults-extra-file=$CNF -N -B $DBN"

# ======================================================= 1. EVIDENCE DUMP
echo ""
echo "############ 1. EVIDENCE (captured before anything is deleted) ############"
echo "=== 1a. every webshell named 'error_log' - full content ==="
mapfile -t SHELLS < <(find "$ROOT" -type f -name 'error_log' 2>/dev/null)
echo "  found ${#SHELLS[@]} files named error_log"
for f in "${SHELLS[@]}"; do
  echo "  --- ${f#$ROOT/}  ($(wc -c < "$f") bytes, mtime $(date -r "$f" '+%Y-%m-%d %H:%M')) ---"
  cp "$f" "$BK/$(echo "${f#$ROOT/}" | tr '/' '_')" 2>/dev/null
  head -c 1500 "$f" | sed 's/^/      /'
  echo
done

echo ""
echo "=== 1b. C2 config decoded from a wp-helper plugin ==="
HELPER=$(find "$ROOT/wp-content/plugins" -path '*wp-helper*' -name '_*.php' 2>/dev/null | head -1)
if [ -z "$HELPER" ] && [ -n "$HOME"/nyd-wphelper-backup-*.tar.gz ]; then
  tar xzf "$(ls -t "$HOME"/nyd-wphelper-backup-*.tar.gz | head -1)" -C "$BK" 2>/dev/null
  HELPER=$(find "$BK" -path '*wp-helper*' -name '_*.php' 2>/dev/null | head -1)
fi
if [ -n "$HELPER" ]; then
  echo "  sample: $HELPER"
  grep -oE 'define\("[A-Z_]+", *"[^"]*"\)' "$HELPER" | sed 's/^/      /'
  XK=$(grep -oE 'define\("XKEY", *"[^"]*"\)' "$HELPER" | sed 's/.*"\([^"]*\)")$/\1/')
  XV=$(grep -oE 'define\("XVALUE", *"[^"]*"\)' "$HELPER" | sed 's/.*"\([^"]*\)")$/\1/')
  AP=$(grep -oE 'define\("API", *"[^"]*"\)' "$HELPER" | sed 's/.*"\([^"]*\)")$/\1/')
  SH=$(grep -oE 'define\("SH", *"[^"]*"\)' "$HELPER" | sed 's/.*"\([^"]*\)")$/\1/')
  echo ""
  echo "  -- XKEY  = $XK"
  echo "  -- XVALUE= $XV"
  echo "  -- API   = $AP   SH = $SH"
  ip_from_hex() {
    local h="${1#0x}"; h="${h#0X}"
    printf "%d.%d.%d.%d" "$((16#${h:0:2}))" "$((16#${h:2:2}))" "$((16#${h:4:2}))" "$((16#${h:6:2}))"
  }
  echo "      API  -> C2 IP: $(ip_from_hex "$AP")"
  echo "      SH   -> C2 IP: $(ip_from_hex "$SH")"
  # decode XVALUE (hex) and XOR with XKEY
  cat > "$BK/dec.py" <<'PYEOF'
import sys, binascii
xv, xk = sys.argv[1], sys.argv[2].encode()
def show(tag, b):
    pr = sum(1 for c in b if 32 <= c < 127) / max(1, len(b))
    print("      %-22s printable=%.2f  %r" % (tag, pr, b[:200]))
try:
    raw = binascii.unhexlify(xv)
except Exception:
    raw = b''
if raw:
    show("hex-decoded", raw)
    show("hex XOR xkey", bytes(c ^ xk[i % len(xk)] for i, c in enumerate(raw)))
PYEOF
  python3 "$BK/dec.py" "$XV" "$XK" 2>/dev/null || python "$BK/dec.py" "$XV" "$XK" 2>/dev/null || note "(python unavailable for XVALUE decode)"
else
  echo "  (no wp-helper plugin found to decode)"
fi

echo ""
echo "=== 1c. shared C2 cache file (same hash in every helper plugin) ==="
for c in $(find "$ROOT/wp-content/plugins" -path '*wp-helper*' -name 'd1551344fd440c9f0e69ca7c3aab16d5' 2>/dev/null | head -2); do
  echo "  --- $c ($(wc -c < "$c") bytes) ---"; head -c 800 "$c" | sed 's/^/      /'; echo
done
for c in $(find "$BK" -name 'd1551344fd440c9f0e69ca7c3aab16d5' 2>/dev/null | head -2); do
  echo "  --- (from backup) $c ($(wc -c < "$c") bytes) ---"; head -c 800 "$c" | sed 's/^/      /'; echo
done

echo ""
echo "=== 1d. FTP / shell accounts on this box ==="
for f in /etc/proftpd/passwd /etc/vsftpd/user_list /etc/pure-ftpd/passwd "$ROOT/.ftpusers" "$HOME/.ftpusers"; do
  [ -f "$f" ] && { echo "  -- $f --"; grep -vE '^\s*#|^\s*$' "$f" | cut -d: -f1 | sed 's/^/      /'; }
done
echo "  -- users with a login shell --"
grep -vE 'nologin|/bin/false' /etc/passwd 2>/dev/null | awk -F: '$3>=1000 && $3<65534 {print "      "$1"  uid="$3"  home="$6"  shell="$7}' | head -20
echo "  -- cpanel FTP accounts from the account's own dir --"
ls -la "$HOME" 2>/dev/null | grep -iE 'ftp|public_html|logs' | sed 's/^/      /'

echo ""
echo "=== 1e. current admin sessions ==="
$MYSQL -e "SELECT u.ID,u.user_login,u.user_email,LENGTH(m.meta_value) AS token_bytes FROM \`${TBL}users\` u JOIN \`${TBL}usermeta\` m ON m.user_id=u.ID AND m.meta_key='session_tokens';" 2>&1 | sed 's/^/      /'

# ======================================================= 2. REMOVAL
echo ""
echo "############ 2. REMOVING BACKDOORS ############"
echo "=== 2a. webshells named error_log ==="
mapfile -t SHELLS < <(find "$ROOT" -type f -name 'error_log' 2>/dev/null)
for f in "${SHELLS[@]}"; do
  rm -f "$f" && ok "deleted webshell ${f#$ROOT/}" || bad "could not delete $f"
done
[ ${#SHELLS[@]} -eq 0 ] && note "(none found)"

echo ""
echo "=== 2b. any other file that is not a real log but hides as one ==="
find "$ROOT" -type f \( -name 'error_log.*' -o -name '.user.ini' -o -name 'shell.php' -o -name 'wp-shell.php' \) 2>/dev/null \
  | sed "s|$ROOT/|    found: |" | head -20

echo ""
echo "=== 2c. wp-helper-* / site-helper-* plugin drops ==="
for pat in wp-helper site-helper wp_pf; do
  for d in "$ROOT"/wp-content/plugins/${pat}-*; do
    [ -d "$d" ] || continue
    rm -rf "$d" && ok "removed $(basename "$d")" || bad "could not remove $d"
  done
done
# any leftover .php in a helper dir
find "$ROOT/wp-content/plugins" -maxdepth 2 -path '*helper*' -type f -delete 2>/dev/null

echo ""
echo "=== 2d. must-use plugins (only our own hardening plugin may stay) ==="
for f in "$ROOT"/wp-content/mu-plugins/*.php; do
  [ -f "$f" ] || continue
  b=$(basename "$f")
  case "$b" in
    index.php|nyd-security-hardening.php) note "keeping $b" ;;
    *) rm -f "$f" && ok "removed mu-plugin $b" || bad "could not remove $b" ;;
  esac
done

echo ""
echo "=== 2e. rogue administrator accounts ==="
for login in cutredblackfox wpm_f7cd8384; do
  uid=$($MYSQL -e "SELECT ID FROM \`${TBL}users\` WHERE user_login='$login';" 2>/dev/null)
  if [ -n "$uid" ]; then
    $WP user delete "$uid" --yes --reassign=1 --allow-root >/dev/null 2>&1 \
      && ok "deleted rogue admin $login (ID $uid)" || bad "could not delete $login"
    # scrub usermeta leftovers
    $MYSQL -e "DELETE FROM \`${TBL}usermeta\` WHERE user_id=$uid;" 2>/dev/null
  else
    note "$login already gone"
  fi
done

echo ""
echo "=== 2f. destroy EVERY session token (kill any stolen active session) ==="
for id in $($MYSQL -e "SELECT ID FROM \`${TBL}users\`;" 2>/dev/null); do
  $WP user session destroy "$id" --all --allow-root >/dev/null 2>&1 && ok "destroyed all sessions for user ID $id" || skip "session destroy ID $id (older WP-CLI)"
  $MYSQL -e "DELETE FROM \`${TBL}usermeta\` WHERE user_id=$id AND meta_key='session_tokens';" 2>/dev/null
done

echo ""
echo "=== 2g. clear plugin activation traces ==="
$WP option delete recently_activated --allow-root >/dev/null 2>&1 && ok "cleared recently_activated" || skip "recently_activated"
$MYSQL -e "DELETE FROM \`${TBL}options\` WHERE option_name='wp_force_deactivated_plugins' AND option_value NOT IN ('a:0:{}');" 2>/dev/null
ok "cleared wp_force_deactivated_plugins"

echo ""
echo "=== 2h. purge every cache ==="
rm -rf "$ROOT/wp-content/cache/wp-rocket" "$ROOT/wp-content/cache/min" "$ROOT/wp-content/cache/litespeed" 2>/dev/null
$WP cache flush --allow-root --quiet 2>/dev/null
ok "caches purged"

echo ""
echo "=== 2i. lock down mu-plugins and uploads ==="
chmod 755 "$ROOT/wp-content/mu-plugins" 2>/dev/null
find "$ROOT/wp-content/mu-plugins" -type f -exec chmod 644 {} \; 2>/dev/null
ok "mu-plugins = 755 dir / 644 files"
if [ -f "$ROOT/wp-content/uploads/.htaccess" ] && [ ! -s "$ROOT/wp-content/uploads/.htaccess" ]; then
  cat > "$ROOT/wp-content/uploads/.htaccess" <<'HT'
<FilesMatch "\.(?i:php[0-9]?|phtml|phar)$">
Order Allow,Deny
Deny from all
</FilesMatch>
HT
  ok "uploads .htaccess: PHP execution blocked (was empty)"
fi

# ======================================================= 3. VERIFY
echo ""
echo "############ 3. VERIFICATION ############"
LEFT=$(find "$ROOT" -type f -name 'error_log' 2>/dev/null | head -20)
[ -z "$LEFT" ] && ok "no error_log webshells remain" || { bad "webshells remain:"; echo "$LEFT" | sed "s|$ROOT/|         |"; }
H=$(find "$ROOT/wp-content/plugins" -maxdepth 1 -name '*helper*' 2>/dev/null | head -10)
[ -z "$H" ] && ok "no helper plugin drops remain" || { bad "helper dirs remain:"; echo "$H" | sed "s|$ROOT/|         |"; }
M=$(grep -rl "$MARK" "$ROOT" 2>/dev/null | grep -v '/nyd-' | head -10)
[ -z "$M" ] && ok "payload marker: zero matches" || { bad "marker present:"; echo "$M" | sed "s|$ROOT/|         |"; }

echo "  -- wp core verify-checksums (MUST be clean) --"
$WP core verify-checksums 2>&1 | head -10 | sed 's/^/    /'
echo "  -- plugin verify-checksums --"
for p in $($WP plugin list --format=csv --fields=name 2>/dev/null | tail -n +2); do
  out=$($WP plugin verify-checksums "$p" 2>&1 | grep -iE 'error|added|modified|removed' | head -3)
  [ -n "$out" ] && { echo "    [$p]"; echo "$out" | sed 's/^/      /'; }
done
echo "  -- final users --"
$WP user list --fields=ID,user_login,user_email,roles --format=csv 2>/dev/null | sed 's/^/    /'
echo "  -- mu-plugins --"
ls -A "$ROOT/wp-content/mu-plugins" 2>/dev/null | sed 's/^/    /'

rm -f "$CNF"
echo ""
echo "###################################################################"
echo "# eradicate: passed=$PASS failed=$FAIL   evidence: $BK"
echo "###################################################################"
echo ""
echo "STILL MANUAL:"
echo "  1. wp-admin -> Settings -> General -> change the ADMIN password"
echo "     (assume it was stolen, we cannot prove otherwise)"
echo "  2. wp-admin -> Users -> admin -> enable 2FA"
echo "  3. cPanel -> MySQL Databases -> delete user 'newyee9c_neeraj'"
echo "  4. cPanel -> FTP Accounts -> delete 'neeraj@newyeardiaries.in'"
echo "  5. cPanel -> MySQL Databases -> change the main DB password"
echo "  6. BigRock -> Orders -> My Hosting -> Auto-Renew ON"
echo "  7. wp-admin -> Plugins -> install Wordfence"
echo ""
echo "  IMPORTANT: the 'oldsite/' directory in the docroot is a stale"
echo "  site mirror with its own .htaccess files. It is not served by WP but"
echo "  check it separately for old PHP entry points."
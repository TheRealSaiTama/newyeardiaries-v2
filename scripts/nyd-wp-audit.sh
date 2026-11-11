#!/bin/bash
# =============================================================================
#  NYD WordPress - malware + access audit  (READ ONLY, changes nothing)
#  Run this in cPanel -> Terminal (or SSH) as the account that owns the site.
#
#  Answers: what is Neeraj changing that keeps reintroducing the fake-captcha
#  malware, and who has write access to the paths where it lives.
#
#  Usage:  bash nyd-wp-audit.sh  [path-to-wordpress-root]
#  Default path tries the usual public_html locations automatically.
# =============================================================================

set -u
RED=$'\033[31m'; YEL=$'\033[33m'; GRN=$'\033[32m'; CYA=$'\033[36m'; RST=$'\033[0m'
LINE="-------------------------------------------------------------"

find_root() {
  local explicit="${1:-}"
  if [ -n "$explicit" ] && [ -f "$explicit/wp-config.php" ]; then echo "$explicit"; return 0; fi
  # standard shared-hosting layouts (jailshell-safe: no globs, plain paths)
  for d in "$HOME/public_html" "$HOME/../public_html" \
           "$HOME/www/newyeardiaries.in" "$HOME/newyeardiaries.in" \
           "$HOME/domains/newyeardiaries.in" "$HOME/domains/newyeardiaries.in/public_html" \
           "/home1/$USER/public_html" "/home2/$USER/public_html" "/home3/$USER/public_html" \
           /var/www/html /usr/local/apache/htdocs; do
    [ -f "$d/wp-config.php" ] && { echo "$d"; return 0; }
  done
  # bounded scan under home (jailshell may cap depth, so try shallow first)
  local found
  for depth in 2 3 4 5; do
    found=$(find "$HOME" -maxdepth "$depth" -name wp-config.php 2>/dev/null | head -1)
    if [ -n "$found" ]; then dirname "$found"; return 0; fi
  done
  # last resort: direct listing of likely dirs
  for d in "$HOME"/*/ "$HOME"/*/*/; do
    [ -f "${d}wp-config.php" ] && { echo "${d%/}"; return 0; }
  done
  return 1
}

ROOT=$(find_root "${1:-}")
if [ -z "$ROOT" ]; then
  echo "${RED}Could not find wp-config.php.${RST}"
  echo "Home dir is: $HOME"
  echo ""
  echo "Run this and paste the output:"
  echo "  ls -la $HOME"
  echo "  find $HOME -maxdepth 3 -name wp-config.php 2>/dev/null"
  echo "Then re-run with the folder that contains wp-config.php:"
  echo "  bash ~/nyd-audit.sh /path/to/that/folder"
  exit 1
fi
echo "${CYA}WordPress root: $ROOT${RST}"
echo "$LINE"

# ---------------------------------------------------------------- 1. RECENT CHANGES
echo ""
echo "${CYA}[1] PHP files modified in last 45 days (wp-content + themes)${RST}"
echo "$LINE"
find "$ROOT/wp-content" "$ROOT/wp-content/themes" -type f -name '*.php' -mtime -45 2>/dev/null \
  | grep -v '/cache/' | head -40 | while read -r f; do
      printf "  %-58s  %s\n" "${f#$ROOT/}" "$(date -r "$f" '+%Y-%m-%d %H:%M' 2>/dev/null)"
  done
CNT=$(find "$ROOT/wp-content" -type f -name '*.php' -mtime -45 2>/dev/null | grep -vc '/cache/' || echo 0)
echo "  (total recent .php files: $CNT)"

# ---------------------------------------------------------------- 2. MUST-USE PLUGINS
echo ""
echo "${CYA}[2] must-use plugins (auto-load every request - classic persistence)${RST}"
echo "$LINE"
if [ -d "$ROOT/wp-content/mu-plugins" ]; then
  ls -la "$ROOT/wp-content/mu-plugins" 2>/dev/null | sed 's/^/  /'
  for f in "$ROOT/wp-content/mu-plugins"/*.php; do
    [ -f "$f" ] || continue
    b=$(basename "$f")
    case "$b" in index.php) continue;; esac
    echo "  --> $b"
    grep -oiE 'eval\(|base64_decode|gzinflate|str_rot13|assert\(|preg_replace\(.{0,40}/e|curl_exec|file_get_contents\(.http|create_function' "$f" 2>/dev/null | sort -u | sed 's/^/        /'
  done
else
  echo "  (no mu-plugins directory)"
fi

# ---------------------------------------------------------------- 3. MALWARE STRINGS
echo ""
echo "${CYA}[3] Payload + malware signatures inside PHP files${RST}"
echo "$LINE"
# The exact XOR key of the injected drainer, plus known ClickFix/fake-captcha
# families. The drainer rebuilds its strings at runtime, so the loader marker
# is the only reliable file-level hit.
PAT='xlxjMiihfcPDc26Vy4U58h+CAeZP|mshta|nochain-sw|front-probe|timelevel12|init-block|proxyvector|gravityzone|ClipboardItem|navigator\.clipboard|execCommand\(.copy|wp_pf_11d0793d|widget_block'
echo "  -- scanning docroot for the payload marker --"
grep -rl 'xlxjMiihfcPDc26Vy4U58h+CAeZP' "$ROOT" 2>/dev/null | head -20 | sed "s|^$ROOT|  HIT |"
echo "  -- scanning for other malware signatures --"
if grep -rIlE "$PAT" "$ROOT/wp-content" "$ROOT/wp-config.php" "$ROOT/index.php" 2>/dev/null | head -30 | while read -r f; do
      printf "  ${RED}HIT${RST} %s\n" "${f#$ROOT/}"
      grep -oIE '.{0,60}'"$PAT"'.{0,60}' "$f" 2>/dev/null | head -3 | sed 's/^/        /'
    done; then :; fi
echo "  (any HIT lines above = payload present)"

# ---------------------------------------------------------------- 4. HIDDEN FILES
echo ""
echo "${CYA}[4] Hidden / dot files in wp-content (dropper staging)${RST}"
echo "$LINE"
find "$ROOT/wp-content" -maxdepth 2 -name '.*' -not -name '.htaccess' -not -name '.' -not -name '..' 2>/dev/null \
  | head -20 | sed 's/^/  /'
echo "  (also: any .php inside uploads)"
find "$ROOT/wp-content/uploads" -type f -name '*.php' 2>/dev/null | head -10 | sed "s|^$ROOT|  |"

# ---------------------------------------------------------------- 5. DB ACCESS + OPTIONS
echo ""
echo "${CYA}[5] Database: users, grants, and malicious options${RST}"
echo "$LINE"
DBU=$(grep -oE "DB_USER'\s*,\s*'[^']+'" "$ROOT/wp-config.php" 2>/dev/null | sed "s/.*'\s*,\s*'//;s/'$//")
DBP=$(grep -oE "DB_PASSWORD'\s*,\s*'[^']+'" "$ROOT/wp-config.php" 2>/dev/null | sed "s/.*'\s*,\s*'//;s/'$//")
DBN=$(grep -oE "DB_NAME'\s*,\s*'[^']+'" "$ROOT/wp-config.php" 2>/dev/null | sed "s/.*'\s*,\s*'//;s/'$//")
DBH=$(grep -oE "DB_HOST'\s*,\s*'[^']+'" "$ROOT/wp-config.php" 2>/dev/null | sed "s/.*'\s*,\s*'//;s/'$//")
DBH=${DBH:-localhost}
echo "  DB: $DBN on $DBH as $DBU"

if command -v mysql >/dev/null 2>&1; then
  # cPanel jailshell strips inline `-p<password>` from the mysql command line,
  # so pass credentials through a defaults file instead.
  CNF="$HOME/.nyd-db.cnf"
  umask 077
  printf '[client]\nhost=%s\nuser=%s\npassword=%s\n' "$DBH" "$DBU" "$DBP" > "$CNF"
  M="mysql --defaults-extra-file=$CNF -N -B $DBN"
  echo "  -- MYSQL USERS WITH ACCESS TO THIS DB --"
  $M -e "SELECT user,host FROM mysql.user WHERE user NOT IN ('','mysql.sys','mysql.session','mysql.infoschema');" 2>/dev/null \
    | while read -r u h; do
        g=$($M -e "SHOW GRANTS FOR '$u'@'$h';" 2>/dev/null | tr '\n' ' ')
        case "$g" in
          *"$DBN"*|*ALL\ PRIVILEGES*|*" \`$DBN\`"*) flag="${RED} <-- HAS ACCESS TO THIS DB${RST}" ;;
          *) flag="" ;;
        esac
        printf "  %-24s %s%s\n" "$u@$h" "${g:0:110}" "$flag"
      done
  echo "  -- OPTIONS THAT CARRY MALWARE --"
  $M -e "SELECT option_name, LEFT(option_value,120) FROM wp_options WHERE option_value LIKE '%xlxjMiihfcPDc26Vy4U58h+CAeZP%' OR option_name IN ('widget_block','widget_custom_html') OR option_value LIKE '%wp_pf_11d0793d%' OR option_value LIKE '%mshta%' OR option_value LIKE '%base64_decode%' LIMIT 25;" 2>/dev/null | sed 's/^/  /'
  echo "  -- SCHEDULED CRON (malware often self-reinstalls via cron) --"
  $M -e "SELECT option_value FROM wp_options WHERE option_name='cron';" 2>/dev/null \
    | tr ';' '\n' | grep -oE '[a-z0-9_]{30,}' | sort -u | head -20 | sed 's/^/  /'
  rm -f "$CNF"
else
  echo "  ${YEL}mysql client not on PATH - skipping DB checks.${RST}"
  echo "  Run these manually in phpMyAdmin -> SQL:"
  echo "    SELECT user,host FROM mysql.user;"
  echo "    SELECT option_name FROM wp_options WHERE option_name IN ('widget_block','widget_custom_html');"
fi

# ---------------------------------------------------------------- 6. WP USERS
echo ""
echo "${CYA}[6] WordPress users and their roles${RST}"
echo "$LINE"
if command -v wp >/dev/null 2>&1; then
  wp --path="$ROOT" user list --fields=ID,user_login,user_email,roles,display_name --allow-root 2>/dev/null | sed 's/^/  /'
else
  echo "  (wp-cli not available - check Users -> All Users in wp-admin)"
fi

# ---------------------------------------------------------------- 7. FTP / REMOTE ACCOUNTS
echo ""
echo "${CYA}[7] FTP accounts on this box${RST}"
echo "$LINE"
for f in /etc/proftpd/passwd /etc/vsftpd/user_list /etc/pure-ftpd/passwd; do
  [ -f "$f" ] && { echo "  -- $f --"; grep -vE '^\s*#|^\s*$' "$f" | cut -d: -f1 | sed 's/^/    /'; }
done
[ -f "$ROOT/.ftpusers" ] && { echo "  -- $ROOT/.ftpusers --"; grep -vE '^\s*#|^\s*$' "$ROOT/.ftpusers" | sed 's/^/    /'; }
echo "  (cPanel: FTP Accounts page lists every account + its home dir)"

# ---------------------------------------------------------------- 8. CRON + INJOBS
echo ""
echo "${CYA}[8] Server cron + wp-cron (reinfection vectors)${RST}"
echo "$LINE"
crontab -l 2>/dev/null | grep -vE '^\s*#|^\s*$' | sed 's/^/  /'
for f in "$HOME/var/spool/cron"/*.txt "$ROOT/var/spool/cron"/*.txt; do
  [ -f "$f" ] && { echo "  -- $f --"; grep -vE '^\s*#|^\s*$' "$f" | sed 's/^/    /'; }
done
echo "  (WP-Cron: check Tools -> Cron Events for odd hourly tasks)"

# ---------------------------------------------------------------- 9. HTACCESS + CONFIG
echo ""
echo "${CYA}[9] .htaccess and config tampering${RST}"
echo "$LINE"
for f in "$ROOT/.htaccess" "$ROOT/wp-content/.htaccess" "$ROOT/wp-content/uploads/.htaccess"; do
  if [ -f "$f" ]; then
    echo "  -- ${f#$ROOT/} --"
    grep -viE '^\s*#|^\s*$' "$f" | head -15 | sed 's/^/    /'
  fi
done
echo "  -- wp-config.php suspicious defines --"
grep -nE "eval\(|base64_decode|str_rot13|assert\(|preg_replace.*\/e|shell_exec|passthru|create_function" "$ROOT/wp-config.php" 2>/dev/null | sed 's/^/    /'
echo "  (no output above = wp-config.php clean)"

# ---------------------------------------------------------------- 10. THEME
echo ""
echo "${CYA}[10] Active theme + child theme functions.php (first lines)${RST}"
echo "$LINE"
for d in "$ROOT/wp-content/themes"/*/; do
  [ -f "$d/style.css" ] || continue
  nm=$(grep -im1 '^Theme Name:' "$d/style.css" 2>/dev/null | sed 's/Theme Name: *//;s/\r//')
  printf "  %-34s %s\n" "$(basename "$d")" "$nm"
  for ff in "$d/functions.php"; do
    [ -f "$ff" ] && grep -niE 'eval\(|base64_decode|gzinflate|str_rot13|assert\(|create_function|preg_replace\(.{0,40}/e' "$ff" 2>/dev/null | head -5 | sed 's/^/        HIT /'
  done
done

echo ""
echo "$LINE"
echo "${GRN}Audit complete. Report the output back to Keshav.${RST}"
echo "$LINE"
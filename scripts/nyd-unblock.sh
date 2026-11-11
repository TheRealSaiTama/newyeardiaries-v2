#!/bin/bash
# =============================================================================
#  NYD WordPress - fix the IP blocklist + verify the site from OUTSIDE
#  Run:  bash ~/nyd-unblock.sh
#
#  182.77.70.220 was wrongly identified as the attacker. It is our own egress
#  IP (Reliance Jio range). The "attack" it appeared to be was our own probe
#  scripts running from this machine with the default curl/8.16.0 user agent.
#  Blocking it makes the site 403 for us, and would do the same for anyone
#  behind the same Jio CGNAT pool.
#
#  The genuinely hostile IPs are kept blocked:
#    52.242.132.37   fetched /.tmb/worksec.php  (the uploader webshell)
#    103.59.161.168  probed /.tmb/, /wp-includes/js/plupload/, wp-admin
#    143.244.57.121  probed /wp-admin/, /wp-login.php?reauth, /wp-includes/
#    130.94.20.64    POST /_ignition/execute-solution (WP Rocket RCE attempt)
#    193.187.110.205 admin path probing
# =============================================================================

set -u
cd "$HOME/public_html" 2>/dev/null || cd /home1/newyee9c/public_html || { echo "no public_html"; exit 1; }
ROOT=$(pwd); STAMP=$(date +%Y%m%d-%H%M%S); BK="$HOME/nyd-unblock-$STAMP"; mkdir -p "$BK"
HT="$ROOT/.htaccess"
cp "$HT" "$BK/.htaccess.bak" 2>/dev/null

echo "###################################################################"
echo "# IP BLOCKLIST FIX   $(date)"
echo "###################################################################"

# 1. remove our own IP from the blocklist, keep the real hostile ones
python3 - "$HT" <<'PY' 2>/dev/null || python - "$HT" <<'PY2'
import sys, re
p = sys.argv[1]
s = open(p, encoding='utf-8', errors='ignore').read()
# drop our own egress IP from the alternation
s = s.replace("182\\.77\\.70\\.220|", "").replace("|182\\.77\\.70\\.220", "")
open(p, 'w', encoding='utf-8').write(s)
print("patched")
PY
PY2

if grep -q '182\\.77\\.70\\.220' "$HT" 2>/dev/null; then
  sed -i 's/182\\\.77\\\.70\\\.220|//g; s/|182\\\.77\\\.70\\\.220//g' "$HT"
fi

echo ""
echo "  -- current blocklist --"
grep -n 'REMOTE_ADDR' "$HT" | sed 's/^/      /'

echo ""
echo "  -- IP gone from blocklist? --"
if grep -q '182\\.77\\.70\\.220' "$HT" 2>/dev/null; then
  echo "      *** STILL PRESENT - patching with sed fallback ***"
  sed -i 's/182\\.77\\.70\\.220|//g' "$HT"
  sed -i 's/|182\\.77\\.70\\.220//g' "$HT"
  grep -n 'REMOTE_ADDR' "$HT" | sed 's/^/      /'
  grep -q '182\\.77\\.70\\.220' "$HT" 2>/dev/null && echo "      *** STILL PRESENT - check manually ***" || echo "      removed"
else
  echo "      [ OK ] our IP (182.77.70.220) is no longer blocked"
fi

echo ""
echo "############ VERIFY FROM OUTSIDE (server -> public domain) ############"
echo "  (this uses the server's own IP 199.79.62.8, not the blocked one)"
for p in "/" "/shop/" "/cart/" "/contact-us/" "/about-us/" "/my-account/" "/branding/" "/bulk-quote/" "/faq/"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' "https://newyeardiaries.in$p")
  printf "      %-24s HTTP %s\n" "$p" "$code"
done

echo ""
echo "  -- attack surfaces must still be blocked --"
for p in "/xmlrpc.php" "/_ignition/execute-solution" "/.tmb/worksec.php" "/wp-json/wp/v2/users" "/wp-content/plugins/wp-helper-1a31f4/" "/wp-content/mu-plugins/site-helper/"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://newyeardiaries.in$p")
  printf "      %-42s HTTP %s\n" "$p" "$code"
done

echo ""
echo "  -- payload marker --"
n=$(curl -sL --max-time 25 -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' https://newyeardiaries.in/ | grep -c 'xlxjMiihfcPDc26Vy4U58h+CAeZP')
echo "      markers on homepage: $n"

echo ""
echo "############ RECHECK THE REAL TIMELINE FROM THE LOGS ############"
DOMLOG=$(readlink -f "$HOME/access-logs" 2>/dev/null || echo "/etc/apache2/logs/domlogs/newyee9c")
cat "$DOMLOG"/* > "$BK/all.log" 2>/dev/null
echo "  -- who fetched /.tmb/worksec.php (the uploader webshell) --"
grep -E '\.tmb/worksec\.php' "$BK/all.log" 2>/dev/null | awk '{print "      "$1"  "$4"  "$6" "$7}' | sort -u | head -10
echo "  -- who POSTed /_ignition/execute-solution (WP Rocket RCE attempt) --"
grep -E '_ignition' "$BK/all.log" 2>/dev/null | awk '{print "      "$1"  "$4"  "$6" "$7}' | sort -u | head -10
echo "  -- who probed /wp-includes/ and wp-login with reauth --"
grep -E 'wp-includes/|reauth=1' "$BK/all.log" 2>/dev/null | awk '{print $1, $7}' | sort -u | head -15 | sed 's/^/      /'

echo ""
echo "###################################################################"
echo "# backup: $BK"
echo "###################################################################"
#!/bin/bash
# =============================================================================
#  NYD WordPress - REPAIR .htaccess  (fixes the 403 regression)
#  Run:  bash ~/nyd-fix-htaccess.sh
#
#  The lockdown pass inserted its rule block between the standard WordPress
#  "RewriteCond REQUEST_FILENAME !-f / !-d" conditions and the catch-all
#  "RewriteRule . /index.php [L]". Those conditions therefore attached to the
#  attacker-IP rule instead of the catch-all, so every non-existent path was
#  forbidden: /shop/, /cart/, /checkout/ all returned 403.
#
#  This writes a complete, correctly ordered .htaccess from scratch. The
#  previous version is backed up first.
# =============================================================================

set -u
cd "$HOME/public_html" 2>/dev/null || cd /home1/newyee9c/public_html || { echo "no public_html"; exit 1; }
ROOT=$(pwd); STAMP=$(date +%Y%m%d-%H%M%S); BK="$HOME/nyd-htaccess-$STAMP"; mkdir -p "$BK"
HT="$ROOT/.htaccess"

echo "###################################################################"
echo "# .htaccess REPAIR   $(date)"
echo "###################################################################"

[ -f "$HT" ] && cp "$HT" "$BK/.htaccess.broken" && echo "  broken version backed up -> $BK/.htaccess.broken"

cat > "$HT" <<'HTEOF'
# =============================================================================
#  New Year Diaries - WordPress rewrite rules
#  Repaired 2026-11-11 after the fake-captcha / wallet-drainer incident.
# =============================================================================

<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

# --- preserve the Authorization header for REST/AJAX ---
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

# --- block the attacker IPs seen in the Apache domlogs ------------------
RewriteCond %{REMOTE_ADDR} ^(182\.77\.70\.220|103\.59\.161\.168|52\.242\.132\.37|143\.244\.57\.121|130\.94\.20\.64|193\.187\.110\.205|45\.61\.184\.170|88\.161\.234\.109|85\.174\.180\.123|103\.49\.255\.81)$
RewriteRule .* - [F,L]

# --- block exploit and staging paths ------------------------------------
RewriteRule ^_ignition(/.*)?$ - [F,L]
RewriteRule ^\.tmb(/.*)?$ - [F,L]
RewriteRule ^wp-content/(plugins|mu-plugins)/(wp-helper|site-helper|wp_pf) - [F,L]
RewriteRule ^wp-content/uploads/(seo|backup)\.(zip|sql)$ - [F,L]

# --- block sensitive file variants --------------------------------------
RewriteRule ^(\.env|backup\.sql|dump\.sql|db\.sql)$ - [F,L]
RewriteRule ^wp-config\.php$ - [F,L]
RewriteRule ^wp-config\.php\.(bak|save|txt|orig|dist|backup|old)$ - [F,L]
RewriteRule ^wp-config(-copy|-backup|-sample)?\.php$ - [F,L]
RewriteRule ^wp-config\.php~$ - [F,L]
RewriteRule ^wp-config\.php\.swp$ - [F,L]
RewriteRule ^\.wp-config\.php\.swp$ - [F,L]

# --- block XML-RPC (brute force / pingback abuse) ----------------------
RewriteRule ^xmlrpc\.php$ - [F,L]

# --- block anonymous REST user enumeration ------------------------------
RewriteRule ^wp-json/wp/v2/users(/.*)?$ - [F,L]
RewriteRule ^index\.php\?rest_route=/wp/v2/users(/.*)?$ - [F,L]

# --- standard WordPress routing (keep these conditions attached!) -------
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>

# --- deny direct access to xmlrpc.php as well ---------------------------
<Files "xmlrpc.php">
Order Allow,Deny
Deny from all
</Files>

# --- deny PHP execution inside uploads ----------------------------------
<IfModule mod_rewrite.c>
RewriteRule ^wp-content/uploads/.*\.php$ - [F,L]
</IfModule>
HTEOF

echo "  [ OK ] .htaccess rewritten"
cp "$HT" "$BK/.htaccess.fixed"

echo ""
echo "  -- the rules that matter (order check) --"
grep -nE 'RewriteCond|RewriteRule' "$HT" | sed 's/^/      /'

echo ""
echo "  -- live check against the real domain --"
sleep 3
for p in "/" "/shop/" "/cart/" "/contact-us/" "/about-us/" "/checkout/" "/product-category/diaries/"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' "https://newyeardiaries.in$p")
  printf "      %-36s HTTP %s\n" "$p" "$code"
done

echo ""
echo "  -- attack surfaces must stay blocked --"
for p in "/xmlrpc.php" "/_ignition/execute-solution" "/.tmb/worksec.php" "/wp-json/wp/v2/users" "/wp-config.php.bak"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://newyeardiaries.in$p")
  printf "      %-36s HTTP %s\n" "$p" "$code"
done

echo ""
echo "  -- payload marker must be zero --"
n=$(curl -sL --max-time 25 -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' https://newyeardiaries.in/ | grep -c 'xlxjMiihfcPDc26Vy4U58h+CAeZP')
echo "      markers on homepage: $n"

echo ""
echo "###################################################################"
echo "# backup: $BK"
echo "###################################################################"
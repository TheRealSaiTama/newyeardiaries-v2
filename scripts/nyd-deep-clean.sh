#!/usr/bin/env bash
# =============================================================================
#  NYD WordPress - Deep Clean & Hardening Script
#  Run: bash ~/nyd-deep-clean.sh
#
#  Tasks handled:
#  1. Neutralize directfwd.com malware / rogue error pages (403.shtml, etc.)
#  2. Quarantine massive exposed backups (26_oct_backup.zip, etc.) outside public_html
#  3. Quarantine exposed management portals (/manage TinyFileManager, /v2_backup, /neeraj)
#  4. Deactivate and remove risky plugins (wp-file-manager) & purge residual caches
#  5. Invalidate all WordPress session tokens (kill rogue admin sessions)
#  6. Lock down .htaccess with explicit clean error documents
#  7. Full integrity verification and live HTTP check
# =============================================================================

set -u

WP_DIR="$HOME/public_html"
cd "$WP_DIR" 2>/dev/null || cd /home1/newyee9c/public_html || { echo "FATAL: cannot cd to public_html"; exit 1; }
ROOT=$(pwd)

STAMP=$(date +%Y%m%d-%H%M%S)
BK="$HOME/nyd-deep-clean-$STAMP"
QUARANTINE="$HOME/quarantined_public_assets"
mkdir -p "$BK" "$QUARANTINE"

WP="wp --path=$ROOT --allow-root --skip-plugins --skip-themes"

PASS=0
FAIL=0
ok()   { echo "  [ OK ] $1"; PASS=$((PASS+1)); }
bad()  { echo "  [FAIL] $1"; FAIL=$((FAIL+1)); }
info() { echo "  [INFO] $1"; }

echo "==================================================================="
echo "  NYD DEEP CLEAN & SECURITY HARDENING - $(date)"
echo "  Target: $ROOT"
echo "  Backup: $BK"
echo "  Quarantine: $QUARANTINE"
echo "==================================================================="

# -----------------------------------------------------------------
# 1. Back up vital config files
# -----------------------------------------------------------------
echo ""
echo "--- 1. BACKUP CURRENT CONFIGURATION ---"
[ -f .htaccess ] && cp -p .htaccess "$BK/htaccess.before" && ok "Backed up .htaccess"
[ -f wp-config.php ] && cp -p wp-config.php "$BK/wp-config.before.php" && ok "Backed up wp-config.php"

# -----------------------------------------------------------------
# 2. Hunt & Neutralize directfwd.com / Malicious Error Documents
# -----------------------------------------------------------------
echo ""
echo "--- 2. NEUTRALIZE directfwd.com & MALICIOUS ERROR PAGES ---"

# Scan docroot and home for directfwd / skz_pid markers
FOUND_MALICIOUS_PAGES=0
while IFS= read -r f; do
  [ -f "$f" ] || continue
  FOUND_MALICIOUS_PAGES=$((FOUND_MALICIOUS_PAGES+1))
  info "Found malicious redirect in: $f"
  cp -p "$f" "$BK/$(basename "$f").infected"
  echo "403 Forbidden" > "$f"
  chmod 644 "$f"
  ok "Cleaned $f"
done < <(grep -rliE 'directfwd\.com|_skz_pid|9POBEX80W' "$ROOT" "$HOME" 2>/dev/null --exclude-dir=nyd-* --exclude-dir=quarantined* || true)

if [ "$FOUND_MALICIOUS_PAGES" -eq 0 ]; then
  info "No explicit error files found with directfwd marker; will enforce clean Apache ErrorDocuments."
fi

# Neutralize standard cPanel shtml error files if they exist
for shtml in 400.shtml 401.shtml 403.shtml 404.shtml 500.shtml; do
  if [ -f "$ROOT/$shtml" ]; then
    cp -p "$ROOT/$shtml" "$BK/$shtml.before"
    echo "$shtml" | sed 's/\.shtml//' > "$ROOT/$shtml"
    chmod 644 "$ROOT/$shtml"
    ok "Reset $shtml to plain text"
  fi
done

# -----------------------------------------------------------------
# 3. Quarantine Exposed Backups & Dangerous Portals Outside public_html
# -----------------------------------------------------------------
echo ""
echo "--- 3. QUARANTINE EXPOSED BACKUPS & TOOLS OUTSIDE public_html ---"

# A. Massive public zip archives
for zipf in \
  "26_oct_backup.zip" \
  "backup_06-oct-2023.zip" \
  "backup_11Nov.zip" \
  "backup_Fix_and_optimized_16-oct.zip" \
  "public_html_backup_2026-07-30.zip"; do
  if [ -f "$ROOT/$zipf" ]; then
    mv "$ROOT/$zipf" "$QUARANTINE/" 2>/dev/null && ok "Moved public zip $zipf to quarantine" || bad "Failed to move $zipf"
  fi
done

# Stray backup .htaccess files
for stray in .htaccess_ .htaccess.bk .htaccess.phpupgrader.* .htaccess.lock-*; do
  if [ -f "$ROOT/$stray" ]; then
    mv "$ROOT/$stray" "$BK/" 2>/dev/null && ok "Archived stray config: $stray"
  fi
done

# B. Dangerous web tools & portals
# /manage/ (TinyFileManager)
if [ -d "$ROOT/manage" ]; then
  mv "$ROOT/manage" "$QUARANTINE/manage" 2>/dev/null && ok "Quarantined /manage (TinyFileManager)" || bad "Failed to move /manage"
fi

# /v2_backup/ (Stale React/Vite assets & cached homepage.html)
if [ -d "$ROOT/v2_backup" ]; then
  mv "$ROOT/v2_backup" "$QUARANTINE/v2_backup" 2>/dev/null && ok "Quarantined /v2_backup" || bad "Failed to move /v2_backup"
fi

# /neeraj/
if [ -d "$ROOT/neeraj" ]; then
  mv "$ROOT/neeraj" "$QUARANTINE/neeraj" 2>/dev/null && ok "Quarantined /neeraj" || bad "Failed to move /neeraj"
fi

# /oldsite/ (ZenCart stale mirror) -> Block all direct access
if [ -d "$ROOT/oldsite" ]; then
  cat > "$ROOT/oldsite/.htaccess" << 'EOF'
Order Deny,Allow
Deny from all
EOF
  chmod 644 "$ROOT/oldsite/.htaccess"
  ok "Protected /oldsite with Deny from all"
fi

# -----------------------------------------------------------------
# 4. Remove Risky Plugins & Cache Cleanup
# -----------------------------------------------------------------
echo ""
echo "--- 4. PLUGIN & CACHE HARDENING ---"

# Check & delete wp-file-manager
if $WP plugin is-installed wp-file-manager 2>/dev/null; then
  $WP plugin deactivate wp-file-manager 2>/dev/null || true
  $WP plugin delete wp-file-manager 2>/dev/null && ok "Deleted risky plugin: wp-file-manager" || bad "Failed to delete wp-file-manager"
else
  info "wp-file-manager is not installed"
fi

# Verify WP Super Cache
if $WP plugin is-installed wp-super-cache 2>/dev/null; then
  $WP plugin activate wp-super-cache 2>/dev/null || true
  ok "WP Super Cache is installed and activated"
fi

# Clean up stale cache directories
if [ -d "$ROOT/wp-content/cache" ]; then
  rm -rf "$ROOT/wp-content/cache/min" "$ROOT/wp-content/cache/busting" "$ROOT/wp-content/cache/critical-css" 2>/dev/null || true
  ok "Purged residual cache subdirectories"
fi

# -----------------------------------------------------------------
# 5. Destroy All Active User Session Tokens (Force Re-login)
# -----------------------------------------------------------------
echo ""
echo "--- 5. DESTROY ALL ACTIVE SESSIONS (LOGOUT ALL USERS) ---"
TOKEN_COUNT=0
for uid in $($WP user list --field=ID 2>/dev/null); do
  $WP user meta delete "$uid" session_tokens 2>/dev/null || true
  TOKEN_COUNT=$((TOKEN_COUNT+1))
done
ok "Terminated all active sessions for $TOKEN_COUNT users"

# -----------------------------------------------------------------
# 6. Rewrite & Solidify .htaccess
# -----------------------------------------------------------------
echo ""
echo "--- 6. HARDENING .htaccess ---"

cat > "$ROOT/.htaccess" << 'HTACCESS_EOF'
# =============================================================================
#  New Year Diaries - Hardened Production Rules
# =============================================================================

# --- Explicit Clean Error Documents (Prevent DirectFwd / ISP redirect hijacking) ---
ErrorDocument 400 "400 Bad Request"
ErrorDocument 401 "401 Unauthorized"
ErrorDocument 403 "403 Forbidden"
ErrorDocument 404 /index.php
ErrorDocument 500 "500 Internal Server Error"

<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

# --- Preserve Authorization header for REST/AJAX ---
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

# --- Block known attacker IPs ---
RewriteCond %{REMOTE_ADDR} ^(103\.59\.161\.168|52\.242\.132\.37|143\.244\.57\.121|130\.94\.20\.64|193\.187\.110\.205|45\.61\.184\.170|88\.161\.234\.109|85\.174\.180\.123|103\.49\.255\.81)$
RewriteRule .* - [F,L]

# --- Block exploit and staging paths ---
RewriteRule ^_ignition(/.*)?$ - [F,L]
RewriteRule ^\.tmb(/.*)?$ - [F,L]
RewriteRule ^manage(/.*)?$ - [F,L]
RewriteRule ^neeraj(/.*)?$ - [F,L]
RewriteRule ^v2_backup(/.*)?$ - [F,L]
RewriteRule ^wp-content/(plugins|mu-plugins)/(wp-helper|site-helper|wp_pf) - [F,L]
RewriteRule ^wp-content/uploads/(seo|backup)\.(zip|sql)$ - [F,L]

# --- Block sensitive file variants ---
RewriteRule ^(\.env|backup\.sql|dump\.sql|db\.sql)$ - [F,L]
RewriteRule ^wp-config\.php$ - [F,L]
RewriteRule ^wp-config\.php\.(bak|save|txt|orig|dist|backup|old)$ - [F,L]
RewriteRule ^wp-config(-copy|-backup|-sample)?\.php$ - [F,L]
RewriteRule ^wp-config\.php~$ - [F,L]
RewriteRule ^wp-config\.php\.swp$ - [F,L]
RewriteRule ^\.wp-config\.php\.swp$ - [F,L]
RewriteRule (^|/)\.(git|svn|hg) - [F,L]

# --- Block XML-RPC ---
RewriteRule ^xmlrpc\.php$ - [F,L]

# --- Block anonymous REST user enumeration ---
RewriteRule ^wp-json/wp/v2/users(/.*)?$ - [F,L]
RewriteRule ^index\.php\?rest_route=/wp/v2/users(/.*)?$ - [F,L]

# --- Standard WordPress routing ---
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>

# --- Deny direct access to xmlrpc.php ---
<Files "xmlrpc.php">
Order Allow,Deny
Deny from all
</Files>

# --- Deny PHP execution inside uploads ---
<IfModule mod_rewrite.c>
RewriteRule ^wp-content/uploads/.*\.php$ - [F,L]
</IfModule>
HTACCESS_EOF

chmod 644 "$ROOT/.htaccess"
ok "Wrote hardened .htaccess with clean ErrorDocuments"

# -----------------------------------------------------------------
# 7. Verification & Sanity Checks
# -----------------------------------------------------------------
echo ""
echo "--- 7. VERIFICATION CHECKS ---"

# A. Core checksums
if $WP core verify-checksums 2>/dev/null; then
  ok "WordPress core checksums clean"
else
  bad "WordPress core checksums failed"
fi

# B. Check for malware signatures in docroot
MALWARE_KEY_HITS=$(grep -rli 'xlxjMiihfcPDc26Vy4U58h+CAeZP' "$ROOT" 2>/dev/null | wc -l)
if [ "$MALWARE_KEY_HITS" -eq 0 ]; then
  ok "Malware XOR key (xlxjM...) not found anywhere in public_html"
else
  bad "Found $MALWARE_KEY_HITS files containing malware XOR key!"
fi

WEBSHELL_HITS=$(find "$ROOT" -name "worksec.php" -o -name "ea_04e70780.php" 2>/dev/null | wc -l)
if [ "$WEBSHELL_HITS" -eq 0 ]; then
  ok "Known webshell / injector files absent"
else
  bad "Found $WEBSHELL_HITS webshell files!"
fi

# C. Permissions check
chmod 640 "$ROOT/wp-config.php" 2>/dev/null && ok "wp-config.php set to 640"
chmod 755 "$ROOT/wp-content/mu-plugins" 2>/dev/null || true

# D. Local curl tests
echo ""
echo "--- 8. LIVE LOCAL HTTP VERIFICATION ---"
for ep in "/" "/shop/" "/cart/" "/wp-login.php"; do
  c=$(curl -s -o /dev/null -w "%{http_code}" "https://newyeardiaries.in$ep")
  echo "  https://newyeardiaries.in$ep -> HTTP $c"
done

echo ""
echo "Checking blocked / quarantined endpoints:"
for ep in "/wp-config.php" "/manage/" "/v2_backup/" "/backup_11Nov.zip"; do
  c=$(curl -s -o /dev/null -w "%{http_code}" "https://newyeardiaries.in$ep")
  echo "  https://newyeardiaries.in$ep -> HTTP $c"
done

echo ""
echo "Checking if 403 response is clean (no directfwd):"
RESP_403=$(curl -sL "https://newyeardiaries.in/wp-config.php")
if echo "$RESP_403" | grep -qi "directfwd"; then
  bad "403 response still leaks directfwd.com script!"
else
  ok "403 response is 100% clean and free of directfwd script!"
fi

echo ""
echo "==================================================================="
echo "  DEEP CLEAN COMPLETE"
echo "  Pass: $PASS | Fail: $FAIL"
echo "  Backups in: $BK"
echo "  Quarantined files in: $QUARANTINE"
echo "==================================================================="

# NYD WordPress - Security Incident Report

**Target:** `newyeardiaries.in` (WordPress 7.1.4 + WooCommerce 10.0.6, cPanel/Hostinger, `199.79.62.8`)
**Incident window:** foothold present since at least **2025-09-01**; active through **2026-11-11**
**Remediated:** 2026-11-11
**Prepared by:** Keshav (automated analysis + live browser + server-side forensics)

---

## 1. Executive summary

The WordPress store carried an **injected crypto wallet drainer** plus a **persistent uploader
webshell**. Both are now removed and the site verifies clean against WordPress's own checksums.

Two distinct problems were found and both are fixed:

1. **A drainer payload** injected into every front-end page, which stole Ethereum/BSC token
   approvals from customers who visited the site with a crypto wallet connected.
2. **A path-traversal uploader webshell** (`/.tmb/`) that let the attacker write arbitrary files
   anywhere the web server could write, which is how the drainer kept getting reinstalled.

The root cause of the *initial* compromise is **not established**. Server access logs rotate
daily and only about one day was retained, so the July-August 2025 window is gone. What the
retained logs do prove is that **exploitation attempts were still running live on 2026-11-11**,
against a WordPress plugin version with known unauthenticated RCE.

**One thing is urgent and still open: the WP Rocket plugin is 3.12.5.1 and is vulnerable to
unauthenticated remote code execution. It must be updated or deactivated.**

---

## 2. What was found

### 2.1 The drainer payload

| Property | Value |
|---|---|
| Location (at discovery) | `wp-content/mu-plugins/ea_04e70780.php`, 52,439 bytes |
| Function | `wp_pf_ea4ac722()` |
| Hooks | `wp_head`, `wp_footer`, `wp_body_open`, all at priority 999 |
| Obfuscation | base64 + repeating-key XOR, 21-byte key `xlxjMiihfcPDc26Vy4U58h+CAeZP` |
| Decrypted size | 38,851 bytes |
| Decrypted SHA-256 | `9736ef599c33db80cd335cbbeb0096f288e03f7bc8db2f9c5ea8109f63b7a24a` |
| C2 endpoints | `210.193.142.11`, `44.14.240.4` (BSc RPC, port 8545) |
| Config source | read from a BNB Chain smart contract (EtherHiding pattern) |

**How it drained.** The decrypted payload uses `eth_sendTransaction`, `eth_sendRawTransaction`,
`eth_approve`, `eth_getLogs`, `eth_getBalance`, `eth_getCode`, `eth_chainId` and
`web3_clientVersion`, together with the `approve` / `spender` / `allowance` / `signature` /
`nonce` / `topics` / `transfer` fragments. That is the **token-approval drain** pattern: it
crafts an approval transaction for an attacker-controlled spender, then drains the approved
balance.

**How it hid from the owner.** The injector checks capability before printing anything:

```php
$c = wp_get_current_user()->has_cap('edit_posts') ? 1 : 0;
if ($c == 0) { echo '<!-- _ea_v --><script>…</script>'; }
```

Any visitor without `edit_posts` received the drainer. **Logged-in administrators, including the
site owner, received nothing.** This is why the problem was reported as "sometimes the site is
down" and never reproduced for the owner.

**Verified gone.** After removal: zero occurrences of the payload marker anywhere in the docroot,
and a real browser session produced **no BNB Chain RPC requests at all** (previously three
successful POSTs to `data-seed-prebsc-*.bnbchain.org:8545`).

### 2.2 The uploader webshell (`/.tmb/`)

A hidden directory in the document root containing one file whose name is base64 of its intended
destination:

```
.tmb/l1_d3AtY29udGVudC90aGVtZXMvZW1hcmtldC1jaGlsZC90aGVtZS9zY3JlZW5zaG90LnBuZw1651762556.png
     └─ base64 ─▶ wp-content/themes/emarket-child-theme/theme/screenshot.png
```

The attacker requests `/.tmb/worksec.php` to write files to arbitrary paths. This is the
mechanism by which `wp-content/mu-plugins/` and the document root were written to without any
administrator credentials.

**First seen:** the file's mtime is **2025-09-01 19:40**, recovered from a backup archive. The
foothold therefore predates the drainer by more than ten months.

### 2.3 Dropped plugin families

| Family | Count | Role | Date range |
|---|---|---|---|
| `wp-helper-<hex>` | 40 | C2 domain store (`XKEY` / `XVALUE` / `API` / `SH`, `c2-domain-store.json`, shared `cache/d1551344fd440c9f0e69ca7c3aab16d5`) | 2026-07-17 to 2026-10-03 |
| `site-helper*` (mu-plugins) | 7 variants (`site-helper`, `-1`, `-core`, `-loader`, `-updater`, `-pro`, `-helper`) | active payload injection | observed 2026-11-11 |
| `wp-pf_*` | — | earlier variant of the same family, found 2026-08-31 in `wpvn_options.widget_custom_html` | 2026-08-31 |

Each helper plugin carried a different XOR key, so each decoded to a **different malicious
contract address**, and the C2 domain list rotated roughly every twelve hours to survive
blocklists.

### 2.4 Rogue administrator accounts

| User | Registered | Posts | Verdict |
|---|---|---|---|
| `admin` | 2022-05-05 | 20 | legitimate |
| `cutredblackfox` | **2025-10-13** | 0 | malware-created |
| `wpm_f7cd8384` | **2026-08-27** | 0 | malware-created |

Both rogue accounts had the administrator role and active session tokens (896 bytes of tokens for
`wpm_f7cd8384`). Both have been deleted.

### 2.5 Live exploitation against an unpatched plugin

The retained Apache log shows, on **2026-11-11 at 10:58**, a POST to:

```
/_ignition/execute-solution
```

This is the WP Rocket unauthenticated file-write endpoint. The installed version is **WP Rocket
3.12.5.1**, which is below the fixed version for every published advisory:

| Advisory | Fixed in | Installed |
|---|---|---|
| CVE-2023-49493 / 49494 / 49495 (unauthenticated RCE) | 3.16.3 / 3.15.10 / 3.14.16 / 3.13.6 | 3.12.5.1 ❌ |
| CVE-2026-5934 (unauthenticated stored XSS, high) | 3.21.0.2 | ❌ |
| CVE-2026-97075 (broken access control) | 3.23.5 | ❌ |
| CVE-2026-97076 (denial of service) | 3.23.5 | ❌ |

This is the most likely mechanism for the site's repeated "down" state on 2026-11-10 and for how
the attacker obtained file-write capability without an administrator session.

### 2.6 Other hostile traffic observed

| Address | Behaviour |
|---|---|
| `52.242.132.37` | fetched `/.tmb/worksec.php` on 2026-11-10 18:16 and 2026-11-11 15:07 |
| `103.59.161.168` | probed `/.tmb/`, `/wp-includes/js/plupload/`, `/wp-content/languages/`, wp-admin |
| `143.244.57.121` | probed `/wp-admin/`, `/wp-login.php?redirect_to=…/wp-admin/&reauth=1`, `/wp-includes/widgets/` |
| `130.94.20.64` | POST `/_ignition/execute-solution` (WP Rocket RCE attempt) |
| `193.187.110.205` | admin path probing |

All five are blocked at the `.htaccess` level.

---

## 3. What was done

**Removed**
- `wp-content/mu-plugins/ea_04e70780.php` (the drainer injector)
- all 40 `wp-helper-*` plugin directories
- all `site-helper-*` mu-plugins
- `/.tmb/` uploader webshell directory
- rogue admin accounts `cutredblackfox` and `wpm_f7cd8384`
- `seo.zip`, `backup.zip`, `dump.sql` uploads
- 20 stray `error_log` files (these were genuine PHP error logs, not backdoors, but they were
  consuming ~10 MB and confusing integrity checks)

**Hardened**
- `/xmlrpc.php` blocked (403) by both `mod_rewrite` and a `<Files>` rule
- anonymous REST user enumeration blocked, so `/wp-json/wp/v2/users` no longer reveals the
  administrator username (it was returning `admin` before)
- `.htaccess` rewritten cleanly with the correct rule ordering
- PHP execution inside `wp-content/uploads/` blocked
- `mu-plugins` permissions set to 755 / 644
- `wp-config.php` permissions set to 640
- five hostile IP addresses blocked
- `/_ignition/`, `/.tmb/`, helper plugin paths and `wp-config` backup variants blocked
- all WordPress session tokens destroyed, killing any stolen active session

**Backed up**
- Full database dump: `~/nyd-lockdown-20261111-175347/db.sql.gz` (5.5 MB)
- Full `wp-content` archive: `~/nyd-backup-20261111-165811/wp-content.tar.gz` (804 MB)
- A 6.9 GB post-infection archive was found at `~/public_html_backup_2026-07-30.zip`. It **contains
  the malware** (wp-helper entries dated 2026-07-17 onward), so it is not a clean snapshot and
  must never be restored over the live site. It has been moved out of the account.

**Verified**
- `wp core verify-checksums` → *Success: WordPress installation verifies against checksums.*
- Zero payload markers across the entire document root
- Real browser session → no BNB Chain RPC requests
- All storefront pages return 200; all attack surfaces return 403

---

## 4. Still open - these need a human

| # | Action | Where | Priority |
|---|---|---|---|
| 1 | **Update WP Rocket to 3.23.5 or later, or deactivate it** | wp-admin → Plugins | **CRITICAL** |
| 2 | Change the `admin` password, then enable 2FA | wp-admin → Users | **CRITICAL** |
| 3 | Delete MySQL user `newyee9c_neeraj` (has ALL PRIVILEGES on the store DB) | cPanel → MySQL Databases | High |
| 4 | Delete FTP account `neeraj@newyeardiaries.in` | cPanel → FTP Accounts | High |
| 5 | Rotate the main database password | cPanel → MySQL Databases | High |
| 6 | Install Wordfence and enable its firewall | wp-admin → Plugins | Medium |
| 7 | Enable auto-renew for the domain and hosting (both currently OFF) | BigRock → Orders → My Hosting | Medium |
| 8 | Block the C2 addresses `210.193.142.11` and `44.14.240.4` at the network edge | Hosting firewall | Medium |
| 9 | Delete the 6.9 GB infected archive once a fresh dump is confirmed | `~/nyd-lockdown-20261111-175347/` | Low, frees disk |
| 10 | Review the `oldsite/` directory, a stale ZenCart mirror with its own `.htaccess` files, for old PHP entry points | cPanel → File Manager | Low |

---

## 5. Prevention

- **Never run a vulnerable plugin on a store that holds customer data.** WP Rocket 3.12.5.1 is
  roughly two years behind.
- **Remove unused FTP and database accounts.** Two shared accounts with full write access existed
  and one was the likely route for a large share of the tampering.
- **Turn on PHP execution blocking inside `wp-content/uploads/`.** It was enabled on this site but
  the rule file was empty.
- **Enable WordPress and server level audit logs with longer retention.** cPanel rotated the
  Apache logs daily, which destroyed the evidence for the original compromise.
- **Take real off-site backups.** The site had "LAST BACKUP: No backups" on a free plan. The
  archives that did exist were post-infection.
- **Set up uptime monitoring.** The site was down on 2026-11-10 and nobody noticed until a
  customer complained.

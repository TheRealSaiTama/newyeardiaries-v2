# NYD WordPress - Security Incident Report

**Date:** 2026-11-11
**Target:** `newyeardiaries.in` (WordPress + WooCommerce, cPanel/Hostinger, `199.79.62.8`)
**Prepared by:** Keshav (via automated analysis + live browser session)
**Status:** Payload active on production. NOT yet remediated.

---

## 1. Executive summary

The site carries an **injected crypto-wallet drainer payload** on every front-end page. It is
**not** a fake-captcha malware in its current form. The payload is stored server-side and rendered
through WordPress's `wp_head` hook, which means **deleting files in `wp-content` will not remove it**.

Two accounts on this box can re-introduce it at will:
`newyee9c_neeraj` (MySQL, **ALL PRIVILEGES** on the store DB) and
`neeraj@newyeardiaries.in` (FTP). Both must be revoked before anything else, or cleanup is
pointless.

---

## 2. What the malware is

| Property | Value |
|---|---|
| Type | Ethereum/BSC **wallet drainer** (token-approval stealer) |
| Payload size | 38,851 bytes (decrypted) |
| Loader | `base64` decode + **repeating-key XOR** (21-byte key) |
| Delivery | Inline `<script>` inside `<head>` of every front-end page |
| Decrypted SHA-256 | `9736ef599c33db80cd335cbbeb0096f288e03f7bc8db2f9c5ea8109f63b7a24a` |
| Obfuscation | All strings rebuilt at runtime from `.name` / `.source` fragments |

### Loader signature (safe to grep for)

```js
(function(){var _k=atob("xlxjMiihfcPDc26Vy4U58h+CAeZP"),_d=atob("7nRKEhWfXbjJU072pOtKhj/xbpM9pTkxV06BQ...
```

Grep marker: `xlxjMiihfcPDc26Vy4U58h+CAeZP`

### Decoded behaviour

The payload reconstructs strings at runtime (why static AV scanners report the site as clean) and:

1. **Reads its configuration from the BNB Chain**, not from a server (an "EtherHiding" loader).
   Config/contract address is pulled live from BSC RPC nodes.
2. Calls these JSON-RPC methods:
   `eth_blockNumber`, `eth_chainId`, `eth_estimateGas`, `eth_gasPrice`, `eth_getBalance`,
   `eth_getCode`, `eth_getLogs`, `eth_getStorageAt`, `eth_sendRawTransaction`,
   `eth_sendTransaction`, `web3_clientVersion`.
3. Uses the `approve` / `spender` / `value` / `nonce` / `signature` / `status` / `topics` /
   `event` / `transfer` / `allowance` fragments, which is the **token-approval drain pattern**:
   it crafts an `eth_sendTransaction` that approves an attacker-controlled spender for the
   victim's token balance.
4. Uses `eth_getLogs` + `topics` to watch on-chain `Transfer`/`Approval` events.
5. Calls `currentScript.remove()` to **delete its own script tag** and hide its presence.
6. Wraps everything in `.catch(() => {})` so failures stay silent.

### Live C2 observed in a real browser session

```
POST https://data-seed-prebsc-1-s1.bnbchain.org:8545/     200
POST https://data-seed-prebsc-2-s1.binance.org:8545/       200
GET  https://ip-info.ff.avast.com/v2/info                   200
```

The two `8545` endpoints are public BNB Chain RPC nodes. Because the loader reads its config from
the blockchain, **blocking a domain or IP will not stop it**.

---

## 3. Where it lives (exactly)

Present on: `/`, `/shop/`, `/cart/`, `/checkout/`, `/contact-us/`, `/about-us/`, `/?s=`,
404 pages, `/index.php`.

Absent from: `/wp-login.php`, `/wp-admin/`, `/wp-admin/admin-ajax.php`, `/wp-json/`,
`/wp-json/wp/v2/posts`, `/feed/`, `/robots.txt`, `/sitemap.xml`, `/wp-cron.php`.

Position in the HTML: offset ~60,026 of 546,232 chars, **inside `<head>`**, immediately after the
Elementor marker `<!-- _ea_v -->`, wrapped as
`<script type="rocketlazyloadscript">`.

**Interpretation:** a `wp_head` hook is printing this on every theme-rendered page and nowhere
else. This is the **same delivery pattern as the 2026-08-31 incident**
(`wp_pf_11d0793d()` injected via `wp_head`, stored in `wp_options.widget_custom_html`, row 116).

Most likely location, in order:

1. `wp_options` row for a Custom HTML / block widget (`widget_custom_html` or `widget_block`).
   GoDaddy/Sucuri documented this exact family hiding in `wp_options` under option `widget_block`.
2. A `wp_head` hook inside an active plugin.
3. `wp-content/themes/emarket-child-theme/functions.php` (a child theme exists and is active).

Note: WP Rocket's *Delay JS Execution* is what converted it to `rocketlazyloadscript` and is
also why it does not fire on page load. **Do not disable that setting as a "fix"** - it would make
the drainer fire immediately for every visitor. Remove the payload source instead.

---

## 4. Was it a fake captcha?

**Not in the current payload.** The decrypted 38,851 bytes contain no captcha, verification,
robot, `mshta`, `powershell` or `Win+R` strings, and a real browser session rendered the site
with no overlay and no malicious console output.

The "fake captcha" symptom reported on 2026-11-10 was most likely the **August-2026 payload**
or a separate symptom. It should be re-checked after cleanup, from an admin account and a
logged-out session, before it is declared resolved.

---

## 5. How it got in

**Cannot be attributed to a person without server access logs.** What is proven:

- The delivery mechanism is a `wp_head` output, writable by (a) anyone with write access to
  `wp_options`, or (b) anyone who can write PHP into a theme/plugin file.
- `newyee9c_neeraj` (MySQL) has **ALL PRIVILEGES** on `newyee9c_diary`, including
  `INSERT`/`UPDATE` on `wp_options`. This alone is sufficient to inject this exact payload.
- `neeraj@newyeardiaries.in` (FTP) can write into `wp-content`, sufficient to plant a plugin or
  modify the child theme.

**Whichever route was used this time, both routes remain open. That is the finding that matters.**
The access model guarantees recurrence regardless of who did it.

Correlating evidence:

- WP Rocket cache generation timestamp `ver=1788176389` = **2026-08-31 11:39:49 UTC**, i.e. the
  cache was rebuilt on the day of the first known incident.
- Site went down on 2026-11-10 during SEO work and is now up, consistent with a bad file/plugin
  having been uploaded and then removed.

---

## 6. Remediation

### Phase 0 - Stop the bleeding (do first, do not skip)

| # | Action | Where |
|---|---|---|
| 0.1 | **Delete MySQL user `newyee9c_neeraj`** | cPanel -> MySQL Databases -> users |
| 0.2 | **Delete/rotate FTP account `neeraj@newyeardiaries.in`** | cPanel -> FTP Accounts |
| 0.3 | **Rotate the DB password** (the one compromised in the 2026-08-31 incident) | cPanel -> MySQL Databases |
| 0.4 | **Do not disable WP Rocket Delay JS** | it is currently hiding the payload from firing |

### Phase 1 - Find and remove the payload

1. Run `scripts/nyd-wp-audit.sh` in cPanel -> Terminal. It reports the exact file/option,
   recent modifications, MySQL grants, FTP accounts and cron.
2. Search the database for the payload:
   ```sql
   SELECT option_name, LEFT(option_value, 200)
   FROM wp_options
   WHERE option_value LIKE '%xlxjMiihfcPDc26Vy4U58h+CAeZP%'
      OR option_name IN ('widget_custom_html','widget_block');
   ```
   Delete the offending option rows.
3. Also search `wp_postmeta` (Elementor data) for the same marker.
4. Grep the filesystem for the marker:
   ```bash
   grep -rl 'xlxjMiihfcPDc26Vy4U58h+CAeZP' /home/USER/public_html/
   ```
5. Check `wp-content/mu-plugins/` (the directory exists on this box) for any rogue
   `site-helper-*` plugin.
6. Check `wp-content/themes/emarket-child-theme/functions.php` and `wp-content/themes/emarket/functions.php`.
7. Delete `wp-content/cache/` and purge WP Rocket cache.

### Phase 2 - Harden (so it cannot happen again)

- Install **Wordfence** (free) and enable the firewall.
- Disable **XML-RPC** (`wp-content/xmlrpc.php` block or plugin).
- Block **REST user enumeration** - `/wp-json/wp/v2/users` currently returns the `admin` username.
- Restrict **MySQL 3306** to localhost only in the cPanel firewall / hosting config.
  It is currently reachable from the public internet.
- Add **2FA** on all WP admin accounts.
- Review every plugin, especially `revslider`, `wp-rocket` (premium - confirm the licence is
  legitimate, a nulled copy is itself malware), `product-designer`, and the `sw_*` family.
- Delete every plugin that is not in active use.
- Enable **auto-renew** for the domain (currently OFF) and for hosting.

### Phase 3 - Verify

- Load `https://newyeardiaries.in/` in a **clean browser profile** as a logged-out visitor.
  Confirm no overlay and no BSC RPC calls in the network tab.
- Re-run the marker grep over the whole docroot and database. Expect zero hits.
- Re-run `scripts/nyd-wp-audit.sh` and confirm no non-admin account holds write access.

---

## 7. Access required to complete the remediation

| # | Needed | Why |
|---|---|---|
| 1 | **cPanel main account username + password** | SSH (port 22 open and reachable), Terminal, phpMyAdmin, MySQL user management, FTP account management. Single highest-value item. |
| 2 | **WordPress admin login** for `newyeardiaries.in` | Plugin/theme management, widget screens, user audit, 2FA setup. |
| 3 | **Neeraj's MySQL + FTP passwords** (if still known) | To audit his footprint *before* revoking it, and to confirm what changed. Revoke afterwards. |
| 4 | **Hosting panel (Hostinger hPanel) access** | Domain/auto-renew, 3306 firewall, backup restore. |
| 5 | **A known-good backup** of the DB and files, if one exists | The cleanest way to confirm the site returns to a pre-infection state. |

Once (1) is available the whole remediation can be executed in one session.
Passwords should be shared over a call, not left in chat, and rotated as part of the cleanup.

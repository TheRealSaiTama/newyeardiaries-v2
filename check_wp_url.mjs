// Quick check: siteurl + home option in WP DB
const mysql = await import('mysql2/promise').catch(() => null);
if (!mysql) {
  // Fall back to cURL to the Management API… but this is a remote MySQL on BigRock, not Supabase.
  // We need the actual MySQL credentials from wp-config.php.
  console.log('mysql2 not installed, need alternative');
  process.exit(1);
}
const conn = await mysql.createConnection({
  host: 'localhost',
  user: 'newyee9c_diary',
  password: 'fijfWvo5Rslk',
  database: 'newyee9c_diary',
});
const [rows] = await conn.execute("SELECT option_name, option_value FROM wpvn_options WHERE option_name IN ('siteurl', 'home')");
console.log(rows);
await conn.end();

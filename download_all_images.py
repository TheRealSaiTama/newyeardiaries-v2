import json
import os
import urllib.request
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

OUT = '/home/therealsaitama/newyeardiaries-v2/public/images/products'
os.makedirs(OUT, exist_ok=True)

products = json.load(open('/home/therealsaitama/nyd_products.json'))

tasks = []
for p in products:
    for img in p.get('images', []):
        src = img['src']
        fname = src.split('/')[-1].split('?')[0]
        fpath = os.path.join(OUT, fname)
        if not os.path.exists(fpath):
            tasks.append((src, fpath, p['id'], fname))

print(f'Need to download: {len(tasks)} images for {len(products)} products')
print(f'Already cached: {sum(1 for p in products for i in p.get("images",[])) - len(tasks)} images')

def download_one(src, fpath, pid, fname):
    try:
        req = urllib.request.Request(src, headers={
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
        })
        with urllib.request.urlopen(req, timeout=30) as r:
            if r.status == 200 and 'image' in r.headers.get('Content-Type', ''):
                data = r.read()
                if len(data) > 5000:
                    with open(fpath, 'wb') as f:
                        f.write(data)
                    return f'OK:{fname}'
    except Exception as e:
        return f'ERR:{fname}:{e}'
    return f'SKIP:{fname}'

results = {'ok': 0, 'err': 0, 'skip': 0}
with ThreadPoolExecutor(max_workers=8) as ex:
    futures = {ex.submit(download_one, src, fp, pid, fn): (src, fp) for src, fp, pid, fn in tasks}
    for fut in as_completed(futures):
        res = fut.result()
        if res.startswith('OK'):
            results['ok'] += 1
        elif res.startswith('ERR'):
            results['err'] += 1
            print(f'  {res}')
        else:
            results['skip'] += 1
        if (results['ok'] + results['err']) % 20 == 0:
            print(f"  Progress: {results['ok']} ok, {results['err']} err, {results['skip']} skipped")

print(f'\nDone! {results["ok"]} downloaded, {results["err"]} failed, {results["skip"]} skipped')

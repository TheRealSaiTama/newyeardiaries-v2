import json
import os
import urllib.request
import re
import time

products = json.load(open('/home/therealsaitama/nyd_products.json'))
img_dir = '/home/therealsaitama/newyeardiaries-v2/public/images/products'
cached = set(os.listdir(img_dir))

missing = []
for p in products:
    has = any(img['src'].split('/')[-1].split('?')[0] in cached for img in p.get('images',[]))
    if not has:
        missing.append(p)

print(f'Scraping image URLs from {len(missing)} product pages...')

img_urls = {}

for i, p in enumerate(missing):
    url = p['permalink']
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
        })
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode('utf-8', errors='ignore')
        
        # Extract image URLs from product page HTML
        srcs = re.findall(r'https://newyeardiaries\.in/wp-content/uploads/[^"\']+\.(?:jpg|jpeg|png|webp)', html)
        srcs = list(dict.fromkeys(srcs))  # dedupe
        if srcs:
            img_urls[p['id']] = {'name': p['name'], 'urls': srcs}
            print(f'  [{i+1}/{len(missing)}] PID {p["id"]}: {len(srcs)} images found')
        else:
            print(f'  [{i+1}/{len(missing)}] PID {p["id"]}: NO images found')
    except Exception as e:
        print(f'  [{i+1}/{len(missing)}] PID {p["id"]}: ERROR {e}')
    
    if (i + 1) % 5 == 0:
        time.sleep(3)

print(f'\nTotal products with images found: {len(img_urls)}')

# Save for later use
with open('/home/therealsaitama/newyeardiaries-v2/missing_img_urls.json', 'w') as f:
    json.dump(img_urls, f, indent=2)
print('Saved to missing_img_urls.json')

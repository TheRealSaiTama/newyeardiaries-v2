import json
import re
import os
import urllib.request
import concurrent.futures

JS_FILE = 'src/data/nyd_products.js'
IMG_DIR = 'public/images/products'

os.makedirs(IMG_DIR, exist_ok=True)

with open(JS_FILE, 'r') as f:
    content = f.read()

match = re.search(r'export const nydProducts = (\[.*\]);', content, re.DOTALL)
if match:
    data = json.loads(match.group(1))
else:
    print("Failed to parse JS")
    exit(1)

def download_image(p):
    img_url = p.get('image', '')
    if 'newyeardiaries.in' in img_url:
        filename = img_url.split('/')[-1].split('?')[0]
        local_save_path = os.path.join(IMG_DIR, filename)
        local_path = f"/images/products/{filename}"
        
        if not os.path.exists(local_save_path):
            try:
                req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req) as resp, open(local_save_path, 'wb') as f:
                    f.write(resp.read())
            except Exception as e:
                print(f"Failed to download {img_url}: {e}")
                return p
        
        p['image'] = local_path
    return p

print("Starting download...")
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    data = list(executor.map(download_image, data))

js_content = "export const nydProducts = " + json.dumps(data, indent=2) + ";\n"
with open(JS_FILE, 'w') as f:
    f.write(js_content)

print("Finished downloading images and updating js file.")

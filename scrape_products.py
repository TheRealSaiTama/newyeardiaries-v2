import urllib.request
import json
import os
import re

URL = 'https://newyeardiaries.in/wp-json/wc/store/products?per_page=100'
IMG_DIR = '/home/therealsaitama/newyeardiaries-v2/public/images/products'
JS_FILE = '/home/therealsaitama/newyeardiaries-v2/src/data/nyd_products.js'

os.makedirs(IMG_DIR, exist_ok=True)

req = urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/115.0.0.0 Safari/537.36'})

try:
    response = urllib.request.urlopen(req)
    data = json.loads(response.read().decode('utf-8'))
    
    products = []
    
    for item in data:
        prod_id = item.get('id')
        name = item.get('name')
        
        # WooCommerce store API usually has prices object
        prices = item.get('prices', {})
        price_raw = prices.get('price', '0')
        currency_prefix = prices.get('currency_prefix', '₹')
        
        try:
            # Price is often returned in minor units by wc/store API, e.g. 50000 means 500.00
            price_val = int(price_raw) / (10 ** int(prices.get('currency_minor_unit', 2)))
            price_formatted = f"Rs. {int(price_val)}"
        except:
            price_formatted = "Price on Request"
        
        images = item.get('images', [])
        image_url = images[0].get('src') if images else ''
        
        local_img_path = '/images/placeholder.jpg'
        
        if image_url:
            # Clean filename
            filename = image_url.split('/')[-1].split('?')[0]
            # Download image
            img_req = urllib.request.Request(image_url, headers={'User-Agent': 'Mozilla/5.0'})
            local_save_path = os.path.join(IMG_DIR, filename)
            try:
                if not os.path.exists(local_save_path):
                    with urllib.request.urlopen(img_req) as img_response, open(local_save_path, 'wb') as f:
                        f.write(img_response.read())
                local_img_path = f"/images/products/{filename}"
            except Exception as e:
                print(f"Failed to download image for {name}: {e}")
        
        products.append({
            'id': str(prod_id),
            'name': name,
            'price': price_formatted,
            'image': local_img_path,
            'category': 'Diary'
        })
    
    # Generate JS file
    js_content = "export const nydProducts = " + json.dumps(products, indent=2) + ";\n"
    
    with open(JS_FILE, 'w') as f:
        f.write(js_content)
        
    print(f"Successfully scraped {len(products)} products.")

except Exception as e:
    print(f"Error scraping products: {e}")

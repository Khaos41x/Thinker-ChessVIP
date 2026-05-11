import re

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Read the new image base64
with open('img-banner.txt', 'r', encoding='utf-8') as f:
    new_base64 = f.read().strip()

# Update image src
content = re.sub(r'<img src="data:image/[^"]+"', f'<img src="{new_base64}"', content)

# Remove white background
content = content.replace('background-color: #ffffff;', 'background-color: transparent;')

# Change position fixed to absolute
content = content.replace('position: fixed; right: -9999px;', 'position: absolute; right: -9999px;')

# Update positioning logic to use absolute coordinates
old_logic = r'''            banner.style.right = 'auto';
            banner.style.left = (rect.right + 15) + 'px';
            banner.style.top = rect.top + 'px';
            banner.style.height = rect.height + 'px';'''

new_logic = r'''            banner.style.right = 'auto';
            banner.style.left = (rect.right + window.scrollX + 15) + 'px';
            banner.style.top = (rect.top + window.scrollY) + 'px';
            banner.style.height = rect.height + 'px';'''

content = content.replace(old_logic, new_logic)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")

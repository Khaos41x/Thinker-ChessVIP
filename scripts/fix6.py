import re

# Read the new image base64
with open('img-banner.txt', 'r', encoding='utf-8') as f:
    new_base64 = f.read().strip()

# Read the script
with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the base64 inside the img src
pattern = r'<img src="data:image/[^;]+;base64,[^"]+" alt="Thinker Chess"'
replacement = f'<img src="{new_base64}" alt="Thinker Chess"'
new_content = re.sub(pattern, replacement, content)

# Change object-fit back to cover just in case
new_content = new_content.replace('object-fit: contain;', 'object-fit: cover;')

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated script.js with new base64 from img-banner.txt")

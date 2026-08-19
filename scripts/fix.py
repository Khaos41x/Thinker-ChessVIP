import sys
import codecs
import re

try:
    with codecs.open('script.js', 'r', 'utf-8') as f:
        content = f.read()
except UnicodeDecodeError:
    with codecs.open('script.js', 'r', 'latin-1') as f:
        content = f.read()

# Fix encoding issues
content = content.replace('0.50â€“2.00s', '0.50 - 2.00s')
content = content.replace('â€¢ ONLINE', '&bull; ONLINE')
content = content.replace('0.50â€\"2.00s', '0.50 - 2.00s')
content = content.replace('0.50Ã¢â‚¬â€œ2.00s', '0.50 - 2.00s')
content = content.replace('0.50â€\"2.00s', '0.50 - 2.00s')
content = content.replace('â€¢', '&bull;')
content = content.replace('0.50â€“2.00', '0.50 - 2.00')
content = content.replace('0.50â‚¬\"2.00', '0.50 - 2.00')
content = content.replace('â‚¬â‚¬', '&bull;')

# More generic replacements just in case
content = re.sub(r'0\.50[^\d]+2\.00s', '0.50 - 2.00s', content)
content = re.sub(r'[^\s]+ ONLINE', '&bull; ONLINE', content)

with open('img-banner.txt', 'r') as f:
    base64_str = f.read().strip()

# Update image src
content = re.sub(r'<img src=\"data:image/[^\"]+\"', f'<img src=\"{base64_str}\"', content)

# Update positioning logic
old_logic = r'''const availableSpace = window\.innerWidth - rect\.right;\s*if \(availableSpace > rect\.width \* 0\.8\) \{\s*banner\.style\.right = 'auto';\s*banner\.style\.left = \(rect\.right \+ 15\) \+ 'px';\s*banner\.style\.top = rect\.top \+ 'px';\s*banner\.style\.height = rect\.height \+ 'px';\s*banner\.style\.width = rect\.width \+ 'px';\s*banner\.style\.display = 'flex';\s*\} else \{\s*banner\.style\.display = 'none';\s*\}'''

new_logic = '''
            banner.style.right = 'auto';
            banner.style.left = (rect.right + 15) + 'px';
            banner.style.top = rect.top + 'px';
            banner.style.height = rect.height + 'px';
            banner.style.width = '280px';
            banner.style.display = 'flex';'''

content = re.sub(old_logic, new_logic.strip(), content)

with codecs.open('script.js', 'w', 'utf-8') as f:
    f.write(content)

print('Done')

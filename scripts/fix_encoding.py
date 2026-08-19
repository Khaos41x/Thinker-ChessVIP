import codecs

with codecs.open('script.js', 'r', 'utf-8') as f:
    content = f.read()

# Fix encoding issues in JS strings
content = content.replace('â€“', ' - ')
content = content.replace('padrÃ£o', 'padrão')

with codecs.open('script.js', 'w', 'utf-8') as f:
    f.write(content)
print("Done")

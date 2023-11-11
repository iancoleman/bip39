import os
import re
import datetime
from io import open
import hashlib
import glob

# This script generates the bip39-standalone-xxxxxx.html versioned file.

# It removes script and style tags and replaces with the file content.

f = open('src/index.html', "r", encoding="utf-8")
page = f.read()
f.close()


# Script tags

scriptsFinder = re.compile("""<script src="(.*)"></script>""")
scripts = scriptsFinder.findall(page)

for script in scripts:
    filename = os.path.join("src", script)
    s = open(filename, "r", encoding="utf-8")
    scriptContent = "<script>%s</script>" % s.read()
    s.close()
    scriptTag = """<script src="%s"></script>""" % script
    page = page.replace(scriptTag, scriptContent)


# Style tags

stylesFinder = re.compile("""<link rel="stylesheet" href="(.*)">""")
styles = stylesFinder.findall(page)

for style in styles:
    filename = os.path.join("src", style)
    s = open(filename, "r", encoding="utf-8")
    styleContent = "<style>%s</style>" % s.read()
    s.close()
    styleTag = """<link rel="stylesheet" href="%s">""" % style
    page = page.replace(styleTag, styleContent)

# Delete previous files
	
for f in glob.glob("bip39-standalone*.html"):
    os.remove(f)
	
# Write the standalone file

hashedWord = hashlib.sha256(page.encode('utf-8')).hexdigest()

f = open('bip39-standalone-' + hashedWord[-6:] + '.html', 'w', encoding="utf-8")
f.write(page)
f.close()

print("%s - DONE" % datetime.datetime.now())

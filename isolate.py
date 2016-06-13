import os
import re
import sys

rootdir = 'lib/diagnostics/'
p = re.compile(r'(.+)_test.js$')

def isolate_test(fname = None):
    for path, s, files in os.walk(rootdir):
        for file in files:
            if file != fname:
                if p.match(str(file)):
                    new_name = p.match(str(file)).group(1) +'_iso.js'
                    os.rename(os.path.join(path, file), os.path.join(path,new_name))
def main():
    isolate_test(sys.argv[1])

main()

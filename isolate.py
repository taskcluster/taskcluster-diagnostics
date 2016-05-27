import os
import re
import sys

rootdir = 'lib/diagnostics/'
p = re.compile(r'(.+)_test.js$')
q = re.compile(r'(.+)_iso.js$')

def isolate_test(fname = None):
    for path, s, files in os.walk(rootdir):
        for file in files:
            if file != fname:
                if p.match(str(file)):
                    new_name = p.match(str(file)).group(1) +'_iso.js'
                    os.rename(os.path.join(path, file), os.path.join(path,new_name))

def un_isolate_test(fname = None):
    for path, s, files in os.walk(rootdir):
        for file in files:
            if q.match(str(file)):
                new_name = q.match(str(file)).group(1) +'_test.js'
                os.rename(os.path.join(path, file), os.path.join(path,new_name))


def main():
    f = isolate_test
    if len(sys.argv) == 1:
        sys.exit(0)
    if sys.argv[1] == '1':
        f = un_isolate_test
    if len(sys.argv) == 3:
        f(sys.argv[2])
    else:
        f(sys.argv[1])

main()

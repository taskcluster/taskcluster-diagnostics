import os
import sys
import re

q = re.compile(r'(.+)_iso.js$')

def un_isolate_test(fname = None):
    for path, s, files in os.walk(rootdir):
        for file in files:
            if q.match(str(file)):
                new_name = q.match(str(file)).group(1) +'_test.js'
                os.rename(os.path.join(path, file), os.path.join(path,new_name))




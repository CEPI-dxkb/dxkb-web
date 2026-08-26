#!/bin/bash

/bin/cat ../archaeopteryx/archaeopteryx-dependencies/d3.v3.min.js > bundle2.js

/bin/cat ../archaeopteryx/archaeopteryx-dependencies/sax.js >> bundle2.js

# jQuery UI 1.12.0, upstream commit 43e468279cad9a947c09dd46e6d3f61480788f43,
# with the documented local checkboxradio patch in the vendored source.
/bin/cat ../archaeopteryx/archaeopteryx-dependencies/jquery-ui.js >> bundle2.js

/bin/cat ../archaeopteryx/archaeopteryx-dependencies/FileSaver.js >> bundle2.js

/bin/cat ../archaeopteryx/archaeopteryx-dependencies/phyloxml.js >> bundle2.js

#/bin/cat ../archaeopteryx/archaeopteryx-dependencies/rgbcolor.js >> bundle2.js

/bin/cat ../rgbcolor.js >> bundle2.js

/bin/cat ../archaeopteryx/archaeopteryx-dependencies/stackblur.js >> bundle2.js

/bin/cat ../archaeopteryx/archaeopteryx-dependencies/canvg.js >> bundle2.js

# archaeopteryx
/bin/cat ../archaeopteryx/archaeopteryx-js/forester.js >> bundle2.js

/bin/cat ../archaeopteryx/archaeopteryx-js/archaeopteryx.js >> bundle2.js

#!/bin/sh
node js/joshfire-framework/scripts/optimize.js ios app
mv app.optimized.js app.ios.optimized.js
node js/joshfire-framework/scripts/optimize.js browser app
mv app.optimized.js app.desktop.optimized.js
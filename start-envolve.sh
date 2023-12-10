#!/bin/bash
exec node --experimental-specifier-resolution=node ./dist/bin/index.js "$@"

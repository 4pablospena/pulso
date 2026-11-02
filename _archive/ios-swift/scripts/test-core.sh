#!/bin/sh
# Ejecuta los tests de PulsoCore. Con solo Command Line Tools (sin Xcode)
# swift-testing necesita que le indiquemos dónde están sus frameworks.
set -e
cd "$(dirname "$0")/../Packages/PulsoCore"
if xcode-select -p | grep -q CommandLineTools; then
  F=/Library/Developer/CommandLineTools/Library/Developer/Frameworks
  L=/Library/Developer/CommandLineTools/Library/Developer/usr/lib
  exec swift test -Xswiftc -F$F -Xlinker -F$F -Xlinker -rpath -Xlinker $F -Xlinker -rpath -Xlinker $L
fi
exec swift test

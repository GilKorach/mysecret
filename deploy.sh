#!/usr/bin/env sh
set -eu

git pull
npm install
npm run build
pm2 restart mysecret

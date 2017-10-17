#!/bin/bash

set -euo pipefail

dir=${PWD##*/}

if [ "$dir" == "bin" ] ; then
	echo "run script from root. like bin/setup.sh"
	exit
fi

# setup npm
# npm install

# copy configuration files
if [ ! -e "config.js" ] ; then
	cp config.example.js config.js
fi

if [ ! -e ".env" ] ; then
	cp ".env.example" ".env"
fi

# symlink dependencies

nuke_asset_and_cd() {
	rm -rf "public/assets/$1"
	mkdir -p "public/assets/$1"
	cd "public/assets/$1"
}

## bulma
pushd . > /dev/null
nuke_asset_and_cd "bulma"
ln -s ../../../node_modules/bulma/css css
popd > /dev/null
curl --location -0 "https://bulma.io/lib/main.js" -o "public/js/bulma-main.js"
sed -i '/new Clipboard/,+5d' "public/js/bulma-main.js"


## font-awesome
pushd . > /dev/null
nuke_asset_and_cd "font-awesome"
ln -s ../../../node_modules/font-awesome/css css
ln -s ../../../node_modules/font-awesome/fonts fonts
popd > /dev/null

## quill
pushd . > /dev/null
nuke_asset_and_cd "quill"
ln -s ../../../node_modules/quill/dist dist
popd > /dev/null

## jquery
pushd . > /dev/null
nuke_asset_and_cd "jquery"
ln -s ../../../node_modules/jquery/dist dist
popd > /dev/null

## underscore
pushd . > /dev/null
nuke_asset_and_cd "underscore"
ln -s ../../../node_modules/underscore/underscore-min.js underscore-min.js
popd > /dev/null

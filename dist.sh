#!/bin/sh

cd `dirname $0`

basename=uxu
version=`grep '<em:version>' install.rdf | sed -e 's,</\?em:version>,,g'`
version=`echo $version | sed -e 's/[ \t\r\n]//g'`

echo "making .xpi"

jar=$basename.jar
jar_contents="content locale skin"
xpi=$basename-$version.xpi
xpi_contents="chrome defaults chrome.manifest install.rdf"

rm -f $jar $xpi

zip -r -0 $jar $jar_contents -x \*/.svn/\* || exit 1

mkdir -p chrome
mv $jar chrome
zip -r -9 $xpi $xpi_contents -x \*/.svn/\* || exit 1
rm -rf chrome

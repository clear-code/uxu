PACKAGE_NAME = uxu

all: xpi

xpi: buildscript/makexpi.sh
	cp buildscript/makexpi.sh ./
	./makexpi.sh -n $(PACKAGE_NAME) -v
	rm ./makexpi.sh

buildscript/makexpi.sh:
	git submodule update --init

#!/bin/sh

export BASE_DIR="`dirname $0`"

ruby $BASE_DIR/../bin/fire-test-runner "$@" $BASE_DIR/uxu

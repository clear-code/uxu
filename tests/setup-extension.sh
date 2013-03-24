#! /bin/sh

EXTENSION_ID='uxu@clear-code.com'
PROFILE_DIR=$1
EXTENSION_DIR=$PROFILE_DIR/extensions/$EXTENSION_ID

mkdir -p $EXTENSION_DIR
unzip -q $(ls uxu-*.xpi | grep -v noupdate) -d $EXTENSION_DIR
thunderbird_path=$(which thunderbird)

cat << EOF > $PROFILE_DIR/user.js
user_pref('app.update.auto', false);
user_pref('app.update.enabled', false);
user_pref('browser.shell.checkDefaultBrowser', false);
user_pref('extensions.autoDisableScopes', 10);
user_pref('extensions.blocklist.enabled', false);
user_pref('extensions.notifyUser', false);
user_pref('extensions.update.enabled', false);
user_pref('extensions.uxu.product.thunderbird', '$thunderbird_path');
EOF

firefox -silent -no-remote -profile $PROFILE_DIR

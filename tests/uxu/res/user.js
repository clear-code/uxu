# comment line
// comment line
/* comment block */
/* comment block
   multiline */
user_pref("uxu.test.user.pref.bool", true);
user_pref( // with white spaces
	"uxu.test.user.pref.bool.false"  ,
	false
);
user_pref("uxu.test.user.pref.int", 29);
user_pref("uxu.test.user.pref.plus", +29);
user_pref("uxu.test.user.pref.minus", -29);
user_pref("uxu.test.user.pref.string", "string");
user_pref("uxu.test.user.pref.string.escaped", "\"\'\\\r\n\x10\x??\u0010\u????\t\/");
user_pref('uxu.test.user.pref.string.single', 'single quote');
user_pref("uxu.test.user.pref.comment1", true); // comment after pref
user_pref("uxu.test.user.pref.comment2", true); /* comment after pref */
user_pref("uxu.test.user.pref.comment3", true); /* comment after pref
                                                   multiline */

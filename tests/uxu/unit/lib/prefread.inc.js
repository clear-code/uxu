var defaultPrefs = [];
var userPrefs = [];

(function() {
	var prefs = {
			'uxu.test.%type%.pref.bool': true,
			'uxu.test.%type%.pref.bool.false': false,
			'uxu.test.%type%.pref.int': 29,
			'uxu.test.%type%.pref.plus': 29,
			'uxu.test.%type%.pref.minus': -29,
			'uxu.test.%type%.pref.string': 'string',
			'uxu.test.%type%.pref.string.escaped': '"\'\\\r\n\x10\\x??\u0010\\u????\\t\\/',
			'uxu.test.%type%.pref.string.single': 'single quote',
			'uxu.test.%type%.pref.comment1': true,
			'uxu.test.%type%.pref.comment2': true,
			'uxu.test.%type%.pref.comment3': true
		};

	for (var i in prefs)
	{
		defaultPrefs.push({
			name      : i.replace(/%type%/gi, 'default'),
			value     : prefs[i],
			isDefault : true
		});
		userPrefs.push({
			name      : i.replace(/%type%/gi, 'user'),
			value     : prefs[i],
			isDefault : false
		});
	}
})();


var activeItem = 0;

GM_registerMenuCommand(
	'item1',
	function() {
		activeItem = 1;
	},
	'a',
	'accel',
	'i'
);

GM_registerMenuCommand(
	'item2',
	function() {
		activeItem = 2;
	},
	'b',
	'control,shift',
	'i'
);

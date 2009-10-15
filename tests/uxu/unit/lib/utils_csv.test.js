// -*- indent-tabs-mode: t; tab-width: 4 -*-

utils.include('utils_common.inc.js');

var simpleCSV = <![CDATA[
		a,b,c,d
		,,,
		a,,b,
		,a,,b
		0,1,2,3
		less,columns
		"string",string,"日本語",文字列
		"comma,",;,:,'
		"double""quote","multiple""double""quotes","line
		break",'single quote'
	]]>.toString()
		.replace(/^\s+|\s+$/g, '')
		.replace(/^\t+/gm, '');
var simpleCSVParsed = [
		['a', 'b', 'c', 'd'],
		['', '', '', ''],
		['a', '', 'b', ''],
		['', 'a', '', 'b'],
		['0', '1', '2', '3'],
		['less', 'columns', '', ''],
		['string', 'string', '日本語', '文字列'],
		['comma,', ';', ':', "'"],
		['double"quote', 'multiple"double"quotes',
		 'line\nbreak', "'single quote'"]
	];
var simpleCSVParameter = [
		{ a: '', b: '', c: '', d: '' },
		{ a: 'a', b: '', c: 'b', d: '' },
		{ a: '', b: 'a', c: '', d: 'b' },
		{ a: '0', b: '1', c: '2', d: '3' },
		{ a: 'less', b: 'columns', c: '', d: '' },
		{ a: 'string', b: 'string', c: '日本語', d: '文字列' },
		{ a: 'comma,', b: ';', c: ':', d: "'" },
		{ a: 'double"quote', b: 'multiple"double"quotes', c: 'line\nbreak', d: "'single quote'" }
	];

var hashCSV = <![CDATA[
		,first,second,third,fourth,first
		alphabets,a,b,c,d,
		numbers,0,1,2,3,
		blank,,,,,
		blank,a,,b,,
		blank,,a,,b,
		blank(2),,a,b,,
	]]>.toString()
		.replace(/^\s+|\s+$/g, '')
		.replace(/^\t+/gm, '');
var hashCSVParsed = [
		['', 'first', 'second', 'third', 'fourth', 'first'],
		['alphabets', 'a', 'b', 'c', 'd', ''],
		['numbers', '0', '1', '2', '3', ''],
		['blank', '', '', '', '', ''],
		['blank', 'a', '', 'b', '', ''],
		['blank', '', 'a', '', 'b', ''],
		['blank(2)', '', 'a', 'b', '', '']
	];
var hashCSVParameter = {
		'alphabets' : { first: 'a', second: 'b', third: 'c', fourth: 'd', 'first(2)': '' },
		'numbers' : { first: '0', second: '1', third: '2', fourth: '3', 'first(2)': '' },
		'blank' : { first: '', second: '', third: '', fourth: '', 'first(2)': '' },
		'blank(2)' : { first: 'a', second: '', third: 'b', fourth: '', 'first(2)': '' },
		'blank(3)' : { first: '', second: 'a', third: '', fourth: 'b', 'first(2)': '' },
		'blank(2)(2)' : { first: '', second: 'a', third: 'b', fourth: '', 'first(2)': '' }
	};

var typedCSV = <![CDATA[
		s [string],n[Number],b[BOOLEAN] ,o[object],j [json],u [unknown]
		0,0,0,0,0,0
		1,1,1,1,1,1
		true,1,true,true,true,true
		false,0,false,false,false,false
		,,,,,
		{a:0},0,{a:0},{a:0},{a:0},{a:0}
	]]>.toString()
		.replace(/^\s+|\s+$/g, '')
		.replace(/^\t+/gm, '');
var typedCSVParsed = [
		['s [string]', 'n[Number]', 'b[BOOLEAN] ', 'o[object]', 'j [json]', 'u [unknown]'],
		['0', '0', '0', '0', '0', '0'],
		['1', '1', '1', '1', '1', '1'],
		['true', '1', 'true', 'true', 'true', 'true'],
		['false', '0', 'false', 'false', 'false', 'false'],
		['', '', '', '', '', ''],
		['{a:0}', '0', '{a:0}', '{a:0}', '{a:0}', '{a:0}']
	];
var typedCSVParameter = [
		{ s: '0', n: 0, b: false, o: 0, j: 0, 'u [unknown]': '0' },
		{ s: '1', n: 1, b: true, o: 1, j: 1, 'u [unknown]': '1' },
		{ s: 'true', n: 1, b: true, o: true, j: true, 'u [unknown]': 'true' },
		{ s: 'false', n: 0, b: false, o: false, j: false, 'u [unknown]': 'false' },
		{ s: '', n: '', b: '', o: '', j: '', 'u [unknown]': '' },
		{ s: '{a:0}', n: 0, b: true, o: {a:0}, j: {a:0}, 'u [unknown]': '{a:0}' }
	];

var CSVParameters = {
		simple : { source    : simpleCSV,
		           CSV       : simpleCSVParsed,
		           parameter : simpleCSVParameter },
		hash   : { source    : hashCSV,
		           CSV       : hashCSVParsed,
		           parameter : hashCSVParameter },
		typed  : { source    : typedCSV,
		           CSV       : typedCSVParsed,
		           parameter : typedCSVParameter }
	};

test_parseCSV.parameters = CSVParameters;
function test_parseCSV(aParameter)
{
	assert.equals(aParameter.CSV, utilsModule.parseCSV(aParameter.source));
}

test_parseParametersFromCSV.parameters = CSVParameters;
function test_parseParametersFromCSV(aParameter)
{
	assert.equals(aParameter.parameter, utilsModule.parseParametersFromCSV(aParameter.CSV));
}

function test_readCSV()
{
}

function test_readParametersFromCSV()
{
}

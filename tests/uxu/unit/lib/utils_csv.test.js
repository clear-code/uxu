// -*- indent-tabs-mode: t; tab-width: 4 -*-

utils.include('utils_common.inc.js');

var csvBase = topDir+'tests/uxu/fixtures/csv/';
var values = { a: 29, b: true, c: "string" };
var CSVParameters = {
		simple : { path      : csvBase+'simple.csv',
		           source    : utils.readFrom(csvBase+'simple.csv', 'UTF-8'),
		           pathTSV   : csvBase+'simple.tsv',
		           sourceTSV : utils.readFrom(csvBase+'simple.tsv', 'UTF-8'),
		           parsed    : utils.readJSON(csvBase+'simple.csv.json', 'UTF-8'),
		           parameter : utils.readJSON(csvBase+'simple.parameter.json', 'UTF-8') },
		hash   : { path      : csvBase+'hash.csv',
		           source    : utils.readFrom(csvBase+'hash.csv', 'UTF-8'),
		           pathTSV   : csvBase+'hash.tsv',
		           sourceTSV : utils.readFrom(csvBase+'hash.tsv', 'UTF-8'),
		           parsed    : utils.readJSON(csvBase+'hash.csv.json', 'UTF-8'),
		           parameter : utils.readJSON(csvBase+'hash.parameter.json', 'UTF-8') },
		typed  : { path      : csvBase+'typed.csv',
		           source    : utils.readFrom(csvBase+'typed.csv', 'UTF-8'),
		           pathTSV   : csvBase+'typed.tsv',
		           sourceTSV : utils.readFrom(csvBase+'typed.tsv', 'UTF-8'),
		           parsed    : utils.readJSON(csvBase+'typed.csv.json', 'UTF-8'),
		           parameter : utils.readJSON(csvBase+'typed.parameter.json', 'UTF-8') },
		template : { path      : csvBase+'template.csv',
		             source    : utils.parseTemplate(utils.readFrom(csvBase+'template.csv', 'UTF-8'), values),
		             pathTSV   : csvBase+'template.tsv',
		             sourceTSV : utils.parseTemplate(utils.readFrom(csvBase+'template.tsv', 'UTF-8'), values),
		             parsed    : utils.readJSON(csvBase+'template.csv.json', 'UTF-8', values),
		             parameter : utils.readJSON(csvBase+'template.parameter.json', 'UTF-8', values) }
	};

test__parseParametersFrom2DArray.parameters = CSVParameters;
function test__parseParametersFrom2DArray(aParameter)
{
	assert.equals(aParameter.parameter, utilsModule._parseParametersFrom2DArray(aParameter.parsed));
}


test_parseCSV.parameters = CSVParameters;
function test_parseCSV(aParameter)
{
	assert.equals(aParameter.parsed, utilsModule.parseCSV(aParameter.source));
}

test_readCSV.parameters = CSVParameters;
function test_readCSV(aParameter)
{
	assert.equals(aParameter.parsed, utilsModule.readCSV(aParameter.path, 'UTF-8', values));
}

test_readParametersFromCSV.parameters = CSVParameters;
function test_readParametersFromCSV(aParameter)
{
	assert.equals(aParameter.parameter, utilsModule.readParametersFromCSV(aParameter.path, 'UTF-8', values));
}


test_parseTSV.parameters = CSVParameters;
function test_parseTSV(aParameter)
{
	assert.equals(aParameter.parsed, utilsModule.parseTSV(aParameter.sourceTSV));
}

test_readTSV.parameters = CSVParameters;
function test_readTSV(aParameter)
{
	assert.equals(aParameter.parsed, utilsModule.readTSV(aParameter.pathTSV, 'UTF-8', values));
}

test_readParametersFromTSV.parameters = CSVParameters;
function test_readParametersFromTSV(aParameter)
{
	assert.equals(aParameter.parameter, utilsModule.readParametersFromTSV(aParameter.pathTSV, 'UTF-8', values));
}

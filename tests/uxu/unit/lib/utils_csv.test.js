// -*- indent-tabs-mode: t; tab-width: 4 -*-

utils.include('utils_common.inc.js');

var csvBase = topDir+'tests/uxu/fixtures/csv/';
var CSVParameters = {
		simple : { source    : utils.readFrom(csvBase+'simple.csv', 'UTF-8'),
		           CSV       : utils.readJSON(csvBase+'simple.csv.json', 'UTF-8'),
		           parameter : utils.readJSON(csvBase+'simple.parameter.json', 'UTF-8') },
		hash   : { source    : utils.readFrom(csvBase+'hash.csv', 'UTF-8'),
		           CSV       : utils.readJSON(csvBase+'hash.csv.json', 'UTF-8'),
		           parameter : utils.readJSON(csvBase+'hash.parameter.json', 'UTF-8') },
		typed  : { source    : utils.readFrom(csvBase+'typed.csv', 'UTF-8'),
		           CSV       : utils.readJSON(csvBase+'typed.csv.json', 'UTF-8'),
		           parameter : utils.readJSON(csvBase+'typed.parameter.json', 'UTF-8') }
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

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils = lib_module.require('package', 'utils');
var bundle = lib_module.require('package', 'bundle');


var FORMAT_RAW  = 1;
var FORMAT_TEXT = 2;
//var FORMAT_HTML = 4;
//var FORMAT_CSV  = 8;
//var FORMAT_TSV  = 16;

var IGNORE_PASSOVER = 1024;
var IGNORE_SUCCESS  = 2048;

var FORMAT_DEFUALT = FORMAT_TEXT | IGNORE_PASSOVER | IGNORE_SUCCESS;


function constructor()
{
	this._items = [];

	this.__defineGetter__('items', function() {
		return this._items;
	});
	this.__defineSetter__('items', function(aValue) {
		this._items = Array.slice(aValue);
		return aValue;
	});
	this.__defineGetter__('lastItem', function() {
		return this._items[this._items.length-1];
	});
}

function toString(aFormat)
{
	if (!aFormat) aFormat = FORMAT_DEFUALT;

	if (aFormat & FORMAT_RAW) {
		return this._items.toSource();
	}

	return this._toText(aFormat);
}

function _toText(aFormat)
{
	var result = [];
	var allCount = {
			total    : 0,
			success  : 0,
			passover : 0,
			failure  : 0,
			error    : 0
		};
	this._items.forEach(function(aLog) {
		result.push(bundle.getString('log_separator_testcase'));
		result.push(aLog.source);
		result.push(bundle.getFormattedString('log_start', [aLog.title, new Date(aLog.start)]));
		result.push(bundle.getString('log_separator_testcase'));
		var count = {
				total    : 0,
				success  : 0,
				passover : 0,
				failure  : 0,
				error    : 0
			};
		var outputCount = 0;
		aLog.results.forEach(function(aResult, aIndex) {
			count[aResult.type]++;
			count.total++;
			if (aFormat & IGNORE_PASSOVER && aResult.type == 'passover') return;
			if (aFormat & IGNORE_SUCCESS && aResult.type == 'success') return;

			if (outputCount) result.push(bundle.getString('log_separator_test'));
			outputCount++;

			result.push(bundle.getFormattedString('log_test_title', [aResult.title]));
			result.push(bundle.getFormattedString('log_test_step', [aResult.step]));
			result.push(bundle.getFormattedString('log_test_timestamp', [new Date(aResult.timestamp)]));
			result.push(bundle.getFormattedString('log_test_result', [bundle.getString('report_result_'+aResult.type)]));
			if (aResult.description)
				result.push(aResult.description);
			if (aResult.expected)
				result.push(bundle.getFormattedString('log_test_expected', [aResult.expected]));
			if (aResult.actual)
				result.push(bundle.getFormattedString('log_test_actual', [aResult.actual]));
			if (aResult.diff)
				result.push(bundle.getFormattedString('log_test_diff', [aResult.diff]));
			if (aResult.stackTrace) {
				result.push('');
				result.push(aResult.stackTrace);
			}
		});
		result.push(bundle.getString('log_separator_testcase'));
		result.push(bundle.getFormattedString(aLog.aborted ? 'log_abort' : 'log_finish', [new Date(aLog.finish)]));
		result.push(bundle.getFormattedString('log_result', [count.success, count.failure, count.error, count.passover]));
		result.push(bundle.getString('log_separator_testcase'));
		result.push('');
		for (var i in count) allCount[i] += count[i];
	});
	if (result.length) {
		result.unshift('');
		result.unshift(bundle.getFormattedString('all_result_statistical', [allCount.total, allCount.success, allCount.failure, allCount.error, allCount.passover]));
		result.push('');
	}
	return result.join('\n');
}

function append(aNewItems)
{
	aNewItems.forEach(function(aOneNewItem) {
		if (this._items.some(function(aOneOldItem) {
				if (aOneOldItem.title == aOneNewItem.title &&
					aOneOldItem.source == aOneNewItem.source) {
					for (var i in aOneNewItem)
					{
						aOneOldItem[i] = aOneNewItem[i];
					}
					return true;
				}
				return false;
			}))
			return;
		this._items.push(aOneNewItem);
	}, this);
}

function clear()
{
	this._items = [];
}


function onStart(aEvent)
{
	this._items.push({
		start   : Date.now(),
		title   : aEvent.target.title,
		source  : aEvent.target.source,
		results : []
	});
}

function onTestFinish(aEvent)
{
	var report = aEvent.data;
	var result = this._createResultFromReport(report);

	var testCase = aEvent.target;
	result.index = report.testIndex;
	result.step  = (report.testIndex+1)+'/'+testCase.tests.length;
	result.percentage = parseInt((report.testIndex+1) / testCase.tests.length * 100);

	this.lastItem.results.push(result);
}
function _createResultFromReport(aReport)
{
	var result = {
		type      : aReport.result,
		title     : aReport.testDescription,
		timestamp : Date.now()
	};
	if (aReport.exception) {
		if (aReport.exception.expected)
			result.expected = aReport.exception.expected;
		if (aReport.exception.actual)
			result.actual = aReport.exception.actual;
		if (aReport.exception.diff)
			result.diff = aReport.exception.foldedDiff || aReport.exception.diff;
		result.description = aReport.exception.message.replace(/^\s+/, '');
		if (utils.hasStackTrace(aReport.exception))
			result.stackTrace = utils.formatStackTraceForDisplay(aReport.exception);
	}
	return result;
}

function onFinish(aEvent)
{
	if (aEvent.data.result == 'error') {
		var result = this._createResultFromReport(aEvent.data);
		result.index = -1;
		result.step  = '0/'+aEvent.target.tests.length
		result.percentage = 100;
		this.lastItem.results.push(result);
	}
	this.lastItem.finish = Date.now();
}

function onAbort(aEvent)
{
	this.lastItem.aborted = true;
}


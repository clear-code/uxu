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

var FORMAT_DEFUALT = FORMAT_TEXT | IGNORE_PASSOVER;// | IGNORE_SUCCESS;


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
	var totalTime = 0;
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
			result.push(_getLogTimeStr(aResult.time));
			if (aResult.detailedTime && aResult.time != aResult.detailedTime)
				result.push(_getLogTimeStr(aResult.detailedTime, true));
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
		result.push(_getLogTimeStr(aLog.time));
		result.push(bundle.getFormattedString('log_result', [count.success, count.failure, count.error, count.passover]));
		result.push(bundle.getString('log_separator_testcase'));
		result.push('');
		for (var i in count) allCount[i] += count[i];
		totalTime += aLog.time;
	});
	if (result.length) {
		result.unshift('');
		result.unshift(_getLogTimeStr(totalTime));
		result.unshift(bundle.getFormattedString('all_result_statistical', [allCount.total, allCount.success, allCount.failure, allCount.error, allCount.passover]));
		result.push('');
	}
	return result.join('\n');
}
function _getLogTimeStr(aTime, aDetailed)
{
	var key = aDetailed ? 'log_test_detailedTime' : 'log_test_time' ;
	var timeStr = bundle.getFormattedString(key, [aTime]);
	if (aTime >= 1000)
		timeStr += ' '+bundle.getFormattedString(key+'_long', [Math.round(aTime / 1000)]);
	return timeStr;
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
	var results = this._createResultsFromReport(report);

	var testCase = aEvent.target;
	results.forEach(function(aResult) {
		aResult.index = report.testIndex;
		aResult.step  = (report.testIndex+1)+'/'+testCase.tests.length;
		aResult.percentage = parseInt((report.testIndex+1) / testCase.tests.length * 100);
	}, this);

	this.lastItem.results = this.lastItem.results.concat(results);
}
function _createResultsFromReport(aReport)
{
	var results = [];
	aReport.exceptions.forEach(function(aException, aIndex) {
		var result = {
			type      : aReport.result,
			title     : aReport.testDescriptions[aIndex] || aReport.testDescription,
			timestamp : Date.now(),
			time      : aReport.time,
			detailedTime : aReport.detailedTime
		};
		if (aException.expected)
			result.expected = aException.expected;
		if (aException.actual)
			result.actual = aException.actual;
		if (aException.diff)
			result.diff = aException.foldedDiff || aException.diff;
		result.description = aException.message.replace(/^\s+/, '');
		if (utils.hasStackTrace(aException))
			result.stackTrace = utils.formatStackTraceForDisplay(aException);
		results.push(result);
	}, this);
	return results;
}

function onFinish(aEvent)
{
	if (aEvent.data.result == 'error') {
		var results = this._createResultsFromReport(aEvent.data);
		results.forEach(function(aResult) {
			aResult.index = -1;
			aResult.step  = '0/'+aEvent.target.tests.length
			aResult.percentage = 100;
		}, this);
		this.lastItem.results = this.lastItem.results.concat(results);
	}
	this.lastItem.finish = Date.now();
	this.lastItem.time = aEvent.data.time;
}

function onAbort(aEvent)
{
	this.lastItem.aborted = true;
}


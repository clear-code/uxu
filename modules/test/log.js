if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['TestLog'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/lib/stringBundle.js', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/test/testCase.js', ns);

var utils = ns.utils;
var bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');

function TestLog()
{
	this.clear();
}

TestLog.prototype = {
	FORMAT_RAW  : (1 << 0),
	FORMAT_TEXT : (1 << 1),
	//FORMAT_HTML : (1 << 2),
	//FORMAT_CSV  : (1 << 3),
	//FORMAT_TSV  : (1 << 4),

	IGNORE_SKIPPED : (1 << 10),
	IGNORE_SUCCESS : (1 << 11),

	FORMAT_DEFUALT : (1 << 0) | (1 << 10),// | (1 << 11),

	MAX_PARAMETER_LENGTH_TEXT : 80,

	get items() {
		return this._items;
	},
	set items(aValue) {
		this._items = Array.slice(aValue);
		return aValue;
	},
	get lastItem() {
		return this._items[this._items.length-1];
	},

	toString : function(aFormat)
	{
		if (!aFormat) aFormat = this.FORMAT_DEFUALT;

		if (aFormat & this.FORMAT_RAW) {
			return this._items.toSource();
		}

		return this._toText(aFormat);
	},

	_toText : function(aFormat)
	{
		var result = [];
		var allCount = {
				total    : 0,
				success  : 0,
				skip     : 0,
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
					skip     : 0,
					failure  : 0,
					error    : 0
				};
			var outputCount = 0;
			aLog.results.forEach(function(aResult, aIndex) {
				count[aResult.type]++;
				count.total++;
				if (aFormat & this.IGNORE_SKIPPED &&
					aResult.type == ns.TestCase.prototype.RESULT_SKIPPED)
					return;
				if (aFormat & this.IGNORE_SUCCESS &&
					aResult.type == ns.TestCase.prototype.RESULT_SUCCESS)
					return;

				if (outputCount) result.push(bundle.getString('log_separator_test'));
				outputCount++;

				result.push(bundle.getFormattedString('log_test_title', [aResult.title]));
				if (aResult.parameter) {
					let parameter = aResult.parameter;
					if (parameter.length > this.MAX_PARAMETER_LENGTH_TEXT)
						parameter = parameter.substr(0, this.MAX_PARAMETER_LENGTH_TEXT)+'...';
					result.push(bundle.getFormattedString('log_test_parameter', [parameter]));
				}
				result.push(bundle.getFormattedString('log_test_step', [aResult.step]));
				result.push(bundle.getFormattedString('log_test_timestamp', [new Date(aResult.timestamp)]));
				result.push(bundle.getFormattedString('log_test_result', [bundle.getString('report_result_'+aResult.type)]));
				result.push(this._getLogTimeStr(aResult.time));
				if (aResult.detailedTime && aResult.time != aResult.detailedTime)
					result.push(this._getLogTimeStr(aResult.detailedTime, true));
				if (aResult.description)
					result.push(aResult.description);
				if (aResult.expected)
					result.push(bundle.getFormattedString('log_test_expected', [aResult.expected]));
				if (aResult.actual)
					result.push(bundle.getFormattedString('log_test_actual', [aResult.actual]));
				if (aResult.diff)
					result.push(bundle.getFormattedString('log_test_diff', [aResult.diff]));
				if (aResult.stackTrace && aResult.stackTrace.length) {
					result.push('');
					result.push(aResult.stackTrace);
				}
				aResult.notifications.forEach(function(aNotification) {
					if (!aNotification.description &&
						(!aNotification.stackTrace || !aNotification.stackTrace.length))
						return;
					result.push('');
					if (aNotification.description)
						result.push(aNotification.description);
					if (aNotification.stackTrace && aNotification.stackTrace.length)
						result.push(aNotification.stackTrace);
				}, this);
			}, this);
			result.push(bundle.getString('log_separator_testcase'));
			if (aLog.aborted)
				result.push(bundle.getFormattedString('log_abort_user', [new Date(aLog.finish)]));
			else
				result.push(bundle.getFormattedString('log_finish', [new Date(aLog.finish)]));
			result.push(this._getLogTimeStr(aLog.time));
			result.push(bundle.getFormattedString('log_result', [count.success, count.failure, count.error, count.skip]));
			result.push(bundle.getString('log_separator_testcase'));
			result.push('');
			for (var i in count) allCount[i] += count[i];
			totalTime += aLog.time;
		}, this);
		if (result.length) {
			result.unshift('');
			result.unshift(this._getLogTimeStr(totalTime));
			result.unshift(bundle.getFormattedString('all_result_statistical', [allCount.total, allCount.success, allCount.failure, allCount.error, allCount.skip]));
			result.push('');
		}
		return result.join('\n');
	},
	_getLogTimeStr : function(aTime, aDetailed)
	{
		var key = aDetailed ? 'log_test_detailedTime' : 'log_test_time' ;
		var timeStr = bundle.getFormattedString(key, [aTime]);
		if (aTime >= 1000)
			timeStr += ' '+bundle.getFormattedString(key+'_long', [Math.round(aTime / 1000)]);
		return timeStr;
	},

	append : function(aNewItems)
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
	},

	clear : function()
	{
		this._items = [];
	},


	onStart : function(aEvent)
	{
		this._items.push({
			start   : Date.now(),
			title   : aEvent.target.title,
			source  : aEvent.target.source,
			results : []
		});
	},

	onTestFinish : function(aEvent)
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
	},
	_createResultsFromReport : function(aReport)
	{
		var timestamp = Date.now();
		var results = aReport.exceptions.map(function(aException, aIndex) {
				var result = this._createResultFromReport(aReport, timestamp);
				result.title = aReport.descriptions[aIndex] || result.title;
				if (aException.expected)
					result.expected = aException.expected;
				if (aException.actual)
					result.actual = aException.actual;
				if (aException.diff)
					result.diff = aException.foldedDiff || aException.diff;
				if (aException.encodedDiff)
					result.encodedDiff = aException.encodedDiff;
				result.description = aException.message.replace(/^\s+/, '');
				if (utils.hasStackTrace(aException))
					result.stackTrace = utils.formatStackTraceForDisplay(aException);
				return result;
			}, this);
		if (!results.length)
			results = [this._createResultFromReport(aReport, timestamp)];
		return results;
	},
	_createResultFromReport : function(aReport, aTimestamp)
	{
		return {
			type          : aReport.result,
			title         : aReport.description,
			parameter     : aReport.parameter,
			formattedParameter : aReport.formattedParameter,
			timestamp     : (aTimestamp || Date.now()),
			time          : aReport.time,
			detailedTime  : aReport.detailedTime,
			notifications : aReport.notifications.map(function(aNotification) {
				var type = aNotification.type || 'notification';
				var description = bundle.getFormattedString('notification_message_'+type, [aNotification.message]) ||
							aNotification.message;
				return {
					type        : type,
					description : description,
					stackTrace  : utils.formatStackTraceForDisplay(aNotification)
				};
			})
		};
	},

	onFinish : function(aEvent)
	{
		if (aEvent.data.result == ns.TestCase.prototype.RESULT_ERROR) {
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
	},

	onAbort : function(aEvent)
	{
		this.lastItem.aborted = true;
	}

};

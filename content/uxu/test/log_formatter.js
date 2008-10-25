const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var bundle = lib_module.require('package', 'bundle');


var FORMAT_RAW  = 1;
var FORMAT_TEXT = 2;
//var FORMAT_HTML = 4;
//var FORMAT_CSV  = 8;
//var FORMAT_TSV  = 16;

var IGNORE_PASSOVER = 1024;
var IGNORE_SUCCESS  = 2048;

function formatLogs(aLogs, aFormat)
{
	if (!aFormat) aFormat = 0;

	if (aFormat & FORMAT_RAW) {
		return aLogs.toSource();
	}

	return _formatLogsToText(aLogs, aFormat);
}

function _formatLogsToText(aLogs, aFormat)
{
	var result = [];
	var allCount = {
			total    : 0,
			success  : 0,
			passover : 0,
			failure  : 0,
			error    : 0
		};
	aLogs.forEach(function(aLog) {
		result.push(bundle.getString('log_separator_testcase'));
		result.push(aLog.file);
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

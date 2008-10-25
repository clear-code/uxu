const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var bundle = lib_module.require('package', 'bundle');


var FORMAT_RAW  = 1;
var FORMAT_TEXT = 2;
var FORMAT_HTML = 4;

function formatLogs(aLogs, aFormat)
{
	switch (aFormat)
	{
		case FORMAT_RAW:
			return aLogs.toSource();

		case FORMAT_TEXT:
		default:
			return _formatLogsToText(aLogs);
	}
}

function _formatLogsToText(aLogs)
{
	var result = [];
	aLogs.forEach(function(aLog) {
		result.push(bundle.getString('log_separator_testcase'));
		result.push(aLog.file);
		result.push(bundle.getFormattedString('log_start', [aLog.title, new Date(aLog.start)]));
		result.push(bundle.getString('log_separator_testcase'));
		var last = aLog.results.length -1;
		aLog.results.forEach(function(aResult, aIndex) {
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
			if (aIndex < last) result.push(bundle.getString('log_separator_test'));
		});
		result.push(bundle.getString('log_separator_testcase'));
		result.push(bundle.getFormattedString(aLog.aborted ? 'log_abort' : 'log_finish', [new Date(aLog.finish)]));
		result.push(bundle.getString('log_separator_testcase'));
		result.push('');
	});
	if (result.length) {
		result.push('');
	}
	return result.join('\n');
}

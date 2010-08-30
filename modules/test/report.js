if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['Report'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/lib/stringBundle.js', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/test/testCase.js', ns);

var utils = ns.utils;
var bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');

/**
 * @class Report for tests. One report is mapped to one context
 *        and multiple topics.
 */
function Report()
{
	this._description   = null;
	this._result        = null;
	this._topics        = [];
	this._notifications = [];
	this.owner          = null;
	this.id             = null;
	this.index          = -1;

	this._startAt = -1;
	this._finishAt = -1;

	this._startAtDetailed = -1;
	this._finishAtDetailed = -1;

	this.onStart();
}

Report.prototype = {

	/**
	 * The description for the context. If there is no specified value,
	 * this inherits the description of the last topic of the report itself.
	 */
	get description()
	{
		return this._description || this.lastDescription;
	},
	set description(aValue)
	{
		return this._description = aValue;
	},
	_description : null,

	/**
	 * The total result of the context. If there is any error except AssertionFailed,
	 * this is "error". If there is any AssertionFailed, this is "failure". Otherwise
	 * this inherits the last result.
	 */
	get result()
	{
		return !this.hasTopic() ? this._result :
				(this._result || this.lastResult);
	},
	_result : null,

	/**
	 * Topics for the context.
	 */
	_topics : [],

	/**
	 * Formatted topics
	 */
	get topics()
	{
		if (!this._timestamp)
			this._timestamp = Date.now();

		return this._topics.map(this._formatTopic, this);
	},
	_timestamp : null,

	_formatTopic : function(aTopic)
	{
		if (aTopic._formatted)
			return aTopic;

		aTopic.parameter          = this.parameter;
		aTopic.formattedParameter = this.formattedParameter;
		aTopic.timestamp          = this._timestamp;
		aTopic.time               = this.time;
		aTopic.detailedTime       = this.detailedTime;
		aTopic.notifications      = this.notifications;

		if (aTopic.exception) {
			let e = aTopic.exception;
			if (e.expected)
				aTopic.expected = e.expected;
			if (e.actual)
				aTopic.actual = e.actual;
			if (e.diff)
				aTopic.diff = e.foldedDiff || e.diff;
			if (e.encodedDiff)
				aTopic.encodedDiff = e.encodedDiff;
			aTopic.message = e.message.replace(/^\s+/, '');
			if (utils.hasStackTrace(e))
				aTopic.stackTrace = utils.formatStackTraceForDisplay(e);
		}

		aTopic.index = this.index === void(0) ? -1 : this.index ;
		aTopic.step = this.step === void(0) ? '0/0' : this.step ;
		aTopic.percentage = this.percentage === void(0) ? 100 : this.percentage ;

		aTopic._formatted = true;
		return aTopic;
	},

	/**
	 * @param {{result      : string,
	 *          description : string,
	 *          exception   : Error}} aTopic
	 */
	addTopic : function(aTopic)
	{
		if (!aTopic)
			return;

		if (!aTopic.description && this.description)
			aTopic.description = this.description;

		if (!aTopic.exception)
			aTopic.exception = null;

		if ((!this._result && aTopic.result == ns.TestCase.prototype.RESULT_ERROR) ||
			aTopic.result == ns.TestCase.prototype.RESULT_FAILURE)
			this._result = aTopic.result;

		this._topics.push(aTopic);
	},

	hasTopic : function()
	{
		return this._topics.length > 0;
	},

	get lastTopic()
	{
		return this.hasTopic() ? this._topics[this._topics.length-1] : null ;
	},

	get lastResult()
	{
		return this.hasTopic() ? this.lastTopic.result : null ;
	},

	get lastDescription()
	{
		return this.hasTopic() ? this.lastTopic.description : null ;
	},

	get notifications()
	{
		return this._notifications;
	},
	set notifications(aValue)
	{
		return this._notifications = aValue.map(function(aNotification) {
					var type = aNotification.type || 'notification';
					var description = bundle.getFormattedString(
										'notification_message_'+type,
										[aNotification.message]
									) ||
									aNotification.message;
					return {
						type        : type,
						description : description,
						stackTrace  : utils.formatStackTraceForDisplay(aNotification)
					};
				});
	},
	_notifications : [],

	get time() {
		return (this._startAt < 0 || this._finishAt < 0) ?
			0 :
			this._finishAt - this._startAt ;
	},
	get detailedTime() {
		return (this._startAtDetailed < 0 || this._finishAtDetailed < 0) ?
			0 :
			this._finishAtDetailed - this._startAtDetailed ;
	},

	onStart : function()
	{
		this._startAt = Date.now();
	},

	onFinish : function()
	{
		this._finishAt = Date.now();
	},

	onDetailedStart : function()
	{
		this._startAtDetailed = Date.now();
	},

	onDetailedFinish : function()
	{
		this._finishAtDetailed = Date.now();
	}
};

var topDir = baseURL+'../../../../';

var ns = utils.import(topDir+'modules/test/mock.js', {});
var MockManager = ns.MockManager;
var Mock = ns.Mock;
var FunctionMock = ns.FunctionMock;
var GetterMock = ns.GetterMock;
var SetterMock = ns.SetterMock;
var HTTPServerMock = ns.HTTPServerMock;
var TypeOf = ns.TypeOf;

var MultiplexError = utils.import(topDir+'modules/multiplexError.js', {}).MultiplexError;

var Assertions = utils.import(topDir+'modules/test/assertions.js', {}).Assertions;

var bundle = utils.import(topDir+'modules/lib/stringBundle.js', {})
				.stringBundle.get('chrome://uxu/locale/uxu.properties');

function toParamsWithoutInternalHandlers(aCall) {
	var params = aCall.toParams()
	if (params.handlers) {
		params.handlers = params.handlers
							.filter((aHandler) => !aHandler.internal);
		if (params.handlers.length === 0)
			delete params.handlers;
	}
	if (params.errorHandlers) {
		params.errorHandlers = params.errorHandlers
								.filter((aHandler) => !aHandler.internal);
		if (params.errorHandlers.length === 0)
			delete params.errorHandlers;
	}
	return params;
}

function toExpectedCallParams(aMock) {
	return aMock.expectedCalls.map(toParamsWithoutInternalHandlers);
}

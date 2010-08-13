if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['MultiplexError'];

function MultiplexError(aErrorsArray)
{
	var error = new Error();
	error.name = 'MultiplexError';
	var errors = [];
	aErrorsArray.forEach(function(aError) {
		if (aError.name == 'MultiplexError')
			errors = errors.concat(aError.errors);
		else
			errors.push(aError);
	});

	if (errors.length == 1)
		return errors[0];

	error.errors = errors;
	return error;
}

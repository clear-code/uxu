utils.include('../../../../components/GlobalService.js');

var service;

function setUp()
{
	service = new GlobalService();
}

function tearDown()
{
}

function testGetInstallLocation()
{
	var dir = utils.getFileFromKeyword('CurProcD');
	dir.append('extensions');
	dir.append('uxu@clear-code.com');
	assert.equals(dir.path, service.globalLocation.path);

	var id = 'uxu@clear-code.com';
	dir = Cc['@mozilla.org/extensions/manager;1']
			.getService(Ci.nsIExtensionManager)
			.getInstallLocation(id)
			.getItemLocation(id);
	assert.equals(dir.path, service.installedLocation.path);
}

function testGetVersion()
{
	var file = utils.getFileFromURLSpec(baseURL+'../../fixtures/element.install.rdf');
	assert.isNotNull(file);
	var version = service.getVersionFromManifest(file);
	assert.equals('0.12.3.45', version);

	file = utils.getFileFromURLSpec(baseURL+'../../fixtures/attribute.install.rdf');
	assert.isNotNull(file);
	version = service.getVersionFromManifest(file);
	assert.equals('0.12.3.45', version);
}

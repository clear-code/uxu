// -*- indent-tabs-mode: t; tab-width: 4 -*-
var parallel = false;

utils.include('utils_common.inc.js');


function test_getDB()
{
	var db = utilsModule.getDB();
	assert.isTrue(db instanceof Ci.mozIStorageConnection);
}

function test_openDatabase()
{
	var db = utilsModule.openDatabase(baseURL+'../../fixtures/test.sqlite');
	assert.isTrue(db instanceof Ci.mozIStorageConnection);

	var statement = db.createStatement('SELECT value FROM test_table WHERE key = "key1"');
	statement.executeStep();
	assert.equals('value1', statement.getString(0));
}

function test_createDatabase()
{
	var db = utilsModule.createDatabase();
	assert.isTrue(db instanceof Ci.mozIStorageConnection);
	assert.equals(utilsModule.getFileFromKeyword('TmpD').path, db.databaseFile.parent.path);
	utils.scheduleToRemove(db.databaseFile);
}

function test_createDatabaseFromSQL()
{
	var db = utilsModule.createDatabaseFromSQL(<![CDATA[
DROP TABLE IF EXISTS "foo_table";
CREATE TABLE "foo_table" ("key" TEXT PRIMARY KEY  NOT NULL , "value" TEXT);
INSERT INTO "foo_table" VALUES('foo','bar');
INSERT INTO "foo_table" VALUES('hoge','fuga');
	]]>.toString());

	assert.isTrue(db instanceof Ci.mozIStorageConnection);
	assert.equals(utilsModule.getFileFromKeyword('TmpD').path, db.databaseFile.parent.path);

	var statement = db.createStatement('SELECT value FROM foo_table WHERE key = "hoge"');
	statement.executeStep();
	assert.equals('fuga', statement.getString(0));

	utils.scheduleToRemove(db.databaseFile);
}

function test_createDatabaseFromSQLFile()
{
	var db = utilsModule.createDatabaseFromSQLFile(baseURL+'../../fixtures/test.sql', 'UTF-8');

	assert.isTrue(db instanceof Ci.mozIStorageConnection);
	assert.equals(utilsModule.getFileFromKeyword('TmpD').path, db.databaseFile.parent.path);

	var statement = db.createStatement('SELECT value FROM test_table WHERE key = "key2"');
	statement.executeStep();
	assert.equals('value2', statement.getString(0));

	utils.scheduleToRemove(db.databaseFile);
}

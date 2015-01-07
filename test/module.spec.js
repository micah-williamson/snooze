describe('Module', function() {
	'use strict';

	var Module;
	var snooze;
	var should = require('should');

	beforeEach(function() {
		snooze = require('../index.js');
		snooze.clear();

		Module = snooze.module('Test', []);
	});

	it('should be defined', function() {
		Module.should.not.equal(undefined);
	});

	// tests that the service method is modular to the Module
	it('should not have the service method', function() {
		(typeof Module.service).should.equal('undefined');
	});

	it('should have a name', function() {
		Module.name.should.equal('Test');
	});

	it('should have an empty config', function() {
		Object.keys(Module.config).length.should.equal(0);
	});

	it('should have an empty config', function() {
		Object.keys(Module.config).length.should.equal(0);
	});

	it('should have no runs', function() {
		Module.runs.length.should.equal(0);
	});

	it('should have no configs (config runs)', function() {
		Module.configs.length.should.equal(0);
	});

	it('should have no modules', function() {
		Module.modules.length.should.equal(0);
	});

	it('should have no importedModules', function() {
		Object.keys(Module.importedModules).length.should.equal(0);
	});

	it('should have snooze', function() {
		Module.snooze.should.not.equal(undefined);
	});

	it('should define and EntityManager', function() {
		Module.EntityManager.should.not.equal(undefined);
	});

	it('should have 2 importProcesses', function() {
		Module.importProcesses.length.should.equal(2);
	});

	it('should run a run process', function() {
		var ran = false;
		
		Module.run(function() {
			ran = true;
		});

		ran.should.equal(false);

		Module.doRuns();

		ran.should.equal(true);
	});

	it('should import the Test2 Module', function() {
		snooze.module('Test2', []);
		Module.addModules(['Test2']);
		Module.modules.length.should.equal(1);
	});

	it('should import transient importProcesses, configPreprocessors, and Entities', function(done) {
		var TestEntity = new snooze.EntityGroup();
		TestEntity.type = 'test';
		TestEntity.compile = function(entity, entityManager) {
			entity.instance = entity.constructor;
		};
		TestEntity.registerDependencies = function() {};
		TestEntity.getInject = function(entity, entityManager) {
			return entity.instance;
		};

		snooze.module('Test3', []).EntityManager.registerEntityGroup(TestEntity);

		snooze.module('Test3')
			.importProcess(function() {
				return function() {
					return 'foo';
				};
			})
			.configPreprocessor(function() {
				return function() {
					return 'foo';
				};
			})
			.test('MyTest', 'foo');
		
		snooze.module('Test4', ['Test3']);

		var Test5 = snooze.module('Test5', ['Test4'])
						.run(function(MyTest) {
							MyTest.should.equal('foo');
							done();
						})
						.wakeup();

		Test5.importProcesses[Test5.importProcesses.length-1]().should.equal('foo');
		Test5.configPreprocessors[Test5.configPreprocessors.length-1]().should.equal('foo');
	});

	it('should run an importProcess', function() {
		snooze.module('Test2', []);
		Module.addModules(['Test2']);

		var ran = false;
		
		Module.importProcess(function() {
			return function() {
				ran = true;
			};
		});

		ran.should.equal(false);

		Module.importModules();

		ran.should.equal(true);
	});
});
describe('EntityGroup', function() {
	'use strict';

	var EntityGroup;
	var snooze;
	var initServiceGroup;
	var registerServiceGroup;
	var createTestService;
	var createTest2Service;
	var should = require('should');

	beforeEach(function() {
		snooze = require('../index.js');
		snooze.module('Test', []);
		snooze.clear();

		EntityGroup = new snooze.EntityGroup();

		initServiceGroup = function() {
			EntityGroup.type = 'service';
			EntityGroup.compile = function(entity, entityManager) {
				entity.instance = entityManager.run(entity.constructor);

				if(entity.instance.$compile) {
					entity.instance.$compile();
				}
			};
			EntityGroup.registerDependencies = function(entity, entityManager) {
				if(typeof entity.constructor === 'function') {
					entity.dependencies = snooze.Util.getParams(entity.constructor);
				} else {
					throw Error('Services expect function constructors. ' + (typeof entity.constructor) + ' given');
				}
			};
			EntityGroup.getInject = function(entity, entityManager) {
				if(entity.instance) {
					if(entity.instance.$get) {
						return entity.instance.$get;
					}
				}

				return entity.instance;
			};
		};

		registerServiceGroup = function() {
			snooze.module('Test').EntityManager.registerEntityGroup(EntityGroup);
		};

		createTestService = function() {
			snooze.module('Test').service('Test', function() {
				return {
					message: 'Foo Bar'
				};
			});
			snooze.module('Test').EntityManager.compile();
		};

		createTest2Service = function() {
			snooze.module('Test').service('Test2', function(Test) {
				return {
					Test: Test,
					message: 'Hello World'
				};
			});
			snooze.module('Test').EntityManager.compile();
		};
	});

	it('should be defined', function() {
		EntityGroup.should.not.equal(undefined);
	});

	it('should set and get the type', function() {
		EntityGroup.type = 'test';
		EntityGroup.getType().should.equal('test');
	});

	it('should thrown an error when compiling and entity', function() {
		var thrown = false;

		try {
			EntityGroup.compile();
		} catch(e) {
			thrown = true;
		}

		thrown.should.equal(true);
	});

	it('should thrown an error when getting an entity config', function() {
		var thrown = false;

		try {
			EntityGroup.getConfig();
		} catch(e) {
			thrown = true;
		}

		thrown.should.equal(true);
	});

	it('should thrown an error when injecting an entity', function() {
		var thrown = false;

		try {
			EntityGroup.getInject();
		} catch(e) {
			thrown = true;
		}

		thrown.should.equal(true);
	});

	it('should thrown an error when registering and entity dependencies', function() {
		var thrown = false;

		try {
			EntityGroup.registerDependencies();
		} catch(e) {
			thrown = true;
		}

		thrown.should.equal(true);
	});

	it('should register the service EntityGroup', function() {
		initServiceGroup();
		registerServiceGroup();
		snooze.module('Test').service.should.not.equal(undefined);
	});

	it('should create a Test service using the Module.service method', function() {
		initServiceGroup();
		registerServiceGroup();

		snooze.module('Test').EntityManager.entities.length.should.equal(0);

		createTestService();

		snooze.module('Test').EntityManager.entities.length.should.equal(1);
	});

	it('should inject the Test service', function() {
		initServiceGroup();
		registerServiceGroup();
		createTestService();

		var Test = snooze.module('Test').EntityManager.getEntity('Test');
		var injection = EntityGroup.getInject(Test);

		injection.message.should.equal('Foo Bar');
	});

	it('should inject the Test service in a run method', function(done) {
		initServiceGroup();
		registerServiceGroup();
		createTestService();

		snooze.module('Test')
			.run(function(Test) {
				Test.message.should.equal('Foo Bar');
				done();
			})
			.wakeup();
	});

	it('should inject Test2 into Test and Test service in a run method. Test should be available through the Test2 service.', function(done) {
		initServiceGroup();
		registerServiceGroup();
		createTestService();
		createTest2Service();

		snooze.module('Test')
			.run(function(Test2, Test) {
				Test2.Test.should.equal(Test);
				done();
			})
			.wakeup();
	});

	it('should register Test as a dependency of Test2', function() {
		initServiceGroup();
		registerServiceGroup();
		createTestService();
		createTest2Service();

		var Test2 = snooze.module('Test').EntityManager.getEntity('Test2');
		Test2.dependencies.length.should.equal(1);
	});

	it('should overwrite a service', function(done) {
		initServiceGroup();
		registerServiceGroup();
		
		snooze.module('Test')
			.service('Test', function() {
				return {
					foo: 'bar'
				};
			})
			.service('Test', function() {
				return {
					foo: 'baz'
				};
			})
			.run(function(Test) {
				Test.foo.should.equal('baz');
				done();
			})
			.wakeup();
	});

	it('should overwrite a service after compile', function(done) {
		initServiceGroup();
		registerServiceGroup();
		
		snooze.module('Test')
			.service('Test', function() {
				return {
					foo: 'bar'
				};
			})
			.run(function(Test) {
				Test.foo.should.equal('bar');
				snooze.module('Test')
					.service('Test', function() {
						return {
							foo: 'baz'
						};
					});
			})
			.run(function(Test) {
				Test.foo.should.equal('baz');
				done();
			})
			.wakeup();
	});
});
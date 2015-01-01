describe('Entity', function() {
	'use strict';

	var Entity;
	var snooze;
	var should = require('should');

	beforeEach(function() {
		snooze = require('snooze');
		snooze.clear();

		Entity = new snooze.Entity();
	});

	it('should be defined', function() {
		Entity.should.not.equal(undefined);
	});

	it('should not be compiled', function() {
		Entity.compiled.should.equal(false);
	});

	it('should not be private', function() {
		Entity.private.should.equal(false);
	});

	it('should be injectable', function() {
		Entity.injectable.should.equal(true);
	});

	it('should not have a constructor', function() {
		(Entity.constructor+'').should.equal('null');
	});

	it('should not have an instance', function() {
		(Entity.instance+'').should.equal('null');
	});

	it('should have no dependencies', function() {
		Entity.dependencies.length.should.equal(0);
	});

	it('should set and get the name', function() {
		Entity.name = 'test';
		Entity.getName().should.equal('test');
	});

	it('should set and get the type', function() {
		Entity.type = 'test';
		Entity.getType().should.equal('test');
	});

	it('should add and get the dependencies', function() {
		Entity.dependencies.push(1);
		Entity.getDependencies().length.should.equal(1);
	});
});
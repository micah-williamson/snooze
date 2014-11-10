var snooze = require('snooze');
var sequelize = require('sequelize');
var fs = require('fs');

snooze.module('snooze-baselib').service('$conn', function($module, $q) {
	var conn = null;
	var config = $module.getConfig();
	var connSettings = {};
	var _mode = null;

	var connect = function(mode) {
		_mode = mode;

		if(conn != null) {
			_close();
		}

		if(config.db !== undefined && config.db.connections !== undefined) {
			if(Object.keys(config.db.connections).length < 1) {
				snooze.fatal(new Error('Fatal Error: no connections defined for the seq service in snooze.json'));
			}

			var _conn = null;
			var _connName = null;

			for(var connNm in config.db.connections) {
				var tmpConn = config.db.connections[connNm];
				if(tmpConn.mode === mode) {
					_connName = connNm;
					_conn = tmpConn;

					break;
				}
			}

			if(_conn !== null) {
				var host = _conn.host;
				var database = _conn.database || '';
				var port = _conn.port || 3306;
				var user = _conn.user;
				var password = _conn.password;
				var engine = _conn.engine;
				var options = {
					logging: $module.log
				};

				if(host !== undefined) {
					if(user !== undefined) {
						if(password !== undefined) {
							if(engine !== undefined) {

								connSettings.host = host;
								connSettings.database = database;
								connSettings.port = port;
								connSettings.user = user;
								connSettings.engine = engine;

								var conn_str = engine + '://' + user + ':' + password + '@' + host + ':' + port + '/' + database;

								conn = new sequelize(conn_str, options);
								conn.sequelize = sequelize;
							} else {
								snooze.fatal(new Error('Fatal Error: seq connection ' + _connName + ' doesn\'t define an engine'));
							}
						} else {
							snooze.fatal(new Error('Fatal Error: seq connection ' + _connName + ' doesn\'t define a password'));
						}
					} else {
						snooze.fatal(new Error('Fatal Error: seq connection ' + _connName + ' doesn\'t define a user'));
					}
				} else {
					snooze.fatal(new Error('Fatal Error: seq connection ' + _connName + ' doesn\'t define a host'));
				}
			} else {
				snooze.fatal(new Error('Fatal Error: no db connection found for mode `' + mode + '` in snooze.json'));
			}
		} else {
			snooze.fatal(new Error('Fatal Error: no db config found for the seq service in snooze.json'));
		}
	};

	var $get = function() {
		conn.truncateAll = function(md) {
			var defer = $q.defer();

			if(md === _mode) {
				conn.query('SHOW TABLES;').success(function(rows) {
					var _runQry = function(qry, queries) {
						if(qry !== undefined) {
							conn.query(qry).success(function() {
								_runQry(queries.shift(), queries);
							});
						} else {
							defer.resolve();
						}
					};

					var qries = [];

					for(var i = 0; i < rows.length; i++) {
						var row = rows[i];
						qries.push('TRUNCATE ' + row + ';');
					}

					_runQry(qries.shift(), qries);
				});
			} else {
				snooze.fatal(new Error('Truncate cannot be called. Mode confirmation does not match.'));
			}

			return defer.promise;
		};

		return conn;
	};

	var getConnSettings = function() {
		return connSettings;
	};

	var _close = function() {

	};

	connect(config.mode);

	return {
		$get: $get,
		connect: connect,
		getConnSettings: getConnSettings,
		close: _close
	}
});
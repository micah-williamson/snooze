module.exports = function() {
	this.name = 'SequelizeNotFoundException';
	this.message = 'Sequelize (specifically the $conn service) was not found in your project. Was snooze-stdlib included in your project?';
};
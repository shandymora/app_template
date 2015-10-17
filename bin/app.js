/*
 * project:	app_template
 * author: 	amora
 * 
 */

// Include modules
var config		= require('./config');
var client		= require('./client');
var server		= require('./server');
var utility		= require('./utility');
var cluster     = require('./cluster');

// Logging parameters
var currentDir = config.currentDir;
var logger = config.app_data.logger;

function start(oSettings) {
	
	// Setup app cluster
	if ( oSettings.app.cluster.enabled ) {
		cluster.clusterApp(oSettings.app.cluster, function() {
			if (logger.logLevel.info == true) { logger.log.info('App cluster enabled'); }
			// Do something useful
		});
	}
	
	// Initialize statsd client
	 config.app_data.statsd = new client.statsd(oSettings.client.statsd);
	// Setup timer to send health stats every 60s
	 utility.send_health_stats('app');
	
	// start http servers
	server.start_http_servers(oSettings);
	
	// start tcp servers
	server.start_tcp_servers(oSettings);

	// Connect to Redis
	client.start_redis_clients(oSettings, function() {
		// Start services, call functions reliant on redis client connections
	});
	
	// start amqp clients
	client.start_amqp_clients(oSettings, parseMessage, function() {
		// Start services, call functions reliant on AMQP client connections
		console.log("completed function start_amqp_clients");
	});
	
	/*
	 * 	Reload config
	 */
	if ( config.settings.app.auto_reload_config == true ) {
		// Refresh config
		setInterval( function() {
			if (logger.logLevel.info == true) { logger.log.info('Refreshing config'); }
			// Read in config file
			utility.readConfig(config.configFile);
			
			// Re-configure app based on updated config
			
		}, 60000);
	}

}

function parseMessage(queue, message) {
	console.log('Consumer queue: '+queue+'received message: '+message.content.toString());
}

function parse_data(data) {
	console.log("received some data from a TCP server");
}

function exceptionHandler() {
	process.on('uncaughtException', function(err) {
	    // handle and log the error safely
	    console.log('BIG ASS UNHANDLED EXCEPTION: '+JSON.stringify(err,undefined,2));
	});
}

// Module exports
exports.start = start;

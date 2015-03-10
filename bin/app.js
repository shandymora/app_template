// Include modules
var config		= require('./config');
var $			= require('jquery');
var client		= require('./client');
var server		= require('./server');
var utility		= require('./utility');

// Logging parameters
var logLevel = config.logLevel;
var log = config.log;
var currentDir = config.currentDir;

function start(oSettings) {
	
	// initialize statsd client
	utility.statsd = new client.statsd(oSettings.client.statsd);
	
	// start http server
	server.http_server(oSettings.server.http);

			
}

function isMaster(node, done) {
	client.httpConn(
		{
			oSettings: {
				url:		'http://'+node+':'+config.settings.server.http.port+'/health?cluster=is_master',
				sMethod:	'GET'
			}
		}, 
		function(err, statusCode, response) {
			if (err) {
				if (logLevel.error == true) { log.error('isMaster error', {node: node, response: response, statuscode: statusCode}); }
				
				// Record whether node is up
				if ( node in config.health.cluster.nodes) {
					config.health.cluster.nodes[node].available = false;
				} else {
					config.health.cluster.nodes[node] = {
						available:	false
					};
				}
				
				done(false, node); 
			}
			else {
				
				// Record whether node is up
				if ( node in config.health.cluster.nodes) {
					config.health.cluster.nodes[node].available = true;
				} else {
					config.health.cluster.nodes[node] = {
						available:	true
					};
				}
				
				if ( response.is_master == true ) {
					done(true, node);
				} else {
					done(false, node);
				}
			
				
			}
		});

}

function clusterApp(oSettings) {
	
	// Determine master
	
	// Are any nodes already up, what are their state?
	var node_index = 0;
	var found_master = false;
	config.settings.app.nodes.forEach( function(node) {
		if ( node != config.my_hostname   ) { 
			// Get node status
			isMaster(node, function(masterFound, checked_node) {
				if (masterFound) {
					
					if ( checked_node != config.health.cluster.master ) {
						// New master found
						if (logLevel.debug == true) { log.debug('New master: '+checked_node); }
						for (var bot in config.settings.client.ircBot) {
							app_clients[bot].sendMessage('New master: '+checked_node);
						}
					}
					
					config.health.cluster.master = checked_node;
					config.health.cluster.is_master = false;
					found_master = true;
/*
					if (logLevel.debug == true) { log.debug('Set master: '+checked_node); }
					for (var bot in oSettings.client.ircBot) {
						app_clients[bot].sendMessage('Set master: '+checked_node);
					}
*/
				} 
				node_index += 1;
				
				if ( node_index == config.settings.app.nodes.length ) {
					if ( ! found_master ) {
						// I will be master as I didn't find any
						config.health.cluster.master = config.my_hostname;
						config.health.cluster.is_master = true;
						for (var bot in config.settings.client.ircBot) {
							app_clients[bot].sendMessage('I am master');
						}
					}
				}
			});
			
		} else {
			node_index += 1;
		}
		
	});
	
	// Schedule regular checks of all nodes
	setInterval( function() {
		node_index = 0;
		found_master = false;
		config.settings.app.nodes.forEach( function(node) {
			if ( node != config.my_hostname   ) { 
				// Get node status
				isMaster(node, function(masterFound, checked_node) {
					if (masterFound) {
						
						if ( checked_node != config.health.cluster.master ) {
							// New master found
							if (logLevel.debug == true) { log.debug('New master: '+checked_node); }
							for (var bot in config.settings.client.ircBot) {
								app_clients[bot].sendMessage('New master: '+checked_node);
							}
						}
					
						config.health.cluster.master = checked_node;
						config.health.cluster.is_master = false;
						found_master = true;
//						if (logLevel.debug == true) { log.debug('Set master: '+checked_node); }
					}
					node_index += 1;
					
					if ( node_index == config.settings.app.nodes.length ) {
						if ( ! found_master ) {
							// I will be master as I didn't find any
							config.health.cluster.master = config.my_hostname;
							config.health.cluster.is_master = true;
						}
					}
				});
			} else {
				node_index += 1;
			}
			
		});
	}, oSettings.heartbeat);
}

function exceptionHandler() {
	process.on('uncaughtException', function(err) {
	    // handle and log the error safely
	    console.log('BIG ASS UNHANDLED EXCEPTION: '+JSON.stringify(err,undefined,2));
	});
}

// Module exports
exports.start = start;

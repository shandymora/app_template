/*
 * project:	app_template
 * author: 	amora
 * 
 */

var client			= require("./client");
var config			= require("./config");

function isMaster(node, done) {
	client.httpConn(
		{
			hostname: 	node,
			port:		config.settings.server.http.port[0],
			method:		'GET',
			path:		'/health?cluster=is_master'
			
		}, 
		function(err, statusCode, response) {
			if (err) {
				if (logger.logLevel.error == true) { logger.log.error('isMaster error', {node: node, response: response, statuscode: statusCode}); }
				
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

function clusterApp(oSettings, done) {
	// Schedule regular checks of all nodes
	setInterval( function() {
		node_index = 0;
		found_master = false;
		oSettings.nodes.forEach( function(node) {
			if ( node != config.my_hostname   ) { 
				// Get node status
				isMaster(node, function(masterFound, checked_node) {
					if (masterFound) {
						
						if ( checked_node != config.health.cluster.master ) {
							// New master found
							if (logger.logLevel.debug == true) { logger.log.debug('New master: '+checked_node); }
							if ( 'ircBot' in config.settings.client ) {
								for (var bot in config.settings.client.ircBot) {
									app_clients[bot].sendMessage('New master: '+checked_node);
								}
							}
						}
					
						config.health.cluster.master = checked_node;
						config.health.cluster.is_master = false;
						found_master = true;
//						if (logger.logLevel.debug == true) { logger.log.debug('Set master: '+checked_node); }
					}
					node_index += 1;
					
					if ( node_index == oSettings.nodes.length ) {
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
	
	// Determine master	
	// Are any nodes already up, what are their state?
	var node_index = 0;
	var found_master = false;
	oSettings.nodes.forEach( function(node) {
		if ( node != config.my_hostname   ) { 
			// Get node status
			isMaster(node, function(masterFound, checked_node) {
				if (masterFound) {
					
					if ( checked_node != config.health.cluster.master ) {
						// New master found
						if (logger.logLevel.debug == true) { logger.log.debug('New master: '+checked_node); }
						if ( 'ircBot' in config.settings.client ) {
							for (var bot in config.settings.client.ircBot) {
								config.app_data.ircBots[bot].sendMessage('New master: '+checked_node);
							}
						}
							
					}
					
					config.health.cluster.master = checked_node;
					config.health.cluster.is_master = false;
					found_master = true;
/*
					if (logger.logLevel.debug == true) { logger.log.debug('Set master: '+checked_node); }
					for (var bot in oSettings.client.ircBot) {
						app_clients[bot].sendMessage('Set master: '+checked_node);
					}
*/
				} 
				node_index += 1;
				
				if ( node_index == oSettings.nodes.length ) {
					if ( ! found_master ) {
						// I will be master as I didn't find any
						config.health.cluster.master = config.my_hostname;
						config.health.cluster.is_master = true;
						if ( 'ircBot' in config.settings.client ) {
							for (var bot in config.settings.client.ircBot) {
								config.app_data.ircBots[bot][bot].sendMessage('I am master');
							}
						}
					}
					if ( done ) { done(); }
				}
			});
			
		} else {
			node_index += 1;
			if ( node_index == oSettings.nodes.length ) {
				if ( ! found_master ) {
					// I will be master as I didn't find any
					config.health.cluster.master = config.my_hostname;
					config.health.cluster.is_master = true;
					if ( 'ircBot' in config.settings.client ) {
						for (var bot in config.settings.client.ircBot) {
							config.app_data.ircBots[bot][bot].sendMessage('I am master');
						}
					}
				}
				if ( done ) { done(); }
			}
		}
		
	});
	
	
}

exports.clusterApp = clusterApp;
exports.isMaster = isMaster;

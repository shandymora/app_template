/*
 * project:	app_template
 * author: 	amora
 * 
 */

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

config.app_data = {
	tcp_servers:			{},
	http_servers:			{},
	redis_clients:			{},
	ircBots:				{}
};

function start(oSettings) {
	
	// Setup app cluster
	clusterApp(oSettings.app.cluster);
	
	// initialize statsd client
	utility.statsd = new client.statsd(oSettings.client.statsd);
	
	// Setup timer to send health stats every 60s
	send_health_stats();
	
	// start http servers
	server.start_http_servers(oSettings);
	
	// start tcp servers
	server.start_tcp_servers(oSettings, parse_data);

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
	oSettings.nodes.forEach( function(node) {
		if ( node != config.my_hostname   ) { 
			// Get node status
			isMaster(node, function(masterFound, checked_node) {
				if (masterFound) {
					
					if ( checked_node != config.health.cluster.master ) {
						// New master found
						if (logLevel.debug == true) { log.debug('New master: '+checked_node); }
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
					if (logLevel.debug == true) { log.debug('Set master: '+checked_node); }
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
		oSettings.nodes.forEach( function(node) {
			if ( node != config.my_hostname   ) { 
				// Get node status
				isMaster(node, function(masterFound, checked_node) {
					if (masterFound) {
						
						if ( checked_node != config.health.cluster.master ) {
							// New master found
							if (logLevel.debug == true) { log.debug('New master: '+checked_node); }
							if ( 'ircBot' in config.settings.client ) {
								for (var bot in config.settings.client.ircBot) {
									app_clients[bot].sendMessage('New master: '+checked_node);
								}
							}
						}
					
						config.health.cluster.master = checked_node;
						config.health.cluster.is_master = false;
						found_master = true;
//						if (logLevel.debug == true) { log.debug('Set master: '+checked_node); }
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
}

function exceptionHandler() {
	process.on('uncaughtException', function(err) {
	    // handle and log the error safely
	    console.log('BIG ASS UNHANDLED EXCEPTION: '+JSON.stringify(err,undefined,2));
	});
}

function send_health_stats() {
	// Periodically send health status to StatsD, hard coded to 60s
	var last = {
		num_full_gc:	0,
		num_inc_gc:		0
	};
	
	var healthTimer = setInterval( function() {
		console.log('Sending health to StatsD');
		
		// Calculate change in counters over interval period.  Hardcoded to 60secs currently.
		var count_full_gc = config.health.memory.heap.num_full_gc - last.num_full_gc;
		var count_inc_gc = config.health.memory.heap.num_inc_gc - last.num_inc_gc;
		
		utility.statsd.client.gauge(utility.statsd.prefix+'.health.memory.heap.current_base', config.health.memory.heap.current_base);
		utility.statsd.client.gauge(utility.statsd.prefix+'.health.memory.heap.estimated_base', config.health.memory.heap.estimated_base);
		utility.statsd.client.gauge(utility.statsd.prefix+'.health.memory.heap.usage_trend', config.health.memory.heap.usage_trend);
		utility.statsd.client.gauge(utility.statsd.prefix+'.health.memory.heap.full_gc_count', config.health.memory.heap.num_full_gc);
		utility.statsd.client.gauge(utility.statsd.prefix+'.health.memory.heap.inc_gc_count', config.health.memory.heap.num_inc_gc);
		
		utility.statsd.client.increment(utility.statsd.prefix+'.health.memory.heap.full_gc', count_full_gc);
		utility.statsd.client.increment(utility.statsd.prefix+'.health.memory.heap.inc_gc', count_inc_gc);
		
		last.num_full_gc = config.health.memory.heap.num_full_gc;
		last.num_inc_gc = config.health.memory.heap.num_inc_gc;
		
	}, 60000);
}

// Module exports
exports.start = start;

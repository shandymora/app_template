/*
 * project:	app_template
 * author: 	amora
 * 
 */

// Include modules
var url 		= require('url');
var handlers 	= require('./handlers');

var handle_http = {
	"/" : 				handlers.start,
  	"/health":  		handlers.appHealth
};

var handle_tcp = {
	2023:	handlers.fnPort_2023,
	2024:	handlers.fnPort_2024
};
	
function http_route(pathname, response, request) {
  if (typeof handle_http[pathname] === 'function') {
    handle_http[pathname](response, request);
  } else {
  	handlers.sendfile(response, pathname);
  }
}

function tcp_route(localAddress, localPort, data) {
	
	if ( localPort in config.settings.server.tcp ) {
		if (typeof handle_tcp[pathname] === 'function') {
			handle_tcp[localPort](data);
		}
	}
}
// Export variables/functions
exports.http_route = http_route;
exports.tcp_route = tcp_route;
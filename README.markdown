# app_template - WORK IN PROGRESS

A node.js application template for quick deployment or prototyping.

The template provides functionality and connectivity for some popular messaging, data storage and communications platforms.
It was written as an exercise in learning node.js, version control and testing out ideas in the course of my working life.

It will be quite obvious from a cursory glance at the code that I am in no way a developer of any significance, however I've found it a fun way to while away some free time. 

# Table of Contents

* [Summary](#summary)
* [Usage](#usage)
   * [Servers](#servers)
      * [TCP Server](#tcp-server)
      * [HTTP Server](#http-server)
      * [SMTP](#smtp)
   * [clients](#clients)
      * [StatsD](#statsd)
      * [Elasticserach](#elasticsearch-client)
      * [IRC Bot](#ircbot)
      * [TCP Client](#tcp-client)
      * [HTTP Client](#http-client)
      * [Redis](#redis-client)
      * [AMQP](#amqp-client)
* [Required Modules](#required_modules)

# Summary

# Usage
## Servers
### TCP Server
Config 
```
{
	"server": {
		"tcp": {
			"port": [ 2023, 2024 ]
		}
	}
}
```
An array of ports for the application to listen on.

Example code, app.js method start:
```
server.start_tcp_servers(oSettings, route_data);
```
A local TCP socket will be created for each port listed in the configuration.  A function should be specified for the second argument
to route/process data received from any clients. 

router.js
```
function route_data(localAddress, localPort, data) {
	var port_routes = {
		2023:	fnPort_2023,
		2024:	fnPort_2024
	};
	
	if ( localPort in config.settings.server.tcp ) {
		if (typeof handle[pathname] === 'function') {
			port_routes[localPort](data);
		}
	}
}
```

handlers.js
```
function fnPort_2023(data) {
	// Do something useful with the data
	console.log("Got "+data+" from port 2023")
}

function fnPort_2024(data) {
	// Do something useful with the data
	console.log("Got "+data+" from port 2023")
}
```  
### HTTP Server

### SMTP

## Clients
### StatsD

### Elasticsearch

### IRC Bot

### TCP Client

### HTTP Client

### Redis

### AMQP


#### Publisher

Config
```
{
	"client": {
		"publisher": {
			"amqpHost":   	"rabbitmq.example.com",
	        "amqpUser":     "shandy",
	        "amqpPassword": "secret",
	        "amqpPort" :    5672,
	        "amqpvHost" :   "app1",
	        "exchange":     {
	            "name":         "app_ex",
	            "type":         "direct",
	            "routingKey":   "test",
	            "durable":      false,
	            "autoDelete":   false,
	            "confirm":      true
	        },
	        "publisher":    true,
	        "consumer":     false
		}
	}
}
```
The configuration above specifies a connection named *publisher*, which connects to the RabbitMQ server *rabbitmq.example.com* 
on the port *5672* using credentials username *shandy* and password *secret*.  

The Vhost *app1* should already exist.

The exchange *app_ex* will be created if it doesn't already exist.  The exchange configuration specified should match an already 
existing exchange, otherwise the app will bail.  Messages published using this connection will use the routing key *test*.

#### Consumer

Config
```
{
	"client": {
		"consumer": {
			"amqpHost":   	"rabbitmq.example.com",
	        "amqpUser":     "shandy",
	        "amqpPassword": "secret",
	        "amqpPort" :    5672,
	        "amqpvHost" :   "app1",
	        "exchange":     {
	            "name":         "app_ex",
	            "type":         "direct",
	            "durable":      false,
	            "autoDelete":   false,
	            "confirm":      true
	        },
	        "queue":    {
	            "name":         "consumer_test",
	            "routingKey":   "test",
	            "durable":      false,
	            "autoDelete":   true
	        },
	        "publisher":    false,
	        "consumer":     true
		}
	}
}
```
The configuration above specifies a connection named *consumer*, which connects to the RabbitMQ server *rabbitmq.example.com* 
on the port *5672* using credentials username *shandy* and password *secret*.

The Vhost *app1* should already exist.

The exchange *app_ex* will be created if it doesn't already exist.  The exchange configuration specified should match an already 
existing exchange, if not the app will bail. 

A queue named *consumer_test* will be created if one doesn't already exist and bound to the exchange *app_ex*, listening for 
messages with the routing key *test*.  Should the queue already exist then the consumer will join other conusmers listening, 
receiving messages when RabbitMQ routes them.



Example code, app.js function start:

```
client.start_amqp_clients(oSettings.client.amqp, parseMessage, function() {
	// Start services, call functions reliant on AMQP client connections
	console.log("completed function start_amqp_clients");
});

function parseMessage(message) {
	console.log('Consumer received message: '+message.content.toString());
}

```
When calling start_amqp_clients, the second parameter *parseMessage* is a function that should accept received messages.  
In this example they are just printed to stdout.

# Required Modules
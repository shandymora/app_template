# app_template

A node.js application template for quick deployment or prototyping.

The template provides functionality and connectivity for some popular messaging, data storage and communications platforms.
It was written as an exercise in learning node.js, version control and testing out ideas in the course of my working life.

It will be quite obvious from a cursory glance at the code that I am in no way a developer of any significance, however I've found it a fun way to while away soem free time. 

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
'''
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
            "durable":      false,
            "autoDelete":   false,
            "confirm":      true
        },
        "publisher":    true,
        "consumer":     false
	}
}
'''

#### Consumer

Config
'''
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
            "durable":      false,
            "autoDelete":   true
        },
        "publisher":    false,
        "consumer":     true
	}
}
'''

Example code, app.js function start:

'''
client.start_amqp_clients(oSettings.client.amqp, parseMessage, function() {
	// Start services, call functions reliant on AMQP client connections
	console.log("completed function start_amqp_clients");
});

function parseMessage(message) {
	console.log('Consumer received message: '+message.content.toString());
}

'''
When calling start_amqp_clients, the second parameter is a function that should accept received messages.  In this example they a just printed to stdout.

# Required Modules
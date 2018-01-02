# HTTP Proxy

HTTP Proxy is snapped application utilising [node-http-proxy](https://github.com/nodejitsu/node-http-proxy), 
an HTTP programmable proxying library that supports websockets. 
It is suitable for implementing components such as reverse proxies 
and load balancers.

HTTP Proxy is providing only [WebSockets Proxy](https://github.com/nodejitsu/node-http-proxy#proxying-websockets) 
service at the moment.

Following configuration parameters are available:
* lport - a port on which the proxy server will listen (default 8080)
* tport - a port to which requests will be proxied (default 80)
* thost - a host to which requests will be proxied (default *localhost*)

To build the HTTP Proxy snap run
`$ snapcraft prime`

To try the HTTP Proxy snap run
`$ sudo snap try --devmode prime`

To get the status of the service run
`$ sudo systemctl status snap.httpproxy.ws-proxy.service`

To get the service logs run
`$ journalctl -u snap.httpproxy.ws-proxy.service`

To follow the service logs live add f flag
`$ journalctl -fu snap.httpproxy.ws-proxy.service`

To change a configuration parameter run
`$ sudo snap set httpproxy lport=8080`

To get a value of a configuration parameter run
`$ sudo snap get httpproxy lport`

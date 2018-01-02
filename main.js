#!/usr/bin/env node

'use strict';

const http = require('http'),
    httpProxy = require('http-proxy'),
    path = require('path'),
    fs = require('fs'),
    LPORT = 8080,
    TPORT = 80,
    THOST = 'localhost';

let lport = LPORT,
    tport = TPORT,
    thost = THOST;

let CONFIG_DIR = process.env.SNAP_DATA;

if (!CONFIG_DIR) {
  CONFIG_DIR = '.';
}

const CONFIG_FILE = path.join(CONFIG_DIR, 'config');

const proxyServer = http.createServer();

proxyServer.activeconnections = {};

proxyServer.on('connection', function(conn) {
  let key = conn.remoteAddress + ':' + conn.remotePort;
  proxyServer.activeconnections[key] = conn;
  conn.on('close', function() {
    delete proxyServer.activeconnections[key];
  });
});
// we want to immediately close all connections on server restart (for port change)
proxyServer.force_close = function(cb) {
  proxyServer.close(cb);
  for (let key in proxyServer.activeconnections) {
    proxyServer.activeconnections[key].destroy();
  }
};

function loadconfig_and_start_server() {
  console.log('(re)starting!');
  fs.readFile(CONFIG_FILE, (err, data) => {

    let new_lport = lport;
    let new_thost = thost;
    let new_tport = tport;

    if (err) {
      if (lport != LPORT) {
        console.log('Error reading config file, reverting to the default port:' +
            err);
      }
    } else {
      console.log('Load port configuration');
      fs.readFileSync(CONFIG_FILE).
          toString().
          split('\n').
          forEach(function(line) {
            var data = line.split('=');

            if (data[1] == undefined) {
              return;
            }

            switch (data[0]) {
              case 'lport':
                let port_candidate = parseInt(data[1]);
                if (isNaN(port_candidate)) {
                  console.log(
                      `Port defined "${data[1]}" is not a valid port. Ignoring.`);
                } else {
                  new_lport = port_candidate;
                }
                break;
              case 'tport':
                let tport_candidate = parseInt(data[1]);
                if (isNaN(tport_candidate)) {
                  console.log(
                      `Port defined "${data[1]}" is not a valid target port. Ignoring.`);
                } else {
                  new_tport = tport_candidate;
                }
                break;
              case 'thost':
                new_thost = data[1];
                break;
            }
          });
    }

    // reload server if needed
    if ((new_lport != lport) || (new_thost != thost) || (new_tport != tport) || !proxyServer._handle) {
      proxyServer.force_close(() => {
        // Setup our server to proxy standard HTTP requests
        let proxy = new httpProxy.createProxyServer({
          target: {
            host: new_thost,
            port: new_tport,
          },
        });
        proxyServer.on("request", (request, response) => {
          proxy.web(request, response);
        });
        // Listen to the `upgrade` event and proxy the
        // WebSocket requests as well.
        proxyServer.on('upgrade', function(req, socket, head) {
          proxy.ws(req, socket, head);
        });
        proxyServer.listen(new_lport, function() {
          console.log('Server listening on: http://localhost:%s', new_lport);
        });
      });

    }
  });

}

fs.watchFile(CONFIG_FILE, (filename, prev) => {
  // file doesn't exist (even on startup) or exists and changed from default
  // port
  loadconfig_and_start_server();
});
// if file exists on startup: load config and start server here
if (fs.existsSync(CONFIG_FILE)) {
  loadconfig_and_start_server();
}

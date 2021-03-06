module.exports = function(opts) {
  'use strict';
  var init, initAutoReload, self;
  self = {};
  init = function() {
    if (opts.autoReload) {
      return initAutoReload();
    }
  };
  self.log = function(msg, action) {
    var req;
    if (action == null) {
      action = 'log';
    }
    console[action](msg);
    req = new XMLHttpRequest;
    req.open('POST', '/nokit-log');
    req.setRequestHeader('Content-Type', 'application/json');
    return req.send(JSON.stringify(msg));
  };
  initAutoReload = function() {
    var es, isConnected;
    es = new EventSource(opts.host + '/nokit-sse');
    isConnected = false;
    es.addEventListener('connect', function(e) {
      var data;
      if (isConnected) {
        location.reload();
      }
      data = JSON.parse(e.data);
      if (data === 'ok') {
        return isConnected = true;
      }
    });
    return es.addEventListener('fileModified', function(e) {
      var each, m, path, reloadElem;
      path = JSON.parse(e.data);
      console.log(">> fileModified: " + path);
      reloadElem = function(el, key) {
        var body;
        if (el[key].indexOf('?') === -1) {
          el[key] += '?nokitAutoReload=0';
        } else {
          if (el[key].indexOf('nokitAutoReload') > -1) {
            el[key] = el[key].replace(/nokitAutoReload=(\d+)/, function(m, p) {
              return 'nokitAutoReload=' + (+p + 1);
            });
          } else {
            el[key] += '&nokitAutoReload=0';
          }
        }
        body = document.body;
        body.style.display = 'none';
        body.offsetHeight;
        return setTimeout(function() {
          return body.style.display = 'block';
        }, 50);
      };
      each = function(qs, handler) {
        var elems;
        elems = document.querySelectorAll(qs);
        return [].slice.apply(elems).forEach(handler);
      };
      if (!path) {
        location.reload();
        return;
      }
      m = path.match(/\.[^.]+$/);
      switch (m && m[0]) {
        case '.js':
          return each('script', function(el) {
            if (el.src.indexOf(path) > -1) {
              return location.reload();
            }
          });
        case '.css':
          return each('link', function(el) {
            if (el.href.indexOf(path) > -1) {
              return reloadElem(el, 'href');
            }
          });
        case '.jpg':
        case '.gif':
        case '.png':
          return each('img', function(el) {
            if (el.src.indexOf(path) > -1) {
              return reloadElem(el, 'src');
            }
          });
        default:
          return location.reload();
      }
    });
  };
  init();
  return self;
};

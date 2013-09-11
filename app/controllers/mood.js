/* Development endpoints
 * Returns dummy response codes
 */

// 200 Ok - user can view, response body is remaining credits (if any)
// 304 Not modified - use for when user has already viewed in last 24 hours?
// 401 Unauthorized - 
// 402 Payment Required

var _s = require('underscore.string');
var http = require('http');
var async = require('async');

var randStatus = function () {
  return [200, 401, 402, 403][Math.floor(Math.random() * 4)];
};

var randCredits = function (max) {
  return Math.floor(Math.random() * (max || 100));
};

function getSliderValue(callback, slider_key) {

  global.redisClient.get(slider_key, function(err, value) {
    var res = {}
    if (err) {
      console.error("error");
    } else {
      console.log('res:');
      res[slider_key] = value;
      console.log(res);
      callback(null, res);
    }
  });
}

module.exports = {
  random: function (req, res) {
    // this[randStatus()](req, res);
    res.status(200).json({
      credits: randCredits()  // Remaining credits
    });

  },
  // OK
  // Credit decremented or already paid
  '200': function (req, res) {
    res.status(200).json({
      credits: randCredits()  // Remaining credits
    });
  },
  // Not authorised
  // Eg, an anonymous user
  '401': function (req, res) {
    res.status(401).end();
  },
  // Payment required
  // User did have credits, but they've run out
  '402': function (req, res) {
    res.status(402).end();
  },
  // Forbidden
  // User never had credits for this
  '403': function (req, res) {
    res.status(403).end();
  },
  '418': function (req, res) {
    res.status(418).end();
  },

  'routes': function (req, res) {
    res.send(global.app.routes);
  },

  sliders: function (req, res) {
    async.parallel([
      function(callback) {
        getSliderValue(callback, "hug_slider");
      },
      function(callback) {
        getSliderValue(callback, "hunger_slider");
      },
      function(callback) {
        getSliderValue(callback, "fun_slider");
      },
      function(callback) {
        getSliderValue(callback, "social_slider");
      },
      function(callback) {
        getSliderValue(callback, "energy_slider");
      },
      function(callback) {
        getSliderValue(callback, "comfort_slider");
      }
    ],
      function(err, results) {
        //console.log(results);
        var payload = {};
        results.forEach(function (r) {
            for (var prop in r) {
              payload[prop] = r[prop];
            }
          });
        console.log(payload);
        res.render('mood/sliders.html', payload);
      }
    );
  },
  set_sliders: function (req, res) {
    slider_key = req.query.slider_key
    slider_value = req.query.slider_value
    global.redisClient.set(slider_key, slider_value, function(err) {
      if (err) {
        console.error("error");
      } else {
        res.json({'ok':true});
      }
    });
  },
  get_sliders: function (req, res) {
    slider_key = req.query.slider_key
    slider_value = global.redisClient.get("hug_slider");
    global.redisClient.get(slider_key, function(err, value) {
      if (err) {
        console.error("error");
      } else {
        console.log(value);
        res.json({slider_key:value});
      }
    });
  },
  decrement_hunger_slider: function (req, res) {
    global.redisClient.get('hunger_slider', function(err, value) {
      if (err) {
        console.error("error" + err);
      } else {
        console.log('value:' + value);
        global.redisClient.set('hunger_slider', parseInt(value) - 42, function(err) {
          if (err) {
            console.error("error");
          } else {
            res.json({'ok':true});
          }
        });
      }
    });

  }
};

// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, or any plugin's
// vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file. JavaScript code in this file should be added after the last require_* statement.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require rails-ujs
//= require jquery3
//= require popper
//= require bootstrap
//= require select2
//= require vue
//= require moment
//= require Chart.min

function getAuthToken() {
  return document.querySelector('meta[name="csrf-token"]').content;
}

function getJWT() {
  return readCookie('jwt');
}

function readCookie(name) {
  var nameEQ = name + "=";
  var cookiesArray = document.cookie.split(';');

  for (var i=0; i < cookiesArray.length; i++) {
      var c = cookiesArray[i];

      // Trim whitespace
      while (c.charAt(0)==' ')
        c = c.substring(1, c.length);

      // Check for and return cookie value if we find a match
      if (c.indexOf(nameEQ) == 0)
        return c.substring(nameEQ.length, c.length);
  }

  return null;
}

// Hack to fix select2 tab order
$('select').on('select2:select', function(){
  $(this).focus();
});

var chartColors = {
  red: new ChartColor(255, 99, 132),
  orange: new ChartColor(255, 159, 64),
  yellow: new ChartColor(255, 205, 86),
  green: new ChartColor(84, 230, 119),
  blue: new ChartColor(54, 162, 235),
  purple: new ChartColor(153, 102, 255),
  grey: new ChartColor(201, 203, 207)
};

function ChartColor(r, g, b) {
  this.r = r;
  this.g = g;
  this.b = b;
}

ChartColor.prototype.rgb = function() {
  return this.r + ',' + this.g + ',' + this.b;
};

ChartColor.prototype.rgbaString = function(a) {
  a = typeof a !== 'undefined' ? a : 1;
  return 'rgba(' + this.rgb() + ',' + a + ')';
};
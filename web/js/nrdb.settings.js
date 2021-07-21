(function(settings, $) {

  // all the settings, initialized with their default value
  var cache = {
    'show-disabled': false,
    'only-deck': false,
    'ignore-limited-copies': false,
    'show-onesies': false,
    'show-cacherefresh': false,
    'display-columns': 1,
    'core-sets': 3,
    'show-suggestions': 3,
    'buttons-behavior': 'cumulative',
    'sort-order': 'type',
    'check-rotation': true
  };

  settings.load = function load() {
    // first give them the default values
    _.forIn(cache, function (defaultValue, key) {
      $('[name='+key+']').each(function (index, element) {
        var $element = $(element);
        switch($element.attr('type')) {
        case 'checkbox':
          $element.prop('checked', defaultValue);
          break;
        case 'radio':
          $element.prop('checked', $element.val() == defaultValue);
          break;
        default:
          $element.val(defaultValue);
          break;
        }
      })
    });

    // then overwrite those default values with the persisted values
    $('[data-persistence]').on('persistence:change', function (event, value) {
      var key = $(this).attr('name');
      cache[key] = value;
    })
    .persistence('load')
    .then(function () {
      $(document).trigger('settings.app');
    });
  };

  settings.getItem = function (key) {
    return cache[key];
  };

  settings.promise = new Promise(function (resolve, reject) {

    $(document).on('settings.app', resolve);

  });

  $(function () {
    settings.load();
  });

})(NRDB.settings = {}, jQuery);

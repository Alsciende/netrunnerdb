(function(suggestions, $) {
  suggestions.titlesFromIndex = [];
  suggestions.matrix = [];
  suggestions.indexFromTitles = {};
  suggestions.current = [];
  suggestions.exclusions = [];
  suggestions.number;

  suggestions.query = function(side) {
    suggestions.promise = $.ajax('/'+side+'.json', {
      dataType: 'json',
      success: function (data) {
        suggestions.titlesFromIndex = data.index;
        suggestions.matrix = data.matrix;
        // reconstitute the full matrix from the lower half matrix
        for(var i = 0; i < suggestions.matrix.length; i++) {
          for(var j = i; j < suggestions.matrix.length; j++) {
            suggestions.matrix[i][j] = suggestions.matrix[j][i];
          }
        }
        for(var i = 0; i < suggestions.titlesFromIndex.length; i++) {
          suggestions.indexFromTitles[suggestions.titlesFromIndex[i]] = i;
        }
      },
      error: function( jqXHR, textStatus, errorThrown ) {
        console.log('['+moment().format('YYYY-MM-DD HH:mm:ss')+'] Error on '+this.url, textStatus, errorThrown);
      }
    });
    suggestions.promise.done(suggestions.compute);
  };

        suggestions.refresh = function () {
                suggestions.number = parseInt(NRDB.settings.getItem('show-suggestions'), 10);
        }

  suggestions.compute = function() {
    suggestions.refresh();

                // init current suggestions
                suggestions.titlesFromIndex.forEach(function (title, index) {
                        suggestions.current[index] = {
                                title: title,
                                proba: 0
                        };
                });
                // find used cards
                var indexes = NRDB.data.cards.find({indeck:{'$gt':0}}).map(function (card) {
                        return suggestions.indexFromTitles[card.title];
                });
                // add suggestions of all used cards
                indexes.forEach(function (i) {
                        if(suggestions.matrix[i]) {
                                suggestions.matrix[i].forEach(function (value, j) {
                                        suggestions.current[j].proba += (value || 0);
                                });
                        }
                });
                // remove suggestions of already used cards
                indexes.forEach(function (i) {
                        if(suggestions.current[i]) suggestions.current[i].proba = 0;
                });
                // remove suggestions of identity
                NRDB.data.cards.find({type_code:'identity'}).map(function (card) {
                        return suggestions.indexFromTitles[card.title];
                }).forEach(function (i) {
                        if(suggestions.current[i]) suggestions.current[i].proba = 0;
                });
                // remove suggestions of excluded cards
                suggestions.exclusions.forEach(function (i) {
                        suggestions.current[i].proba = 0;
                });
                // sort suggestions
                suggestions.current.sort(function (a, b) {
                        return (b.proba - a.proba);
                });

    suggestions.show();
  };

  suggestions.show = function() {
                suggestions.refresh();

                var table = $('#table-suggestions');
    var tbody = table.children('tbody');
    tbody.empty();
    if(!suggestions.number && table.is(':visible')) {
      table.hide();
      return;
    }
    if(suggestions.number && !table.is(':visible')) {
      table.show();
    }
    var nb = 0;
    for(var i=0; i<suggestions.current.length; i++) {
      if(suggestions.current[i].proba === 0) continue;
      var cards = NRDB.data.cards.find({title: suggestions.current[i].title}, {$orderBy: {code: -1}});
      var card = cards[0];
      if(is_card_usable(card) && Filters.pack_code.indexOf(card.pack_code) > -1) {
        var div = suggestions.div(card);
        div.on('click', 'button.close', suggestions.exclude.bind(this, card.title));
        tbody.append(div);
        if(++nb >= suggestions.number) break;
      }
    }
  };

  suggestions.div = function(card) {
    var faction = card.faction_code;
    var influ = "";
    for (var i = 0; i < card.factioncost; i++) {
      influ += "●";
    }

    var pref_extended_maxqty = card.maxqty;
    if (NRDB.settings && NRDB.settings.getItem("ignore-limited-copies")) { // if the setting is enabled,
      pref_extended_maxqty = Math.max(pref_extended_maxqty, 3); // increase allowed copies up to 3.
    }

    var radios = '';
    for (var i = 0; i <= pref_extended_maxqty; i++) {
      radios += '<label class="btn btn-xs btn-default'
        + (i == card.indeck ? ' active' : '')
        + '"><input type="radio" name="qty-' + card.code
        + '" value="' + i + '">' + i + '</label>';
    }

    var imgsrc = card.faction_code.substr(0,7) === "neutral" ? "" : '<img data-src="'
          + Url_FactionImage.replace('xxx', card.faction_code)
          + '" class="lazyload" alt="'+card.title+'">';
    var div = $('<tr class="card-container" data-index="'
          + card.code
          + '"><td><button type="button" class="close"><span aria-hidden="true">&times;</span><span class="sr-only">Remove</span></button></td>'
          + '<td><div class="btn-group" data-toggle="buttons">'
          + radios
          + '</div></td><td><a class="card" href="'
          + Routing.generate('cards_zoom', {card_code:card.code})
          + '" data-target="#cardModal" data-remote="false" data-toggle="modal">'
          + card.title + '</a></td><td class="influence influence-' + faction
          + '">' + influ + '</td><td class="type" title="' + card.type.name
          + '"><img data-src="/images/types/'
          + card.type_code + '.png" class="lazyload" alt="'+card.type.name+'">'
          + '</td><td class="faction" title="' + card.faction.name + '">'
          + imgsrc + '</td></tr>');

    return div;
  };

  suggestions.exclude = function(title) {
    suggestions.exclusions.push(suggestions.indexFromTitles[title]);
    suggestions.compute();
  };

  suggestions.pick = function(event) {
    InputByTitle = false;
    var input = this;
    $(input).closest('tr').animate({
      opacity: 0
    }, function() {
      handle_quantity_change.call(input, event);
    });
  };

  $(function() {

    $('#table-suggestions').on({
      change : suggestions.pick
    }, 'input[type=radio]');

  });

})(NRDB.suggestions = {}, jQuery);

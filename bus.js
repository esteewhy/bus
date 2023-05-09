$(function() {
    function option$(typ, uid, groupName, cls, checked) {
        var val = typ + uid;
        var name = groupName + cls;
        var id = groupName + val;
        return [
            $('<input/>', {'type': 'radio', value: val, id: id, checked: checked, name: name}),
            $('<label/>', {'class': typ + ' ' + val, 'for': id, title: val }).html('&nbsp;')
        ];
    }
    
    function shadow$(parentId, action) {
        var id = parentId + '-' + action;
        return $('<div class="shadow" />').append(
                $('<input/>', {'type': "radio", name: 'modal', id: id, 'class': action}),
                $('<label/>', {'for': id}).append(
                    '<span class="tile top blank"/>',
                    '<span class="tile bottom blank"/>'
                ),
            );
    }
    
    function slot$(parentId, n) {
        var groupName = parentId + 'slot' + n;
        var _grp = function(num, typ, tgt) {
            return $.map(Array.from(new Array(num).keys()), function(n) {
                return option$(typ, n, groupName, tgt);
            });
        };
        return $('<span class="slot" />').append(
            shadow$(groupName, 'open'),
            shadow$(groupName, 'close'),
            $('<div/>', {'class': 'picker'}).append(
                option$('spot', 2, groupName, 'top', 'checked'),
                option$('t', 0, groupName, 'top'),
                option$('j', 0, groupName, 'top'),
                _grp(2, 'h', 'top'),
                _grp(3, 'f', 'top'),
                _grp(2, 'r', 'top'),
                '<br/>',
                _grp(9, 'd', 'top'),
                '<br/>',
                _grp(9, 'w', 'top'),
                '<br class="conditional"/>',
                _grp(6, 'a', 'bottom'),
                '<br/>',
                _grp(6, 'l', 'bottom'),
                '<br/>',
                option$('l', '00', groupName, 'bottom'),
                option$('l', '000', groupName, 'bottom')
            )
        );
    }
    
    function playground$(id) {
        return $('<div class="bus" id="' + id + '" />')
            .append($.map(Array.from(new Array(20).keys()), function(n) {
                return slot$(id, n);
            }));
    }
    
    $('#slots').replaceWith(
        $.map(Array.from(new Array(7).keys()), function(n) {
            return playground$('bus' + n);
        })
    );
    
    function inflateBus(board, blueprint) {
        var a = blueprint.replace(/(\d)([a-z])/ig, '$1 $2').split(' ');
        
        var cbnames = [];
        $(':input[name!=""]:not(.close):not(.open)', board).each(function() {
            if (!~$.inArray(this.name, cbnames)) {
                cbnames.push(this.name);
                var prefix = a[0].substr(0, 1);
                
                var radio$ = $(':input[name="' + this.name + '"]', board);
                var prefixes = [];
                radio$.each(function() {
                    var p = $(this).val().substr(0, 1);
                    if(!~$.inArray(p, prefixes)) {
                        prefixes.push(p);
                    }
                });
                
                if(prefixes.includes(prefix)) {
                    radio$.val([a.shift()]);
                    if(0 == a.length) return false;
                }
            }
        });
    }

    inflateBus('#bus0', 't0 d7 w2 a0 w2 l1 d7 w2 l3 w2 a3 d4 h0 f0 h0 w3 l2 w2 a3 w2 l2 w2 w2 w2 a0 w2 l2 t0 r0');
    inflateBus('#bus1', 't0 w4 l4 d0 w7 a1 w7 l000 w7 w7 a4 d0 h0 f0 h0 l0 w3 w8 a4 w7 l000 w8 w7 a1 w8 l5 t0 r1');
    inflateBus('#bus2', 't0 w4 l4 w4 w8 a1 w8 l000 w8 w8 a4 d0 h0');
    inflateBus('#bus3', 't0 w6 d0 w8 a2 w8 l00 w2 a5 d0 h0 f0 h0 w3 l0 w1 a5 w8 l00 w8 a2 w2 l5 t0 r1');
    inflateBus('#bus4', 't0 w4 l4 d0 w8 a1 w8 l000 w8 w8 a4 d0 h0');
    inflateBus('#bus5', 't0 d5 w2 a3 w2 l2 d5 j0 w2 a0 w2 l1 d5 w2 l3 w2 a3 d5 h0');
    inflateBus('#bus6', 't0 w6 d6 w2 a0 w2 l1 d6 w0 l3 w2 a3 w6 d6 h0');
    
    $.each((function () {//https://stackoverflow.com/a/21152762/35438
      return location.search
        ? location.search.substr(1).split`&`.reduce((qd, item) => {let [k,v] = item.split`=`; v = v && decodeURIComponent(v); (qd[k] = qd[k] || []).push(v); return qd}, {})
        : {}
    })(), function(key, values) {
        inflateBus('#' + key, values[0]);
    });
    
    $(document).on('click', '.settings .insert', function() {
        
    });
});

$(function() {
    function deflateBus(board) {
        var cbnames = [];
        
        $(':input[name!=""]:not(.close):not(.open)', board).each(function() {
            if (!~$.inArray(this.name, cbnames)) {
                cbnames.push(this.name);
            }
        });
        
        return $.map(cbnames, function(name) {
            var v = $(':input[name="' + name + '"]:checked', board).val();
            return 'spot2' !== v ? v : null;
        }).join(' ');
    }
    
    $('.bus:not(:has(.options))').append($('.templates > .options').clone())
            .find('.menu-input').attr('id', function() { return $(this).parents('.bus').attr('id') + 'menu'; }).end()
            .find('.menu').attr('for', function() { return $(this).parents('.bus').attr('id') + 'menu'; }).end();
    
    $(document).on('change', '.bus [type="radio"]', function() {
        var board = $(this).parents('.bus');
        $('.share', board).attr('href', '?' + board.get(0).id + '=' + encodeURIComponent(deflateBus(board).replace(/\s/g, '')));
    });
    
    $('.bus .slot:first-of-type :input.open').trigger('change');
    
    $(document).on('click', '.bus .options .delete', function() {
        $(this).parents('.bus').remove();
        return false;
    });
    
});

$(function() {
    $('.picker').prepend($('<a href="" class="insert" title="insert">+</a><a href="" class="delete" title="delete">-</a><br/>'));
    
    $(document).on('click', '.picker .insert', function(e) {
        var $slot = $(this).parents('.slot');
        var counter = $slot.parents('.bus').find('>.slot').length;
        var makeUnique = function(n, i) { return i && i.replace(/slot(\d+)/, 'slot' + counter); };
        
        $slot.before(
            $slot.clone()
                .find('[for],[name],[id]')
                .attr('for', makeUnique)
                .attr('name', makeUnique)
                .attr('id', makeUnique)
                .end()
        );
        return false;
    });
    $(document).on('click', '.picker .delete', function(e) {
        $(this).parents('.slot').remove();
        return false;
    });
});
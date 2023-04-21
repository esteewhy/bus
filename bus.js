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
        return $('<span class="slot" />').append(
            shadow$(groupName, 'open'),
            shadow$(groupName, 'close'),
            $('<div/>', {'class': 'picker'}).append(
                option$('spot', 2, groupName, 'top', 'checked'),
                $.map(Array.from(new Array(2).keys()), function(n) {
                    return option$('t', n, groupName, 'top');
                }),
                $.map(Array.from(new Array(2).keys()), function(n) {
                    return option$('h', n, groupName, 'top');
                }),
                '<br/>',
                $.map(Array.from(new Array(9).keys()), function(n) {
                    return option$('d', n, groupName, 'top');
                }),
                '<br/>',
                $.map(Array.from(new Array(9).keys()), function(n) {
                    return option$('w', n, groupName, 'top');
                }),
                '<br/>',
                $.map(Array.from(new Array(6).keys()), function(n) {
                    return option$('a', n, groupName, 'bottom');
                }),
                '<br/>',
                $.map(Array.from(new Array(6).keys()), function(n) {
                    return option$('l', n, groupName , 'bottom');
                })
            )
        );
    }
    
    function playground$(id) {
        return $('<div class="bus" id="' + id + '" />')
            .append($.map(Array.from(new Array(20).keys()), function(n) {
                return slot$(id, n);
            }))
            .append('<a class="share" href>share</a>');
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
    
    inflateBus('#bus0', 't0d7 w2 a0 w2 l0 d7 w2 l3 w2 a3 d4 h0');
    inflateBus('#bus1', 't0 w4 l4 d0 w7 a1 w7 l1 w7 l1 w7 a4 d0 h0');
    inflateBus('#bus2', 't0 w4 l4 w4 w8 a1 w8 l1 w8 l1 w8 a4 d0 h0');
    inflateBus('#bus3', 't0 w6 d0 w8 a2 w8 l1 w2 a5 d0 h0');
    inflateBus('#bus4', 't0 w4 l4 d0 w8 a1 w8 l1 w8 l1 w8 a4 d0 h0');
    inflateBus('#bus5', 't0 d5 w2 a3 w2 l2 d5 t1 w2 a0 w2 l0 d5 w2 l3 w2 a3 d5 h0');
    inflateBus('#bus6', 't0 w6 d6 w2 a0 w2 l0 d6 w0 l3 w2 a3 w6 d6 h0');
    
    $(document).on('change', '[type="radio"]', function() {
        var board = $(this).parents('.bus');
        $('.share', board).attr('href', '?' + board.get(0).id + '=' + encodeURIComponent(deflateBus(board).replace(/\s/g, '')));
    });
    
    $.each((function () {//https://stackoverflow.com/a/21152762/35438
      return location.search
        ? location.search.substr(1).split`&`.reduce((qd, item) => {let [k,v] = item.split`=`; v = v && decodeURIComponent(v); (qd[k] = qd[k] || []).push(v); return qd}, {})
        : {}
    })(), function(key, values) {
        console.log([key, values[0]]);
        inflateBus('#' + key, values[0]);
    });
    
    $('.bus .slot:first-of-type :input.open').trigger('change');
});
function option$(typ, uid, groupName, cls, checked) {
    var val = typ + uid;
    var name = groupName + cls;
    var id = groupName + val;
    return [
        $('<input/>', {'type': 'radio', value: val, id: id, checked: checked, name: name}),
        $('<label/>', {'class': typ + ' ' + val, 'for': id, title: val + (SPEC?.hints?.[val] ? ' ' + SPEC.hints[val] : '') }).html('&nbsp;')
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
            option$('blank', '0', groupName, 'bottom'),
            _grp(6, 'a', 'bottom'),
            '<br/>',
            _grp(6, 'l', 'bottom'),
            '<br/>',
            option$('l', '00', groupName, 'bottom'),
            option$('l', '000', groupName, 'bottom')
        )
    );
}

function playground$(id, size = 20) {
    return $('<div class="bus" id="' + id + '" />')
        .append($.map(Array.from(new Array(size).keys()), function(n) {
            return slot$(id, n);
        }))
        .prepend($('.templates > .options').clone())
            .find('.menu.open').attr('for', function() { return $(this).parents('.bus').attr('id') + 'menu'; }).end()
            .find('.menu-input').attr('id', function() { return $(this).parents('.bus').attr('id') + 'menu'; }).end()
            .find('.paint')
                .append(function(n, s) {
                    var parentId = $(this).parents('.bus').attr('id');
                    
                    return $.map(Array.from(new Array(9).keys()), n => option$('c', n, parentId, 'paint'));
                }).end();
}

function inflateBus(board, bus) {
    const busElements = bus.match(/[a-z]\d+/ig) || [];

    const cbnames = [];
    const inputs = board.get(0).querySelectorAll('.slot input:not(.close):not(.open)');

    inputs.forEach(input => {
        if (!cbnames.includes(input.name)) {
            cbnames.push(input.name);
            const prefix = busElements[0][0]; // Get the first character of the first element

            const radios = board.get(0).querySelectorAll(`input[name="${input.name}"]`);
            const prefixes = Array.from(radios).reduce((acc, radio) => {
                const p = radio.value[0]; // Get the first character of the value
                if (!acc.includes(p)) {
                    acc.push(p);
                }
                return acc;
            }, []);

            if (prefixes.includes(prefix)) {
                radios.forEach(radio => {
                    if (radio.value === busElements[0]) {
                        radio.checked = true; // Set the value for radio buttons natively
                    }
                });
                busElements.shift(); // Remove the used element
                if (!busElements.length) return;
            }
        }
    });
    
    const colorElement = busElements.find(element => element.startsWith('c'));
    if (colorElement) {
        const colorOption = board.get(0).querySelector(`input[value="${colorElement}"]`);
        if (colorOption) {
            const colorInput = board.get(0).querySelector(`input[name="${colorOption.name}"][value="${colorElement}"]`);
            colorInput && (colorInput.checked = true);
        }
    }
}

function showBusEditor(bus, id = new Date().getTime()) {
    var anchor$ = $('#slots');
    const matches = bus.match(/([dhfrtw])\d+/g) || [];
    inflateBus($('#' + id).length ? $('#' + id) : playground$(id, matches.length).insertAfter(anchor$), bus);
}

function getUrlParams() { //https://stackoverflow.com/a/21152762/35438
    return location.search
        ? location.search.substr(1).split`&`.reduce((qd, item) => {let [k,v] = item.split`=`; v = v && decodeURIComponent(v); (qd[k] = qd[k] || []).push(v); return qd}, {})
        : {};
}

function deflateBus(board) {
    var cbnames = [];
    
    $('.slot :input[name!=""]:not(.close):not(.open)', board).each(function() {
        if (!~$.inArray(this.name, cbnames)) {
            cbnames.push(this.name);
        }
    });
    
    return $.map(cbnames, function(name) {
        var v = $(':input[name="' + name + '"]:checked', board).val();
        return 'spot2' !== v ? v : null;
    }).join(' ') + $('.paint :checked', board).val();
}

$(function() {
    $(document).on('change', '.bus [type="radio"]:not(.close):not(.open):not(.menu-input)', function() {
        var board = $(this).parents('.bus');
        var k = board.get(0).id;
        var v = encodeURIComponent(deflateBus(board).replace(/\s/g, ''));
        var isGenBus = k.match(/^bus\d$/);
        $('.share', board).attr('href', '?' + (isGenBus ? 'add' : k) + '=' + v);
        $('.share', board).text(isGenBus ? 'copy' : 'share');
        
        window.location.hash = v;
        
        if(showBus) showBus(v);
        
        if(window.localStorage) {
            window.localStorage.setItem(k, v);
        }
    }).trigger('change');
    
    $(document).on('click', '.bus .options .delete', function() {
        confirm('Sure to scrape this vehicle?')
            && (localStorage.removeItem($(this).parents('.bus').attr('id'))
                || $(this).parents('.bus').remove());
        return false;
    });
    
    var prevBoard;
    
    $(document).on('change', '.bus [type="radio"]', function() {
        var board = $(this).parents('.bus');
        if(board.get(0) !== prevBoard) {
            var v = deflateBus(board);
            if(showBus) showBus(v);
            prevBoard = board.get(0);
        }
    });
});

const genesys = {
    'bus0': 't0 d7 w2 a0 w2 l1 d7 w2 l3 w2 a3 d4 h0 f0 h0 w3 l2 w2 a3 w2 l2 w2 w2 w2 a0 w2 l2 t0 r0 c1',
    'bus1': 't0 w4 l4 d0 w7 a1 w7 w7 l000 w7 a4 d0 h0 f1 h0 l0 w3 w8 a4 w7 l000 w8 w7 a1 w8 l5 t0 r1 c2',
    'bus2': 't0 w4 l4 w4 w8 a1 w8 w8 l000 w8 a4 d0 h0 f1 h0 w3 l0 w8 a4 w8 l000 w8 w8 a1 w8 l5 t0 r1 c3',
    'bus3': 't0 w6 d0 w8 a2 w8 l00 w2 a5 d0 h0 f0 h0 w3 l0 w1 a5 w8 l00 w8 a2 w2 l5 t0 r1 c4',
    'bus4': 't0 w4 l4 d0 w8 a1 w8 w8 l000 w8 a4 d0 h0 c5',
    'bus5': 't0 d5 w2 a3 w2 l2 d5 j0 w2 a0 w2 l1 d5 w2 l3 w2 a3 d5 h0 c1',
    'bus6': 't0 w6 d6 w2 a0 w2 l1 d6 w0 l3 w2 w6 a3 d6 h0 c1'
};

$(function() {
    var urlParams = getUrlParams();
    window.history.pushState('object', document.title, location.href.split("?")[0]);
    var entries = Object.entries(Object.assign(localStorage, genesys, localStorage, urlParams)).filter(kvp => kvp[0].match(/^bus\d+$/i));
    
    if(!entries.length) entries = Object.entries(genesys);
    
    urlParams['add'] && entries.push(['bus' + new Date().getTime(), urlParams['add'][0]]);
    var anchor$ = $('#slots');
    
    const htmlVisitor = htmlVisitorFactory(html => $(`<a class='bus-view'>${html}</a>`)
        .attr('href', '#' + encodeURIComponent($(html).text().replace(/\s+/g, '')))
        .insertAfter(anchor$)
    );

    entries.sort((a, b) => parseInt(b[0].match(/^bus(\d+)$/)[1]) - parseInt(a[0].match(/^bus(\d+)$/)[1]))
        .forEach(kvp => {
            showBus(kvp[1], [htmlVisitor]);
            showBusEditor(kvp[1], kvp[0]);
        });
});

$(function() {
    $('.picker').prepend($('<a href="" class="insert" title="insert">+</a><a href="" class="delete" title="delete">-</a><br/>'));
    
    var up = function(m, p1) { return "slot" + (parseInt(p1) + 1); };
    var down = function(m, p1) { return "slot" + (parseInt(p1) - 1); };
    var renumber = function(replacer) { return function(n, i) { return i && i.replace(/slot(\d+)/, replacer); } };
    
    $(document).on('click', '.picker .insert', function(e) {
        var $slot = $(this).parents('.slot');
        console.log($slot.get());
        $($slot.clone()
            .insertBefore($slot)
            .nextAll()
            .get()
            .reverse())
            .each(function() {
                $(this).find('[for],[name],[id]')
                    .attr('for', renumber(up))
                    .attr('name', renumber(up))
                    .attr('id', renumber(up));
            });
        return false;
    });
    
    $(document).on('click', '.picker .delete', function(e) {
        confirm('Sure to remove this block?') && $(this).parents('.slot')
            .nextAll()
            .each(function() {
                $(this).find('[for],[name],[id]')
                    .attr('for', renumber(down))
                    .attr('name', renumber(down))
                    .attr('id', renumber(down));
            })
            .end()
            .remove();
        localStorage.removeItem($(this).parent('.bus').attr('id'));
        return false;
    });
});
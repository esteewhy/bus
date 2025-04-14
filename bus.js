function option$(typ, uid, groupName, cls, checked) {
    const val = typ + uid;
    const [ name, id ] = [groupName + cls,  groupName + val];
    return {
        inputs: $('<input/>', { type: 'radio', value: val, id, checked, name }),
        labels: $('<label/>', { class: typ + ' ' + val,  for: id, title: val + (SPEC?.hints?.[val] ? ' ' + SPEC.hints[val] : '')}).html('&nbsp;')
    };
}

function shadow$(parentId, action) {
    const id = parentId + '-' + action;
    return {
        inputs: $('<input/>', { type: 'radio', name: 'modal', id, class: action }),
        labels: $('<label/>', { for: id }).append('<span class="tile top blank"/>', '<span class="tile bottom blank"/>')
    };
}

function unzip(array, keys = ['inputs', 'labels']) {
    return array.reduce(
        (acc, item) => {
            keys.forEach(key => {
                acc[key].push(...[].concat(item[key] ?? []));
            });
            return acc;
        },
        Object.fromEntries(keys.map(key => [key, []])) // Initial accumulator
    );
}

function group$(num, typ, tgt, groupName) {
    const array = Array.from({ length: num }).map((_, n) => option$(typ, n, groupName, tgt));
    return unzip(array);
}

function slot$(parentId, n) {
    const groupName = `${parentId}slot${n}`;
    const _grp = (num, typ, tgt) => group$(num, typ, tgt, groupName);

    const sources = [
        option$('spot', 2, groupName, 'top', 'checked'),
        option$('t', 0, groupName, 'top'),
        option$('j', 0, groupName, 'top'),
        _grp(2, 'h', 'top'),
        _grp(3, 'f', 'top'),
        _grp(2, 'r', 'top'),
        { labels: '<br/>' },
        _grp(9, 'd', 'top'),
        { labels: '<br/>' },
        _grp(9, 'w', 'top'),
        { inputs: '<br class="conditional"/>', labels: '<br class="conditional"/>' },
        option$('blank', '0', groupName, 'bottom'),
        _grp(6, 'a', 'bottom'),
        { labels: '<br/>' },
        _grp(6, 'l', 'bottom'),
        _grp(2, 'l', 'bottom'),
        { labels: '<br/>' },
        option$('l', '00', groupName, 'bottom'),
        option$('l', '000', groupName, 'bottom')
    ];

    const { inputs, labels } = unzip(sources);

    const [open, close] = ['open', 'close'].map(action => shadow$(groupName, action));

    return $('<span class="slot" />').append(
        inputs,
        open.inputs, close.inputs,
        $('<span/>', { class: 'shadow' }).append(open.labels),
        $('<span/>', { class: 'shadow' }).append(close.labels),
        $('<div/>', { class: 'picker' }).append(labels)
    );
}

function playground$(id, size = 20) {
    const livreys = group$(9, 'c', id, 'paint');
    return $('<form class="bus" id="' + id + '" />')
        .append(livreys.inputs)
        .append($.map(Array.from(new Array(size + 1).keys()), function(n) {
            return slot$(id, n);
        }))
        .prepend($('.templates > .options').clone())
            .find('.menu.open').attr('for', function() { return $(this).parents('.bus').attr('id') + 'menu'; }).end()
            .find('.menu-input').attr('id', function() { return $(this).parents('.bus').attr('id') + 'menu'; }).end()
            .find('.paint')
                .append(livreys.labels).end();
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

function showBusEditor(bus, id = 'bus' + new Date().getTime()) {
    const matches = bus.match(/([dhfrtw])\d+/g) || [];
    var $canvas = playground$(id, matches.length);
    inflateBus($canvas, bus);
    return $canvas;
}

function showBusView(bus, id = 'bus' + new Date().getTime()) {
    return showBus(bus, [htmlVisitor])[0].attr({id});
}

function getUrlParams() { //https://stackoverflow.com/a/21152762/35438
    return location.search
        ? location.search.substr(1).split`&`.reduce((qd, item) => {let [k,v] = item.split`=`; v = v && decodeURIComponent(v); (qd[k] = qd[k] || []).push(v); return qd}, {})
        : {};
}

function deflateBus(board) {
    Object.values(
        Object.fromEntries(
            new FormData(document.querySelector('#' + board.get(0).id))
        )
    ).join(' ').replace(' spot2', '');
}

$(function() {
    /*
    $(document).on('change', '.bus [type="radio"]:not(.close):not(.open):not(.menu-input)', function() {
        
        var board = $(this).parents('.bus');
        var k = board.get(0).id;
        var v = encodeURIComponent(deflateBus(board).replace(/\s/g, ''));
        
        window.location.hash = v;
        
        if(showBus) showBus(v);
        
        if(window.localStorage) {
            window.localStorage.setItem(k, v);
        }
    }).trigger('change');
    */
    $(document).on('click', '.bus .options .delete', function() {
        confirm('Sure to scrape this vehicle?')
            && (localStorage.removeItem($(this).parents('.bus').attr('id'))
                || $(this).parents('.bus').remove());
        return false;
    });
    
    var prevBoard;
    /*
    $(document).on('change', '.bus [type="radio"]', function() {
        var board = $(this).parents('.bus');
        if(board.get(0) !== prevBoard) {
            var v = deflateBus(board);
            if(showBus) showBus(v);
            prevBoard = board.get(0);
        }
    });
    */
    $(document).on('click', '.bus-view', function() {
        $('.bus').each((_, editor) => {
            const $editor = $(editor);
            const v = deflateBus($editor);
            console.log("Finish editing:");
            showBus ? showBus(v) : console.log(v);
            $editor.replaceWith(showBusView(v, $editor.attr('id')));
        })
        const $viewer = $(this);
        const v = $viewer.text();
        const id = $viewer.attr('id');
        console.log("Begin editing:");
        showBus ? showBus(v) : console.log(v);
        $viewer.replaceWith(showBusEditor(v, id));
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
    var $anchor = $('#slots');
    
    $anchor.replaceWith(
        entries
            .sort((a, b) => parseInt(b[0].match(/^bus(\d+)$/)[1]) - parseInt(a[0].match(/^bus(\d+)$/)[1]))
            .map(kvp => showBusView(kvp[1], kvp[0]))
    );
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
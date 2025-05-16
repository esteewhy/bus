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

/**
 * Generates individual editing section of a bus.
 *
 * @param {string} parentId - Unique identifier for top HTML.
 * @param {int} n - Positional number of this section.
 * @return {jQuery Object} Individual section of a bus editor.
 */
function slot$(parentId, n) {
    const groupName = `${parentId}slot${n}`;
    const _grp = (num, typ, tgt) => group$(num, typ, tgt, groupName);

    const sources = [
        { labels: '<a href="" class="insert" title="insert">+</a><a href="" class="delete" title="delete">-</a><br/>' },
        //option$('spot', 2, groupName, 'top', 'checked'),
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

/**
 * Generate empty bus editor HTML of given length.
 * 
 * @param {string} id - Unique identifier for top HTML element and individual children.
 * @param {int} size - Number of 2-storey "slots" to accommodate bus editing.
 * @return {jQuery Object} - Empty bus editor.
 *
 * @depends group$ Generates a set of similar HTML inputs and labels in a separate arrays.
 * @depends slot$ Generates individual editing section of a bus.
 * @usedBy showBusEditor - Generate HTML for Bus editing.
 */
function playground$(id, size = 20) {
    const livreys = group$(9, 'c', 'paint', id);
    return $('<fieldset class="bus" id="' + id + '" />')
        .append(livreys.inputs)
        .append($.map(Array.from(new Array(size).keys()), function(n) {
            return slot$(id, n);
        }))
        .prepend($('.templates > .options').clone())
            .find('.menu.open').attr('for', function() { return $(this).parents('.bus').attr('id') + 'menu'; }).end()
            .find('.menu-input').attr('id', function() { return $(this).parents('.bus').attr('id') + 'menu'; }).end()
            .find('.paint')
                .append(livreys.labels).end();
}

/**
 * Assigns Bus string to existing editor.
 * 
 * It appears more complex than it seems reasonable,
 * especially compared to it's counterpart deflateBus,
 * because it must accept bus parts unsupported by editor
 * and liverey instruction in arbitrary place.
 * 
 * @param {jQuery Object} $board - Bus editor long enough to accommodate new bus.
 * @param {string} bus - Bus parts along with livrey.
 * @usedBy showBusEditor - Generate HTML for Bus editing.
 */
function inflateBus($board, bus) {
    const board = $board.get(0);
    const busElements = bus.match(/\w\d+/ig) || [];
    const cbnames = [];
    const inputs = $('.slot > input:not(.close):not(.open)', board).get();
    
    inputs.forEach(input => {
        if (!cbnames.includes(input.name)) {
            cbnames.push(input.name);
            
            while(busElements.length) {
                const busElement = busElements[0];
                const prefix = busElement[0]; // Get the first character of the first element
                
                if('c' === prefix) {
                    const colorOption = board.querySelector(`input[value="${busElement}"]`);
                    if (colorOption) {
                        const colorInput = board.querySelector(`input[name="${colorOption.name}"][value="${busElement}"]`);
                        colorInput && (colorInput.checked = true);
                    }
                    busElements.shift();
                    continue;
                }
                
                const radios = board.querySelectorAll(`input[name="${input.name}"]`);
                const prefixes = Array.from(radios).reduce((acc, radio) => {
                    const p = radio.value[0]; // Get the first character of the value
                    if (!acc.includes(p)) {
                        acc.push(p);
                    }
                    return acc;
                }, []);
                
                if (prefixes.includes(prefix)) {
                    radios.forEach(radio => {
                        if (radio.value === busElement) {
                            radio.checked = true;
                        }
                    });
                    busElements.shift();
                }
                break;
            }
        }
    });
}

/**
 * Serializes bus string from the editor.
 * 
 * @param {HTMLFormElement} board - Form holding edited bus in its inputs.
 * @returns {string} Bus parts along with liverey.
 *
 * @usedBy On saving after editor input changed.
 * @usedBy On starting editing upon clicking on view.
 */
function deflateBus($board) {
    const form = $board.closest('form').get(0);
    const id = $board.attr('id');
    return Object.values(
        Object.fromEntries(
            //new FormData(form)
            Array.from(new FormData($('#bus2').closest('form').get(0)))
                .filter(el => el[0].startsWith(id))
        )
    ).join(' ').replace(' spot2', '');
}

/**
 * Generate HTML for Bus editing.
 * 
 * @param {string} bus - Bus parts along with livrey.
 * @param {string} id - Optional unique identifier for a parent HTML element.
 * @returns {jQuery Object} Form HTML element.
 * 
 * @depends playground$ - Generates editor HTML itself long enough to accommodate given bus.
 * @depends inflateBus - Assign bus string to just generated editor.
 * @usedBy On starting editing upon clicking on view.
 */
function showBusEditor(bus, id = 'bus' + Date.now()) {
    const $canvas = playground$(id, (bus.match(/([dhfjrtw])\d+/g) || []).length).data('initial-bus', bus);
    inflateBus($canvas, bus);
    return $canvas.append(splitSides($canvas));
}

/**
 * Generate HTML for Bus display clickable for starting editor.
 * 
 * @param {string} bus - Bus parts along with livrey.
 * @param {string} id - Optional unique identifier for a parent HTML element.
 * @return {jQuery Object} Anchor HTML element.
 *
 * @depends showBus Render bus view into HTML document.
 * @usedBy Initial buses rendering.
 * @usedBy On starting editing upon clicking on view.
 */
function showBusView(bus, id = 'bus' + new Date().getTime()) {
    const htmlVisitor = htmlVisitorOutlineFactory(/r\d+/.test(bus) ? fullRenderer : flatRenderer);
    return showBus(bus, [htmlVisitor], id)[0].attr({id});
}

function normalizeBus(bus) {
    return bus.replace(/\s+|c\d+/g, '').trim();
};

/**
 * Test for buses equality.
 *
 * Case-sensitive, ignores whitespaces and livrey element.
 */
function busesEqual(bus1, bus2) {
    return normalizeBus(bus1) === normalizeBus(bus2);
}

function busIncludes(bigBus, smallBus) {
    return normalizeBus(bigBus).includes(normalizeBus(smallBus));
}

$(function() {
    window.localStorage && $(document).on('change', '.bus [type="radio"]:not(.close):not(.open):not(.menu-input)',
        /**
         * Save edited bus.
         */
        function() {
            const $playground = $(this).parents('.bus');
            const id = $playground.get(0).id;
            const [oldBus, bus] = [$playground.data('initial-bus'), deflateBus($playground).replace(/\s/g, '')];
            
            if(!busesEqual(oldBus, bus)) {
                window.location.hash = encodeURIComponent(bus);
                console.log(`Saving ${id}:`);
                if(showBus) showBus(bus);
                window.localStorage.setItem(id, bus);
            }
        }
    ).trigger('change');
    
    $(document).on('click', '.bus-view',
        /**
         * Switches to editor upon clicking on viewer.
         */
        function() {
            $('#all-close').triggerHandler('click');
            const $viewer = $(this);
            const v = $viewer.clone()
                .find("style,.clone")
                .remove()
                .end()
                .text()
                .trim();//Pay attention to this string's format as it's loosely retrieved from HTML and may contain unwanted artifacts.
            
            const $editor = showBusEditor(v, $viewer.attr('id'));

            const linearIndex = $viewer.data('selection');
            if(0 <= linearIndex) {
                const groupedIndex = findGroupIndex(v, linearIndex);
                $editor.find(`.slot:eq(${groupedIndex}) .open`)
                    .each((_, el) => el.checked = true);
            }
            $viewer.replaceWith($editor);
            $editor.get(0).scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    );
    
    console.log(`WELLCOME to the legend of...`);
    BUS('f0');
    BUS('f0 c2');
    console.log('I K A R U S');
});

/**
 * Recalculates index of a linear element within a string
 * to an index of a grouped 2-storey elements.
 */
function findGroupIndex(bus, linearIndex) {
    return bus.replace(/\s*c\d+\s*/g, '') // Exclude 'c'-element
        .split(/\s+|(?<=\d+)(?=[a-z])/g)           // Break into char/number elements
        .slice(0, linearIndex + 1)  // Split at original index
        .join('')                   // Back to string
        .match(/.\d+[al]\d+|.\d+/g) // Now split in groups
        .length - 1;                // Our items should end up last
}

const genesys = {
    'bus0': 't0 d7 w2 a0 w2 l1 d7 w2 l3 w2 a3 d4 h0 f0 h0 w3 l2 w2 a3 w2 l2 w2 w2 w2 a0 w2 l2 t0 r0 c1',
    'bus1': 't0 w4 l4 d0 w7 a1 w7 w7 l000 w7 a4 d0 h0 f1 h0 l0 w3 w8 a4 w7 l000 w8 w7 a1 w8 l5 t0 r1 c2',
    'bus2': 't0 w4 l4 w4 w8 a1 w8 w8 l000 w8 a4 d0 h0 f1 h0 w3 l0 w8 a4 w8 l000 w8 w8 a1 w8 l5 t0 r1 c3',
    'bus3': 't0 w6 d0 w8 a2 w8 l00 w2 a5 d0 h0 f0 h0 w3 l0 w1 a5 w8 l00 w8 a2 w2 l5 t0 r1 c4',
    'bus4': 't0 w4 l4 d0 w8 a1 w8 w8 l000 w8 a4 d0 h0 c5',
    'bus5': 't0 d5 w2 a3 w2 l2 d5 j0 w2 a0 w2 l1 d5 w2 l3 w2 a3 d5 h0 c1',
    'bus6': 't0 w6 d6 w2 a0 w2 l1 d6 w0 l3 w2 w6 a3 d6 h0 c1'
};

function getUrlParams() { //https://stackoverflow.com/a/21152762/35438
    return location.search
        ? location.search.substr(1).split`&`.reduce((qd, item) => {let [k,v] = item.split`=`; v = v && decodeURIComponent(v); (qd[k] = qd[k] || []).push(v); return qd}, {})
        : {};
}

$(function() {
    var urlParams = getUrlParams();
    window.history.pushState('object', document.title, location.href.split("?")[0]);
    
    var entries = Object.entries(
        Object.assign({}, 
            Object.fromEntries(
                (localStorage['order'] ?? (localStorage['order'] = Object.keys(genesys).toString()))
                    .split(',')
                    .map(a => [a, undefined])
            ),// Sort
            Object.assign(
                localStorage,       // Save defaults if empty
                Object.assign(
                    {},
                    genesys,        // Defaults
                    localStorage,   // Existing
                    urlParams       // From URL
                )
            )
        )
    ).filter(kvp => kvp[0].match(/^bus\d+$/i) && kvp[1]);
    
    urlParams['add'] && entries.push(['bus' + new Date().getTime(), urlParams['add'][0]]);
    
    const selectedIndex = window.location.hash ? entries.findIndex(e => busIncludes(e[1], window.location.hash.slice(1))) : -1;
    $('#slots').replaceWith(entries.map((kvp, index) => (index === selectedIndex ? showBusEditor : showBusView)(kvp[1], kvp[0])));
    
    window.addEventListener('hashchange',
        /**
         * Maintains selection when traversing back the browsing history.
         */
        function() {
            const $controls = $('.bus,.bus-view');
            const entries = $controls.map((_, el) => {
                const $el = $(el);
                return [[ el.id, $el.is('.bus')
                    ? deflateBus($el)
                    : $el.is('.bus-view')
                        ? $el.clone()
                            .find("style,.clone")
                            .remove()
                            .end()
                            .text()
                            .trim()
                        : '' ]];
            }).get();
                
            const selectedIndex = window.location.hash ? entries.findIndex(e => busIncludes(e[1], window.location.hash.slice(1))) : -1;
            if(0 <= selectedIndex) {
                $controls
                    .filter(`:eq(${selectedIndex}).bus-view`)
                    .trigger('click');
            }
        }
    );
    
    $( ".bus-container" ).sortable({
        items: '.bus,.bus-view',
        opacity: 0.5,
        revert: true,
        update: function( event, ui ) {
            localStorage['order'] = $('.bus,.bus-view', this).map((_, el) => el.id).get().toString();
        },
        stop: function(event, ui) {
            const windowHeight = $(window).height();
            const windowWidth = $(window).width();

            // Check if the item is outside the viewport
            if (ui.offset.top < 0 || ui.offset.top > windowHeight || 
                ui.offset.left < 0 || ui.offset.left > windowWidth) {
               
                confirm("Item is outside the page. Do you want to delete it?")
                    && (localStorage.removeItem(ui.item.attr('id'))
                        || ui.item.remove()
                        || $('#all-close').triggerHandler('click'));
            }
        }
    });
    
    if(window.location.hash && 0 > selectedIndex) {
        confirm('Looks like a new bus. Add it to your garage?');
        ///TODO
    }
});


$(function() {
    var up = function(m, p1) { return "slot" + (parseInt(p1) + 1); };
    var down = function(m, p1) { return "slot" + (parseInt(p1) - 1); };
    var renumber = function(replacer) { return function(n, i) { return i && i.replace(/slot(\d+)/, replacer); } };
    
    $(document).on('click', '.picker .insert',
        /**
         * Handles insertion of a bus section by renaming following sections in accordance with their new order.
         */
        function(e) {
            var $slot = $(this).parents('.slot');
            var $newSlot = $slot.clone();
            $slot.nextAll()
                .addBack()
                .get()
                .reverse()
                .forEach(function(el) {
                    $(el).find('[for],[name],[id]')
                        .attr('for', renumber(up))
                        .attr('name', renumber(up))
                        .attr('id', renumber(up));
                });
            
            $newSlot
                .insertBefore($slot)
                .find('[type="radio"]:not(.close):not(.open):first')
                .trigger('change');
            return false;
        }
    );
    
    $(document).on('click', '.picker .delete',
        /**
         * Removes bus section and renames following sections according to their new order.
         */
        function(e) {
            confirm('Sure to remove this section?') && $(this).parents('.slot')
                .nextAll()
                .each(function() {
                    $(this).find('[for],[name],[id]')
                        .attr('for', renumber(down))
                        .attr('name', renumber(down))
                        .attr('id', renumber(down));
                })
                .end()
                .remove()
                // After slot was detached find event target by calculated id.
                && $('#' + $(this).parents('.slot').find('.open').map((_, el) => el.id.match(/^\w+(?=slot)/)).get(0))
                    .find('[type="radio"]:not(.close):not(.open):not(.menu-input):first')
                    .trigger('change');
            return false;
        }
    );
    
    $('#all-close').on('click',
        /**
         * Closes all open editors either when new one is to eppear OR user clicks outside.
         */
        function() {
            $('.bus').each((_, editor) => {
                const $editor = $(editor);
                const v = deflateBus($editor);
                $editor.replaceWith(showBusView(v, $editor.attr('id')));
            });
            history.replaceState(null, null, ' ');
        }
    )
    
    $(document).on('click', '.bus-view span',
        /**
         * A small courtesy of remembering where user clicked to open editor on the same section.
         */
        function(e) {
            const $viewer = $(this).closest('.bus-view'); // Get the closest .bus-view
            const isClone = $(this).closest('.clone').length > 0; // Determine if it's inside a clone
            const selector = isClone ? '.clone span' : '.bus-view span'; // Adjusted selector
            const selection = $viewer.find(selector).index(this);
            
            $viewer.data('selection', selection);
            return true;
        }
    );
});

$(document).ready(function() {
    function expandEnds(container) {
        var rightWidth = $(container).find('.right').outerWidth();
        var halfRightWidth = rightWidth / 2;
        $(container)
            .find('.rear').css('transform', `rotateY(-90deg) translateZ(${halfRightWidth}px)`)
            .end()
            .find('.front').css('transform', `rotateY(90deg) translateZ(${halfRightWidth}px)`);
        return container;
    }
    
    function bendOneSide($side, bendLineHeight = 50, angle = 7) {
        $side.clone()
            .insertAfter($side)
            .css('clip-path', `polygon(0 0, 100% 0, 100% ${bendLineHeight}%, 0 ${bendLineHeight}%)`)
            .css('transform', function(i, curr) { return curr + ` rotateX(${angle}deg)`; })
            .addClass('clone')
            .end()
            .end()
            .css('clip-path', `polygon(0 ${bendLineHeight}%, 100% ${bendLineHeight}%, 100% 100%, 0 100%)`);
    }
    
    function bendWindows(container) {
        'right,front,left,rear'.split(',')
            .forEach((s, i) => bendOneSide($(container).find('.' + s), i === 1 ? 50 : 43, 1 === i % 2 ? 7 : 5));
    }
    
    function updateTransform(container) {
        expandEnds(container);
        bendWindows(container);
        return container;
    }
    
    $(document).on("updateTransform", function(event, container) {
        updateTransform(container);
    });
    
    // Observe the document for added nodes
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if ($(node).hasClass('paper-net')) {
                    // If the added node is a .paper-net, update its .rear transform
                    //updateTransform(node);
                    $(document).trigger("updateTransform", [node]);
                } else {
                    //$(node).find('.paper-net').each(updateTransform);
                    $(node).find('.paper-net').each(function() {
                        $(document).trigger("updateTransform", [this]);
                    });
                }
            });
        });
    });

    // Start observing the document body for child node additions
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    $('.paper-net').get().forEach(updateTransform);
});
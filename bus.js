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

function group$(num, typ, tgt, groupName, selection) {
    const array = Array.from({ length: num }).map((_, n) => option$(typ, n, groupName, tgt, typ + n === selection));
    return unzip(array);
}

/**
 * Generates individual editing section of a bus.
 *
 * @param {string} parentId - Unique identifier for top HTML.
 * @param {int} n - Positional number of this section.
 * @return {jQuery Object} Individual section of a bus editor.
 */
function slot$(parentId, n, busGroup = null, selected = false) {
    const groupName = `${parentId}slot${n}`;
    const _grp = (num, typ, tgt) => group$(num, typ, tgt, groupName);

    const sources = [
        { labels: '<a href="" class="insert" title="insert">+</a><a href="" class="delete" title="delete">-</a><br/>' },
        option$('t', 0, groupName, 'top'),
        option$('j', 0, groupName, 'top'),
        _grp(2, 'h', 'top'),
        _grp(3, 'f', 'top'),
        _grp(2, 'r', 'top'),
        { labels: '<br/>' },
        _grp(10, 'd', 'top'),
        { labels: '<br/>' },
        _grp(9, 'w', 'top'),
        { inputs: '<br class="conditional"/>', labels: '<br class="conditional"/>' },
        option$('blank', '0', groupName, 'bottom'),
        _grp(6, 'a', 'bottom'),
        { labels: '<br/>' },
        _grp(7, 'l', 'bottom'),
        { labels: '<br/>' },
        option$('l', '00', groupName, 'bottom'),
        option$('l', '000', groupName, 'bottom')
    ];

    const { inputs, labels } = unzip(sources);
    
    const [open, close] = ['open', 'close'].map(action => shadow$(groupName, action));

    const $slots = $('<span class="slot" />').append(
        inputs,
        open.inputs, close.inputs,
        $('<span/>', { class: 'shadow' }).append(open.labels),
        $('<span/>', { class: 'shadow' }).append(close.labels),
        $('<div/>', { class: 'picker' }).append(labels)
    );
    
    if(busGroup) {
        busGroup.map(busElement => {
            const $matchingInput = $slots.find(`input[value="${busElement}"]`);
            if ($matchingInput.length) {
                $slots.find(`input[name="${$matchingInput.attr('name')}"]`).val([busElement]);
            }
        });
    }
    
    return $slots;
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
function playground$(id, bus) {
    const busLayout = splitSidesInSource(bus);
    const busGroups = bus.replace(COLOR_RX, '').match(GROUP_RX) || ['t0h0'];
    const livreys = group$(9, 'c', 'paint', id, busLayout[0]);
    const pivot = 'right,front,left,rear'.split(',');
    
    let globalIndex = 0;
    return $(`<fieldset class="bus" id="${id}" />`)
        .append(livreys.inputs)
        .append(busLayout.slice(1).map((side, n) =>
            side.length && $(`<div class='${pivot[n]} face'/>`)
                .html(
                    side.map(busGroup => slot$(id, globalIndex++, busGroup))
                )
        ))
        .append($('.templates > .options').clone())
            .find('.menu.open').attr('for', function() { return $(this).parents('.bus').attr('id') + 'menu'; }).end()
            .find('.menu-input').attr('id', function() { return $(this).parents('.bus').attr('id') + 'menu'; }).end()
            .find('.paint')
                .append(livreys.labels).end();
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
            Array.from(new FormData($('#bus2').closest('form').get(0)))
                .filter(el => el[0].startsWith(id))
        )
    ).join(' ');
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
    return playground$(id, bus).data('initial-bus', bus);
}

function getBusLength(bus) {
    return (bus.match(/([dhfjrtw])\d+/g) || []).length;
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
    const renderer = /(?:r\d+|f\d+|h\d+(?:.*?h\d+)+)/.test(bus) ? fullRenderer : flatRenderer;
    return renderer(...outlineFormatter(showBus(bus), id)).attr({id});
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

function busIncludes(bigBus, miniBus) {
    return normalizeBus(bigBus).includes(normalizeBus(miniBus));
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
                console.log(...consoleFormatter(showBus(bus)));
                window.localStorage.setItem(id, bus);
                $playground.data('initial-bus', bus);
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
            $viewer
                .filter('.paper-net')
                    .siblings()
                        .remove()
                        .end()
                    .unwrap()
                    .end()
                .replaceWith($editor);
            
            //if($editor.parent().hasClass('warp')) {
                //$editor.siblings().remove().end().unwrap();
            //}
            
            $editor.get(0).scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    );
    
    console.group(`WELLCOME\nto the legend of...`);
    console.log(...((b1, b2) => [b1[0] + b2[0], ...b1.slice(1).concat(b2.slice(1))])(consoleFormatter(showBus('f0')), consoleFormatter(showBus('f1 c2'))));
    console.log(...either(
        ['%c I k a %cr%c u %cs', 'font-style: italic; text-decoration: underline', 'font-style: italic', 'font-style: italic; text-decoration: underline', 'font-style: italic'],
        ['%c_I_k_a_r_u_s', 'font-style: italic; font-weight: bold;']
    ));
    console.groupEnd();
});

/**
 * Recalculates index of a linear element within a string
 * to an index of a grouped 2-storey elements.
 */
function findGroupIndex(bus, linearIndex) {
    return bus.replace(COLOR_RX, '') // Exclude 'c'-element
        .split(ELEMENT_RX)           // Break into char/number elements
        .slice(0, linearIndex + 1)  // Split at original index
        .join('')                   // Back to string
        .match(GROUP_RX) // Now split in groups
        .length - 1;                // Our items should end up last
}

function getUrlParams() { //https://stackoverflow.com/a/21152762/35438
    return location.search
        ? location.search.substr(1).split`&`.reduce((qd, item) => {let [k,v] = item.split`=`; v = v && decodeURIComponent(v); (qd[k] = qd[k] || []).push(v); return qd}, {})
        : {};
}

/**
 * Bootstrapping and loading.
 */
$(function() {
    if (new URLSearchParams(window.location.search).has('clearLocalStorage')) {
        localStorage.clear();

        // Remove 'clearLocalStorage' from URL without reloading
        const url = new URL(window.location.href);
        url.searchParams.delete('clearLocalStorage');
        history.replaceState(null, "", url.toString());
    }
    
    var urlParams = getUrlParams();
    window.history.pushState('object', document.title, location.href.split("?")[0]);
    
    var entries = Object.entries(
        Object.assign({}, 
            Object.fromEntries(
                (localStorage['order'] ?? (localStorage['order'] = Object.keys(SPEC.genesys).toString()))
                    .split(',')
                    .map(a => [a, undefined])
            ),// Sort
            Object.assign(
                localStorage,       // Save defaults if empty
                Object.assign(
                    {},
                    SPEC.genesys,        // Defaults
                    localStorage,   // Existing
                    urlParams       // From URL
                )
            )
        )
    ).filter(kvp => kvp[0].match(/^bus\d+$/i) && kvp[1]);
    
    urlParams['add'] && entries.push(['bus' + new Date().getTime(), urlParams['add'][0]]);
    
    const selectedIndex = window.location.hash ? entries.findIndex(e => busIncludes(e[1], window.location.hash.slice(1))) : -1;
    window.location.hash && 0 > selectedIndex
        && 0 < getBusLength(window.location.hash.slice(1))
        && entries.push(['bus' + new Date().getTime(), window.location.hash.slice(1)]);
    
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
});

/**
 * Editing assistance.
 */
$(function() {
    var renumber = function(replacer) { return function(n, i) { return i && i.replace(/(?<=slot)(\d+)/, replacer); } };
    
    $(document).on('click', '.picker .insert',
        /**
         * Handles insertion of a bus section by renaming following sections in accordance with their new order.
         */
        function(e) {
            var $slot = $(this).parents('.slot');
            let id = Date.now();
            var $newSlot = $slot.clone()
                .find('[for],[name],[id]')
                    .attr('for', renumber(id))
                    .attr('name', renumber(id))
                    .attr('id', renumber(id))
                    .end()
                .insertAfter($slot)
                .end()
                .end()
                .find('[type="radio"]:not(.close):not(.open):not(.menu-input):first')
                    .trigger('change');
            return false;
        }
    );
    
    $(document).on('click', '.picker .delete', function(e) {
        var $slot = $(this).parents('.slot');
        let $radio =  $(this).parents('.bus')
            .find('.slot')
            .not($slot)
            .filter(':first')
            .find('[type="radio"]:not(.close):not(.open):not(.menu-input):first');
        
        // Hide the slot instead of removing immediately
        $slot.css({ opacity: 0.5 }).slideUp(300);

        // Track whether undo is clicked
        let undoClicked = false;

        // Provide an undo button
        let $undoBtn = $("<button class='undo-btn'>Undo</button>")
            .insertAfter(".bus")
            .on("click", function() {
                undoClicked = true; // Mark undo as used
                $slot.stop().css({ opacity: 1 }).slideDown(300).removeClass("undo");
                $(this).remove(); // Remove undo button
            });

        // Delayed deletion (only if undo wasn’t clicked)
        setTimeout(function() {
            if (!undoClicked) {  
                $slot.remove();
                $radio.trigger("change");
            }
            $undoBtn.remove(); // Cleanup undo button
        }, 3000); // 5-second grace period

        return false;
    });

    
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
            const selector = isClone ? '.clone span' : ':not(.clone) span'; // Adjusted selector
            const selection = $viewer.find(selector + ',>span').index(this);
            $viewer.data('selection', selection);
            return true;
        }
    );
});
/**
 * 3D.
 */
$(document).ready(function() {
    function expandEnds(container) {
        var busLength = $(container).find('.right').outerWidth();
        var halfRightWidth = busLength / 2;
        $(container)
            .find('.rear').css('transform', `rotateY(-90deg) translateZ(${halfRightWidth}px)`)
            .end()
            .find('.front').css('transform', `rotateY(90deg) translateZ(${halfRightWidth}px)`)
            .end()
            .find('.top').css('width', busLength);
        return container;
    }
    
    function bendOneSide($side, bendLineHeight = 50, angle = 7) {
        ($side.next('.clone:not(.top)').length ? $side.next('.clone') : $side.clone()
            .insertAfter($side)
            .addClass('clone')
            .find('.a,.l').hide().end()
        )   .css({
                'clip-path': `polygon(0 0, 100% 0, 100% ${bendLineHeight}%, 0 ${bendLineHeight}%)`,
                'transform': (_, curr) => (curr || '') + ` rotateX(${angle}deg)`
            });
        $side.css('clip-path', `polygon(0 ${bendLineHeight}%, 100% ${bendLineHeight}%, 100% 100%, 0 100%)`);
    }
    
    function bendWindows(container) {
        'right,front,left,rear'.split(',')
            .forEach((s, i) => bendOneSide($(container).find(`.${s}:not(.clone)`), i === 1 ? 50 : 43, 1 === i % 2 ? 7 : 5));
    }
    
    /**
     * Fake roof until editing support added.
     */
    function injectRoof(container) {
        if($('.top.clone', container).length) return;
        const busLength = $(container).find('.right').outerWidth();
        const n = Math.ceil((busLength - 10 - 9) / 16);
        if(n < 0) return;
        $('<div class="top clone"><span style="width:9px" class="s s5">[</span>')
            .append('<span style="width:16px" class="s s0">|</span>'.repeat(n)
            + '<span style="width:10px" class="s s4">]</span></div>')
            .appendTo(container);
    }
    
    function addTiltControl(container) {
        if (!$(container).parent().hasClass('warp')) { // Prevent endless wrapping
            $(container).wrap(
                '<span class="warp"></span>'
                    
            ).parent().prepend('nw,ne,se,sw'.split(',').map(cl => `<span class="${cl}"/>`));
        }
    }
    
    function updateTransform(container) {
        observer.disconnect();
        
        addTiltControl(container);
        injectRoof(container);
        expandEnds(container);
        bendWindows(container);
        
        observer.observe(document.body, { childList: true, subtree: true });
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
                    $(document).trigger("updateTransform", [node]);
                } else {
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
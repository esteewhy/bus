function either(...args) {
    if (args.length === 0) {
        throw new Error("At least one argument is required");
    }
    const randomIndex = Math.floor(Math.random() * args.length);
    return args[randomIndex];
}

function generateBus() {
    const flipSide = (side) => 
        side.split(/\s+|(?<=\d+)(?=[a-z])/g)
            .reverse()
            .join('')
            .replace(/([al]\d+)(\w\d+)/g, "$2$1");
    
    const assymetrize = (side) =>
        side.replace(/search + '(?!.*' + search + ')'/)
            .replace(/(?<=h\d+)d[567]/, 'w3')
            .replace(/d[567]/g, 'w2')
            .replace(/d[4]/g, 'w3')
            .replace(/d[3]/g, either('w3', 'w5'))
            .replace('l4', 'l5')
            .replace(/d[012]w[46](l\d)?(t\d)/, 'w1$1$2');
    
    const parts = {
        right: ['t0'],
        front: [ either('f0', 'f1', 'f2') ],
        left: [],
        rear: [ either('r0', 'r1') ],
        misc: [`c${Math.floor(Math.random() * 8) + 1}`]
    };

    const isRearEngined = parts.rear[0] === 'r1';
    parts.right.push(isRearEngined
        ? either(
            either('w6', 'w4 l4') + either('d0', 'd1', 'd2', 'w4'),
            either('w0', 'w1', 'w7', 'w8') + ' l4'
        )
        : either(
            either('w6 d7', 'w6 d6'),
            either('w2', 'd7', 'd5')
        ),
        either(
            either('w0', 'w1', 'w2', 'w7', 'w8').repeat(either(4, 5)),
            either('w2', 'w0').repeat(4).replace(/^(.{4})/, "$1" + either('d5', 'd7', either('w2', 'w0')))
        )
            .replace(/^(.{2})/, "$1" + either('a0', 'a1', 'a2'))
        + ' ' + either('a3', 'a4', 'a5'),
        either('d3', 'd4', 'd5', 'd6', 'd8'),
        'f2' === parts.front ? 'h1' : 'h0'
    );

    parts.left = assymetrize(flipSide(parts.right.join('')));
    return Object.values(parts).flat().join("");
}

$(function() {
    function shake() {
        const bus = generateBus();
        const $hint = $('.add-bus').attr('href', '?add=' + encodeURIComponent(bus))
            .parent()
            .find('.hint')
            .html(showBusView(bus).click(function() {
                shake();
                return false;
            }));
            return $hint;
    }
    
    let $preview = shake();
    
    function waitForVisibility() {
        if ($preview.is(':visible')) {
            $(document).trigger("updateTransform", [$preview.find('.paper-net')]);
        } else {
            requestAnimationFrame(waitForVisibility);
        }
    }
    requestAnimationFrame(waitForVisibility);
});
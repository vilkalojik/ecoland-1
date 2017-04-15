// Required for Meteor package, the use of window prevents export by Meteor
(function(window){
    if(window.Package){
        Materialize = {};
    } else {
        window.Materialize = {};
    }
})(window);


/*
 * raf.js
 * https://github.com/ngryman/raf.js
 *
 * original requestAnimationFrame polyfill by Erik Möller
 * inspired from paul_irish gist and post
 *
 * Copyright (c) 2013 ngryman
 * Licensed under the MIT license.
 */
(function(window) {
    var lastTime = 0,
        vendors = ['webkit', 'moz'],
        requestAnimationFrame = window.requestAnimationFrame,
        cancelAnimationFrame = window.cancelAnimationFrame,
        i = vendors.length;

    // try to un-prefix existing raf
    while (--i >= 0 && !requestAnimationFrame) {
        requestAnimationFrame = window[vendors[i] + 'RequestAnimationFrame'];
        cancelAnimationFrame = window[vendors[i] + 'CancelRequestAnimationFrame'];
    }

    // polyfill with setTimeout fallback
    // heavily inspired from @darius gist mod: https://gist.github.com/paulirish/1579671#comment-837945
    if (!requestAnimationFrame || !cancelAnimationFrame) {
        requestAnimationFrame = function(callback) {
            var now = +Date.now(),
                nextTime = Math.max(lastTime + 16, now);
            return setTimeout(function() {
                callback(lastTime = nextTime);
            }, nextTime - now);
        };

        cancelAnimationFrame = clearTimeout;
    }

    // export to window
    window.requestAnimationFrame = requestAnimationFrame;
    window.cancelAnimationFrame = cancelAnimationFrame;
}(window));


/**
 * Generate approximated selector string for a jQuery object
 * @param {jQuery} obj  jQuery object to be parsed
 * @returns {string}
 */
Materialize.objectSelectorString = function(obj) {
    var tagStr = obj.prop('tagName') || '';
    var idStr = obj.attr('id') || '';
    var classStr = obj.attr('class') || '';
    return (tagStr + idStr + classStr).replace(/\s/g,'');
};


// Unique Random ID
Materialize.guid = (function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };
})();

/**
 * Escapes hash from special characters
 * @param {string} hash  String returned from this.hash
 * @returns {string}
 */
Materialize.escapeHash = function(hash) {
    return hash.replace( /(:|\.|\[|\]|,|=)/g, "\\$1" );
};

Materialize.elementOrParentIsFixed = function(element) {
    var $element = $(element);
    var $checkElements = $element.add($element.parents());
    var isFixed = false;
    $checkElements.each(function(){
        if ($(this).css("position") === "fixed") {
            isFixed = true;
            return false;
        }
    });
    return isFixed;
};


/**
 * Get time in ms
 * @license https://raw.github.com/jashkenas/underscore/master/LICENSE
 * @type {function}
 * @return {number}
 */
var getTime = (Date.now || function () {
    return new Date().getTime();
});


/**
 * Returns a function, that, when invoked, will only be triggered at most once
 * during a given window of time. Normally, the throttled function will run
 * as much as it can, without ever going more than once per `wait` duration;
 * but if you'd like to disable the execution on the leading edge, pass
 * `{leading: false}`. To disable execution on the trailing edge, ditto.
 * @license https://raw.github.com/jashkenas/underscore/master/LICENSE
 * @param {function} func
 * @param {number} wait
 * @param {Object=} options
 * @returns {Function}
 */
Materialize.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function () {
        previous = options.leading === false ? 0 : getTime();
        timeout = null;
        result = func.apply(context, args);
        context = args = null;
    };
    return function () {
        var now = getTime();
        if (!previous && options.leading === false) previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0) {
            clearTimeout(timeout);
            timeout = null;
            previous = now;
            result = func.apply(context, args);
            context = args = null;
        } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };
};


// Velocity has conflicts when loaded with jQuery, this will check for it
// First, check if in noConflict mode
var Vel;
if (jQuery) {
    Vel = jQuery.Velocity;
} else if ($) {
    Vel = $.Velocity;
} else {
    Vel = Velocity;
}

(function ($) {

    var methods = {

        init : function(options) {
            var defaults = {
                duration: 200, // ms
                dist: -100, // zoom scale TODO: make this more intuitive as an option
                shift: 0, // spacing for center image
                padding: 0, // Padding between non center items
                fullWidth: false, // Change to full width styles
                indicators: false, // Toggle indicators
                noWrap: false, // Don't wrap around and cycle through items.
                onCycleTo: null // Callback for when a new slide is cycled to.
            };
            options = $.extend(defaults, options);
            var namespace = Materialize.objectSelectorString($(this));

            return this.each(function(i) {

                var uniqueNamespace = namespace+i;
                var images, item_width, item_height, offset, center, pressed, dim, count,
                    reference, referenceY, amplitude, target, velocity, scrolling,
                    xform, frame, timestamp, ticker, dragged, vertical_dragged;
                var $indicators = $('<ul class="indicators"></ul>');
                var scrollingTimeout = null;


                // Initialize
                var view = $(this);
                var showIndicators = view.attr('data-indicators') || options.indicators;


                // Options
                var setCarouselHeight = function() {
                    var firstImage = view.find('.carousel-item img').first();
                    if (firstImage.length) {
                        if (firstImage.prop('complete')) {
                            view.css('height', firstImage.height());
                        } else {
                            firstImage.on('load', function(){
                                view.css('height', $(this).height());
                            });
                        }
                    } else {
                        var imageHeight = view.find('.carousel-item').first().height();
                        view.css('height', imageHeight);
                    }
                };

                if (options.fullWidth) {
                    options.dist = 0;
                    setCarouselHeight();

                    // Offset fixed items when indicators.
                    if (showIndicators) {
                        view.find('.carousel-fixed-item').addClass('with-indicators');
                    }
                }


                // Don't double initialize.
                if (view.hasClass('initialized')) {
                    // Recalculate variables
                    $(window).trigger('resize');

                    // Redraw carousel.
                    $(this).trigger('carouselNext', [0.000001]);
                    return true;
                }


                view.addClass('initialized');
                pressed = false;
                offset = target = 0;
                images = [];
                item_width = view.find('.carousel-item').first().innerWidth();
                item_height = view.find('.carousel-item').first().innerHeight();
                dim = item_width * 2 + options.padding;

                view.find('.carousel-item').each(function (i) {
                    images.push($(this)[0]);
                    if (showIndicators) {
                        var $indicator = $('<li class="indicator-item"></li>');

                        // Add active to first by default.
                        if (i === 0) {
                            $indicator.addClass('active');
                        }

                        // Handle clicks on indicators.
                        $indicator.click(function (e) {
                            e.stopPropagation();

                            var index = $(this).index();
                            cycleTo(index);
                        });
                        $indicators.append($indicator);
                    }
                });

                if (showIndicators) {
                    view.append($indicators);
                }
                count = images.length;


                function setupEvents() {
                    if (typeof window.ontouchstart !== 'undefined') {
                        view[0].addEventListener('touchstart', tap);
                        view[0].addEventListener('touchmove', drag);
                        view[0].addEventListener('touchend', release);
                    }
                    view[0].addEventListener('mousedown', tap);
                    view[0].addEventListener('mousemove', drag);
                    view[0].addEventListener('mouseup', release);
                    view[0].addEventListener('mouseleave', release);
                    view[0].addEventListener('click', click);
                }

                function xpos(e) {
                    // touch event
                    if (e.targetTouches && (e.targetTouches.length >= 1)) {
                        return e.targetTouches[0].clientX;
                    }

                    // mouse event
                    return e.clientX;
                }

                function ypos(e) {
                    // touch event
                    if (e.targetTouches && (e.targetTouches.length >= 1)) {
                        return e.targetTouches[0].clientY;
                    }

                    // mouse event
                    return e.clientY;
                }

                function wrap(x) {
                    return (x >= count) ? (x % count) : (x < 0) ? wrap(count + (x % count)) : x;
                }

                function scroll(x) {
                    // Track scrolling state
                    scrolling = true;
                    if (!view.hasClass('scrolling')) {
                        view.addClass('scrolling');
                    }
                    if (scrollingTimeout != null) {
                        window.clearTimeout(scrollingTimeout);
                    }
                    scrollingTimeout = window.setTimeout(function() {
                        scrolling = false;
                        view.removeClass('scrolling');
                    }, options.duration);

                    // Start actual scroll
                    var i, half, delta, dir, tween, el, alignment, xTranslation;
                    var lastCenter = center;

                    offset = (typeof x === 'number') ? x : offset;
                    center = Math.floor((offset + dim / 2) / dim);
                    delta = offset - center * dim;
                    dir = (delta < 0) ? 1 : -1;
                    tween = -dir * delta * 2 / dim;
                    half = count >> 1;

                    if (!options.fullWidth) {
                        alignment = 'translateX(' + (view[0].clientWidth - item_width) / 2 + 'px) ';
                        alignment += 'translateY(' + (view[0].clientHeight - item_height) / 2 + 'px)';
                    } else {
                        alignment = 'translateX(0)';
                    }

                    // Set indicator active
                    if (showIndicators) {
                        var diff = (center % count);
                        var activeIndicator = $indicators.find('.indicator-item.active');
                        if (activeIndicator.index() !== diff) {
                            activeIndicator.removeClass('active');
                            $indicators.find('.indicator-item').eq(diff).addClass('active');
                        }
                    }

                    // center
                    // Don't show wrapped items.
                    if (!options.noWrap || (center >= 0 && center < count)) {
                        el = images[wrap(center)];

                        // Add active class to center item.
                        if (!$(el).hasClass('active')) {
                            view.find('.carousel-item').removeClass('active');
                            $(el).addClass('active');
                        }
                        el.style[xform] = alignment +
                            ' translateX(' + (-delta / 2) + 'px)' +
                            ' translateX(' + (dir * options.shift * tween * i) + 'px)' +
                            ' translateZ(' + (options.dist * tween) + 'px)';
                        el.style.zIndex = 0;
                        if (options.fullWidth) { tweenedOpacity = 1; }
                        else { tweenedOpacity = 1 - 0.2 * tween; }
                        el.style.opacity = tweenedOpacity;
                        el.style.display = 'block';
                    }

                    for (i = 1; i <= half; ++i) {
                        // right side
                        if (options.fullWidth) {
                            zTranslation = options.dist;
                            tweenedOpacity = (i === half && delta < 0) ? 1 - tween : 1;
                        } else {
                            zTranslation = options.dist * (i * 2 + tween * dir);
                            tweenedOpacity = 1 - 0.2 * (i * 2 + tween * dir);
                        }
                        // Don't show wrapped items.
                        if (!options.noWrap || center + i < count) {
                            el = images[wrap(center + i)];
                            el.style[xform] = alignment +
                                ' translateX(' + (options.shift + (dim * i - delta) / 2) + 'px)' +
                                ' translateZ(' + zTranslation + 'px)';
                            el.style.zIndex = -i;
                            el.style.opacity = tweenedOpacity;
                            el.style.display = 'block';
                        }


                        // left side
                        if (options.fullWidth) {
                            zTranslation = options.dist;
                            tweenedOpacity = (i === half && delta > 0) ? 1 - tween : 1;
                        } else {
                            zTranslation = options.dist * (i * 2 - tween * dir);
                            tweenedOpacity = 1 - 0.2 * (i * 2 - tween * dir);
                        }
                        // Don't show wrapped items.
                        if (!options.noWrap || center - i >= 0) {
                            el = images[wrap(center - i)];
                            el.style[xform] = alignment +
                                ' translateX(' + (-options.shift + (-dim * i - delta) / 2) + 'px)' +
                                ' translateZ(' + zTranslation + 'px)';
                            el.style.zIndex = -i;
                            el.style.opacity = tweenedOpacity;
                            el.style.display = 'block';
                        }
                    }

                    // center
                    // Don't show wrapped items.
                    if (!options.noWrap || (center >= 0 && center < count)) {
                        el = images[wrap(center)];
                        el.style[xform] = alignment +
                            ' translateX(' + (-delta / 2) + 'px)' +
                            ' translateX(' + (dir * options.shift * tween) + 'px)' +
                            ' translateZ(' + (options.dist * tween) + 'px)';
                        el.style.zIndex = 0;
                        if (options.fullWidth) { tweenedOpacity = 1; }
                        else { tweenedOpacity = 1 - 0.2 * tween; }
                        el.style.opacity = tweenedOpacity;
                        el.style.display = 'block';
                    }

                    // onCycleTo callback
                    if (lastCenter !== center &&
                        typeof(options.onCycleTo) === "function") {
                        var $curr_item = view.find('.carousel-item').eq(wrap(center));
                        options.onCycleTo.call(this, $curr_item, dragged);
                    }
                }

                function track() {
                    var now, elapsed, delta, v;

                    now = Date.now();
                    elapsed = now - timestamp;
                    timestamp = now;
                    delta = offset - frame;
                    frame = offset;

                    v = 1000 * delta / (1 + elapsed);
                    velocity = 0.8 * v + 0.2 * velocity;
                }

                function autoScroll() {
                    var elapsed, delta;

                    if (amplitude) {
                        elapsed = Date.now() - timestamp;
                        delta = amplitude * Math.exp(-elapsed / options.duration);
                        if (delta > 2 || delta < -2) {
                            scroll(target - delta);
                            requestAnimationFrame(autoScroll);
                        } else {
                            scroll(target);
                        }
                    }
                }

                function click(e) {
                    // Disable clicks if carousel was dragged.
                    if (dragged) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;

                    } else if (!options.fullWidth) {
                        var clickedIndex = $(e.target).closest('.carousel-item').index();
                        var diff = (center % count) - clickedIndex;

                        // Disable clicks if carousel was shifted by click
                        if (diff !== 0) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        cycleTo(clickedIndex);
                    }
                }

                function cycleTo(n) {
                    var diff = (center % count) - n;

                    // Account for wraparound.
                    if (!options.noWrap) {
                        if (diff < 0) {
                            if (Math.abs(diff + count) < Math.abs(diff)) { diff += count; }

                        } else if (diff > 0) {
                            if (Math.abs(diff - count) < diff) { diff -= count; }
                        }
                    }

                    // Call prev or next accordingly.
                    if (diff < 0) {
                        view.trigger('carouselNext', [Math.abs(diff)]);

                    } else if (diff > 0) {
                        view.trigger('carouselPrev', [diff]);
                    }
                }

                function tap(e) {
                    e.preventDefault();
                    pressed = true;
                    dragged = false;
                    vertical_dragged = false;
                    reference = xpos(e);
                    referenceY = ypos(e);

                    velocity = amplitude = 0;
                    frame = offset;
                    timestamp = Date.now();
                    clearInterval(ticker);
                    ticker = setInterval(track, 100);
                }

                function drag(e) {
                    var x, delta, deltaY;
                    if (pressed) {
                        x = xpos(e);
                        y = ypos(e);
                        delta = reference - x;
                        deltaY = Math.abs(referenceY - y);
                        if (deltaY < 30 && !vertical_dragged) {
                            // If vertical scrolling don't allow dragging.
                            if (delta > 2 || delta < -2) {
                                dragged = true;
                                reference = x;
                                scroll(offset + delta);
                            }

                        } else if (dragged) {
                            // If dragging don't allow vertical scroll.
                            e.preventDefault();
                            e.stopPropagation();
                            return false;

                        } else {
                            // Vertical scrolling.
                            vertical_dragged = true;
                        }
                    }

                    if (dragged) {
                        // If dragging don't allow vertical scroll.
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                }

                function release(e) {
                    if (pressed) {
                        pressed = false;
                    } else {
                        return;
                    }

                    clearInterval(ticker);
                    target = offset;
                    if (velocity > 10 || velocity < -10) {
                        amplitude = 0.9 * velocity;
                        target = offset + amplitude;
                    }
                    target = Math.round(target / dim) * dim;

                    // No wrap of items.
                    if (options.noWrap) {
                        if (target >= dim * (count - 1)) {
                            target = dim * (count - 1);
                        } else if (target < 0) {
                            target = 0;
                        }
                    }
                    amplitude = target - offset;
                    timestamp = Date.now();
                    requestAnimationFrame(autoScroll);

                    if (dragged) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    return false;
                }

                xform = 'transform';
                ['webkit', 'Moz', 'O', 'ms'].every(function (prefix) {
                    var e = prefix + 'Transform';
                    if (typeof document.body.style[e] !== 'undefined') {
                        xform = e;
                        return false;
                    }
                    return true;
                });


                $(window).off('resize.carousel-'+uniqueNamespace).on('resize.carousel-'+uniqueNamespace, function() {
                    if (options.fullWidth) {
                        item_width = view.find('.carousel-item').first().innerWidth();
                        item_height = view.find('.carousel-item').first().innerHeight();
                        dim = item_width * 2 + options.padding;
                        offset = center * 2 * item_width;
                        target = offset;
                    } else {
                        scroll();
                    }
                });

                setupEvents();
                scroll(offset);

                $(this).on('carouselNext', function(e, n) {
                    if (n === undefined) {
                        n = 1;
                    }
                    target = (dim * Math.round(offset / dim)) + (dim * n);
                    if (offset !== target) {
                        amplitude = target - offset;
                        timestamp = Date.now();
                        requestAnimationFrame(autoScroll);
                    }
                });

                $(this).on('carouselPrev', function(e, n) {
                    if (n === undefined) {
                        n = 1;
                    }
                    target = (dim * Math.round(offset / dim)) - (dim * n);
                    if (offset !== target) {
                        amplitude = target - offset;
                        timestamp = Date.now();
                        requestAnimationFrame(autoScroll);
                    }
                });

                $(this).on('carouselSet', function(e, n) {
                    if (n === undefined) {
                        n = 0;
                    }
                    cycleTo(n);
                });

            });



        },
        next : function(n) {
            $(this).trigger('carouselNext', [n]);
        },
        prev : function(n) {
            $(this).trigger('carouselPrev', [n]);
        },
        set : function(n) {
            $(this).trigger('carouselSet', [n]);
        }
    };


    $.fn.carouselMaterialize = function(methodOrOptions) {
        if ( methods[methodOrOptions] ) {
            return methods[ methodOrOptions ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
            // Default to "init"
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  methodOrOptions + ' does not exist on jQuery.carousel' );
        }
    }; // Plugin end
}( jQuery ));
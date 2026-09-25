/*
* Template Name: BreezyCV - Resume / CV / vCard / Portfolio Template
* Author: LMPixels
* Author URL: http://themeforest.net/user/lmpixels
* Version: 1.7.0
*/

var PageTransitions = (function ($, options) {
"use strict";
    var sectionsContainer = $(".animated-sections"),
        isAnimating = false,
        endCurrentPage = true,
        endNextPage = false,
        windowArea = $(window),
        animEndEventNames = {
            'WebkitAnimation'   : 'webkitAnimationEnd',
            'OAnimation'        : 'oAnimationEnd',
            'msAnimation'       : 'MSAnimationEnd',
            'animation'         : 'animationend'
        },

        // animation end event name
        animEndEventName = animEndEventNames[Modernizr.prefixed('animation')],

        // support css animations
        support = Modernizr.cssanimations,

        // Animation used for every section change (1 - 69, see the switch in Animate()).
        // Set with the "animation" option in main.js. A link's own data-animation
        // attribute still takes priority.
        defaultAnimation = 69,

        // Set by the up/down arrows so the page flip follows the arrow pressed,
        // even when it wraps around (e.g. "up" from the first section).
        // null = work it out from the section order.
        arrowDirection = null;

    function init(options) {

        if (options && options.animation) {
            defaultAnimation = options.animation;
        }

        // Get all the .animated-section sections.
        $('.animated-section').each( function() {
            var $page = $(this);
            $page.data('originalClassList', $page.attr('class'));
        });

        // Get all the .pt-wrapper div which is the parent for all pt-div
        sectionsContainer.each( function() {
            if (location.hash === "") {
                $('section[data-id='+ pageStart +']').addClass('section-active');
            }
        });

        // Adding click event to main menu link
        $('.nav-anim').on("click", function (e) {
            e.preventDefault();
            if (isAnimating) {
                return false;
            }
            var pageTrigger = $(this);

            activeMenuItem( pageTrigger );

            Animate( pageTrigger );

            location.hash = $(this).attr('href');

        });

        window.onhashchange = function(event) {
            if(location.hash) {
                if (isAnimating) {
                    return false;
                }
                var menuLink = $(menu+' a[href*="'+location.hash.split('/')[0]+'"]');
                activeMenuItem( menuLink );
                Animate(menuLink);

                ajaxLoader();
            }
        };

        var menu = options.menu,
        pageStart = getActiveSection();

        location.hash = pageStart;
        var menuLink = $(menu+' a[href*="'+location.hash.split('/')[0]+'"]');

        activeMenuItem(menuLink);

        Animate(menuLink);

        $('body').append('<div id="page-ajax-loaded" class="page-ajax-loaded animated animated-section-moveFromLeft"></div>');
        ajaxLoader();

        // Down arrow: next section
        $(".lmpixels-arrow-right").click(function() {
            var activeItem = $('.main-menu a.active').parent("li");
            arrowDirection = 'forward';
            activeItem.next("li").children("a").click();
            if ( activeItem.is(':last-child') ) {
                $('.main-menu li:first-child').children("a").click();
            }
            arrowDirection = null;
        });

        // Up arrow: previous section
        $(".lmpixels-arrow-left").click(function() {
            var activeItem = $('.main-menu a.active').parent("li");
            arrowDirection = 'back';
            activeItem.prev("li").children("a").click();
            if ( activeItem.is(':first-child') ) {
                $('.main-menu li:last-child').children("a").click();
            }
            arrowDirection = null;
        });

        scrollNavInit();
    }

    // Scrolling past the end of a card moves to the next card (and past the
    // top, to the previous one). It needs a deliberate extra push once the
    // card has stopped at its edge, so a fast flick to the bottom doesn't also
    // skip a card. Like the arrows it wraps around (Blog -> Home and back).
    function scrollNavInit() {
        var container = $('.animated-sections')[0],
            PUSH_NEEDED = 200,   // px of scrolling at the edge (about two mouse-wheel notches)
            SETTLE_MS = 350,     // the card must have stopped scrolling this long first
            GESTURE_GAP_MS = 600, // a pause this long starts a fresh push
            COOLDOWN_MS = 1200,  // after changing card, ignore scrolling for a moment
            push = 0,
            lastWheel = 0,
            lastScroll = 0,
            blockedUntil = 0,
            // Which edge the card is resting on ("about-me+" = bottom of About),
            // and since when. Browsers may scroll the card before the wheel
            // handler runs, so a card that only just hit its edge must not
            // count as already resting there.
            edgeKey = null,
            edgeSince = 0;

        if (!container) {
            return;
        }

        function edgeOf(section) {
            if (section.scrollTop + section.clientHeight >= section.scrollHeight - 2) {
                return section.getAttribute('data-id') + '+';
            }
            if (section.scrollTop <= 0) {
                return section.getAttribute('data-id') + '-';
            }
            return null;
        }

        // 'scroll' doesn't bubble, so listen in the capture phase
        container.addEventListener('scroll', function (e) {
            var key;
            if (!$(e.target).hasClass('animated-section')) {
                return;
            }
            lastScroll = Date.now();
            key = edgeOf(e.target);
            if (key !== edgeKey) {
                edgeKey = key;
                edgeSince = lastScroll;
            }
        }, true);

        container.addEventListener('wheel', function (e) {
            var now = Date.now(),
                section = $('.animated-section.section-active')[0],
                delta = e.deltaY,
                forward = delta > 0,
                key, $target;

            if (!section || isAnimating || e.ctrlKey || now < blockedUntil ||
                Math.abs(e.deltaX) > Math.abs(delta) || delta === 0) {
                return;
            }

            // Lines/pages to pixels (Firefox reports mouse wheels in lines)
            if (e.deltaMode === 1) { delta *= 40; }
            else if (e.deltaMode === 2) { delta *= section.clientHeight; }

            key = section.getAttribute('data-id') + (forward ? '+' : '-');

            // Not at the edge we're scrolling towards: just a normal scroll
            if (forward ? section.scrollTop + section.clientHeight < section.scrollHeight - 2 :
                          section.scrollTop > 0) {
                push = 0;
                lastWheel = now;
                return;
            }

            // Just reached this edge: start the clock. A card too short to
            // scroll (Home) can't have just arrived, so it counts straight away.
            if (edgeKey !== key) {
                edgeKey = key;
                edgeSince = section.scrollHeight > section.clientHeight + 2 ? now : 0;
            }

            if (now - edgeSince < SETTLE_MS || now - lastScroll < SETTLE_MS) {
                push = 0;
                lastWheel = now;
                return;
            }

            if (now - lastWheel > GESTURE_GAP_MS) {
                push = 0;
            }
            lastWheel = now;
            push += Math.abs(delta);

            if (push < PUSH_NEEDED) {
                return;
            }
            push = 0;

            // Same order as the arrows, wrapping round at either end
            $target = forward ?
                $('.main-menu a.active').parent('li').next('li').children('a') :
                $('.main-menu a.active').parent('li').prev('li').children('a');
            if (!$target.length) {
                $target = $('.main-menu li:' + (forward ? 'first' : 'last') + '-child').children('a');
            }

            if ($target.length) {
                blockedUntil = now + COOLDOWN_MS;
                arrowDirection = forward ? 'forward' : 'back';
                $target.click();
                arrowDirection = null;
            }
        }, { passive: true });
    }

    function getActiveSection() {
        if(location.hash === "") {
            return location.hash = $('section.animated-section').first().attr('data-id');
        } 
        else {
            return location.hash;
        }
    }

    function activeMenuItem(item) {
        if ( !item ) {
            return false;
        }

        var navLink = $(item);
        navLink = navLink['0'];
        navLink = $(navLink);
            
        if(navLink) {
            $('ul.main-menu a').removeClass('active');
            navLink.addClass('active');
        }
    }

    function ajaxLoader() {
        // Check for hash value in URL
        var ajaxLoadedContent = $('#page-ajax-loaded');

        function showContent() {
            ajaxLoadedContent.removeClass('animated-section-moveToRight closed');
            ajaxLoadedContent.show();
            $('body').addClass('ajax-page-visible');
        }

        function hideContent() {
            $('#page-ajax-loaded').addClass('animated-section-moveToRight closed');
            $('body').removeClass('ajax-page-visible');
            setTimeout(function(){
                $('#page-ajax-loaded.closed').html('');
                ajaxLoadedContent.hide();
            }, 500);
        }

        var href = $('.ajax-page-load').each(function(){
            href = $(this).attr('href');
            if(location.hash == location.hash.split('/')[0] + '/' + href.substr(0,href.length-5)){
                var toLoad =  $(this).attr('href');
                showContent();
                ajaxLoadedContent.load(toLoad);
                return false;
            }
        });

        $(document)
            .on("click",".main-menu, #ajax-page-close-button", function (e) { // Hide Ajax Loaded Page on Navigation cleck and Close button
                e.preventDefault();
                hideContent();
                location.hash = location.hash.split('/')[0];
            })
            .on("click",".ajax-page-load", function () { // Show Ajax Loaded Page
                // Browsers block loading project pages when index.html is opened
                // straight from disk (file://); they work on GitHub Pages or a local server
                if (location.protocol === 'file:') {
                    alert('Project pages can\'t load when index.html is opened directly from your computer.\n\nOpen the site through GitHub Pages or a local server (e.g. VS Code "Live Server") instead.');
                    return false;
                }
                var hash = location.hash.split('/')[0] + '/' + $(this).attr('href').substr(0,$(this).attr('href').length-5);
                location.hash = hash;
                showContent();

                return false;
            });
    }

    function Animate($pageTrigger, gotoPage) {

        // Checking for 'data-animation' attribute.
        if (!($pageTrigger.attr('data-animation'))) {
            $pageTrigger.data('animation', defaultAnimation);
        }

        var animation = $pageTrigger.data('animation').toString(),
            gotoPage, inClass, outClass, selectedAnimNumber;

         // Check if the delimiter '-' is present then create an animation array list.
        if(animation.indexOf('-') != -1) {
            var randomAnimList = animation.split('-');
            selectedAnimNumber = parseInt(randomAnimList[(Math.floor(Math.random() * randomAnimList.length))]);
        }
        else {
            selectedAnimNumber = parseInt(animation);
        }

        // Checking if the animation number is out of bound, max allowed value is 1 to 69.
        if (selectedAnimNumber > 69) {
            alert("Transition.js : Invalid 'data-animation' attribute configuration. Animation number should not be greater than 69");
            return false;
        }

        switch(selectedAnimNumber) {
            case 1:
                inClass = 'animated-section-moveFromRight';
                outClass = 'animated-section-moveToLeft';
                break;
            case 2:
                inClass = 'animated-section-moveFromLeft';
                outClass = 'animated-section-moveToRight';
                break;
            case 3:
                inClass = 'animated-section-moveFromBottom';
                outClass = 'animated-section-moveToTop';
                break;
            case 4:
                inClass = 'animated-section-moveFromTop';
                outClass = 'animated-section-moveToBottom';
                break;
            case 5:
                inClass = 'animated-section-moveFromRight animated-section-ontop';
                outClass = 'animated-section-fade';
                break;
            case 6:
                inClass = 'animated-section-moveFromLeft animated-section-ontop';
                outClass = 'animated-section-fade';
                break;
            case 7:
                inClass = 'animated-section-moveFromBottom animated-section-ontop';
                outClass = 'animated-section-fade';
                break;
            case 8:
                inClass = 'animated-section-moveFromTop animated-section-ontop';
                outClass = 'animated-section-fade';
                break;
            case 9:
                inClass = 'animated-section-moveFromRightFade';
                outClass = 'animated-section-moveToLeftFade';
                break;
            case 10:
                inClass = 'animated-section-moveFromLeftFade';
                outClass = 'animated-section-moveToRightFade';
                break;
            case 11:
                inClass = 'animated-section-moveFromBottomFade';
                outClass = 'animated-section-moveToTopFade';
                break;
            case 12:
                inClass = 'animated-section-moveFromTopFade';
                outClass = 'animated-section-moveToBottomFade';
                break;
            case 13:
                inClass = 'animated-section-moveFromRight';
                outClass = 'animated-section-moveToLeftEasing animated-section-ontop';
                break;
            case 14:
                inClass = 'animated-section-moveFromLeft';
                outClass = 'animated-section-moveToRightEasing animated-section-ontop';
                break;
            case 15:
                inClass = 'animated-section-moveFromBottom';
                outClass = 'animated-section-moveToTopEasing animated-section-ontop';
                break;
            case 16:
                inClass = 'animated-section-moveFromTop';
                outClass = 'animated-section-moveToBottomEasing animated-section-ontop';
                break;
            case 17:
                inClass = 'animated-section-moveFromRight animated-section-ontop';
                outClass = 'animated-section-scaleDown';
                break;
            case 18:
                inClass = 'animated-section-moveFromLeft animated-section-ontop';
                outClass = 'animated-section-scaleDown';
                break;
            case 19:
                inClass = 'animated-section-moveFromBottom animated-section-ontop';
                outClass = 'animated-section-scaleDown';
                break;
            case 20:
                inClass = 'animated-section-moveFromTop animated-section-ontop';
                outClass = 'animated-section-scaleDown';
                break;
            case 21:
                inClass = 'animated-section-scaleUpDown animated-section-delay300';
                outClass = 'animated-section-scaleDown';
                break;
            case 22:
                inClass = 'animated-section-scaleUp animated-section-delay300';
                outClass = 'animated-section-scaleDownUp';
                break;
            case 23:
                inClass = 'animated-section-scaleUp';
                outClass = 'animated-section-moveToLeft animated-section-ontop';
                break;
            case 24:
                inClass = 'animated-section-scaleUp';
                outClass = 'animated-section-moveToRight animated-section-ontop';
                break;
            case 25:
                inClass = 'animated-section-scaleUp';
                outClass = 'animated-section-moveToTop animated-section-ontop';
                break;
            case 26:
                inClass = 'animated-section-scaleUp';
                outClass = 'animated-section-moveToBottom animated-section-ontop';
                break;
            case 27:
                inClass = 'animated-section-scaleUpCenter animated-section-delay400';
                outClass = 'animated-section-scaleDownCenter';
                break;
            case 28:
                inClass = 'animated-section-moveFromRight animated-section-delay200 animated-section-ontop';
                outClass = 'animated-section-rotateRightSideFirst';
                break;
            case 29:
                inClass = 'animated-section-moveFromLeft animated-section-delay200 animated-section-ontop';
                outClass = 'animated-section-rotateLeftSideFirst';
                break;
            case 30:
                inClass = 'animated-section-moveFromTop animated-section-delay200 animated-section-ontop';
                outClass = 'animated-section-rotateTopSideFirst';
                break;
            case 31:
                inClass = 'animated-section-moveFromBottom animated-section-delay200 animated-section-ontop';
                outClass = 'animated-section-rotateBottomSideFirst';
                break;
            case 32:
                inClass = 'animated-section-flipInLeft animated-section-delay500';
                outClass = 'animated-section-flipOutRight';
                break;
            case 33:
                inClass = 'animated-section-flipInRight animated-section-delay500';
                outClass = 'animated-section-flipOutLeft';
                break;
            case 34:
                inClass = 'animated-section-flipInBottom animated-section-delay500';
                outClass = 'animated-section-flipOutTop';
                break;
            case 35:
                inClass = 'animated-section-flipInTop animated-section-delay500';
                outClass = 'animated-section-flipOutBottom';
                break;
            case 36:
                inClass = 'animated-section-scaleUp';
                outClass = 'animated-section-rotateFall animated-section-ontop';
                break;
            case 37:
                inClass = 'animated-section-rotateInNewspaper animated-section-delay500';
                outClass = 'animated-section-rotateOutNewspaper';
                break;
            case 38:
                inClass = 'animated-section-moveFromRight';
                outClass = 'animated-section-rotatePushLeft';
                break;
            case 39:
                inClass = 'animated-section-moveFromLeft';
                outClass = 'animated-section-rotatePushRight';
                break;
            case 40:
                inClass = 'animated-section-moveFromBottom';
                outClass = 'animated-section-rotatePushTop';
                break;
            case 41:
                inClass = 'animated-section-moveFromTop';
                outClass = 'animated-section-rotatePushBottom';
                break;
            case 42:
                inClass = 'animated-section-rotatePullRight animated-section-delay180';
                outClass = 'animated-section-rotatePushLeft';
                break;
            case 43:
                inClass = 'animated-section-rotatePullLeft animated-section-delay180';
                outClass = 'animated-section-rotatePushRight';
                break;
            case 44:
                inClass = 'animated-section-rotatePullBottom animated-section-delay180';
                outClass = 'animated-section-rotatePushTop';
                break;
            case 45:
                inClass = 'animated-section-rotatePullTop animated-section-delay180';
                outClass = 'animated-section-rotatePushBottom';
                break;
            case 46:
                inClass = 'animated-section-moveFromRightFade';
                outClass = 'animated-section-rotateFoldLeft';
                break;
            case 47:
                inClass = 'animated-section-moveFromLeftFade';
                outClass = 'animated-section-rotateFoldRight';
                break;
            case 48:
                inClass = 'animated-section-moveFromBottomFade';
                outClass = 'animated-section-rotateFoldTop';
                break;
            case 49:
                inClass = 'animated-section-moveFromTopFade';
                outClass = 'animated-section-rotateFoldBottom';
                break;
            case 50:
                inClass = 'animated-section-rotateUnfoldLeft';
                outClass = 'animated-section-moveToRightFade';
                break;
            case 51:
                inClass = 'animated-section-rotateUnfoldRight';
                outClass = 'animated-section-moveToLeftFade';
                break;
            case 52:
                inClass = 'animated-section-rotateUnfoldTop';
                outClass = 'animated-section-moveToBottomFade';
                break;
            case 53:
                inClass = 'animated-section-rotateUnfoldBottom';
                outClass = 'animated-section-moveToTopFade';
                break;
            case 54:
                inClass = 'animated-section-rotateRoomLeftIn';
                outClass = 'animated-section-rotateRoomLeftOut animated-section-ontop';
                break;
            case 55:
                inClass = 'animated-section-rotateRoomRightIn';
                outClass = 'animated-section-rotateRoomRightOut animated-section-ontop';
                break;
            case 56:
                inClass = 'animated-section-rotateRoomTopIn';
                outClass = 'animated-section-rotateRoomTopOut animated-section-ontop';
                break;
            case 57:
                inClass = 'animated-section-rotateRoomBottomIn';
                outClass = 'animated-section-rotateRoomBottomOut animated-section-ontop';
                break;
            case 58:
                inClass = 'animated-section-rotateCubeLeftIn';
                outClass = 'animated-section-rotateCubeLeftOut animated-section-ontop';
                break;
            case 59:
                inClass = 'animated-section-rotateCubeRightIn';
                outClass = 'animated-section-rotateCubeRightOut animated-section-ontop';
                break;
            case 60:
                inClass = 'animated-section-rotateCubeTopIn';
                outClass = 'animated-section-rotateCubeTopOut animated-section-ontop';
                break;
            case 61:
                inClass = 'animated-section-rotateCubeBottomIn';
                outClass = 'animated-section-rotateCubeBottomOut animated-section-ontop';
                break;
            case 62:
                inClass = 'animated-section-rotateCarouselLeftIn';
                outClass = 'animated-section-rotateCarouselLeftOut animated-section-ontop';
                break;
            case 63:
                inClass = 'animated-section-rotateCarouselRightIn';
                outClass = 'animated-section-rotateCarouselRightOut animated-section-ontop';
                break;
            case 64:
                inClass = 'animated-section-rotateCarouselTopIn';
                outClass = 'animated-section-rotateCarouselTopOut animated-section-ontop';
                break;
            case 65:
                inClass = 'animated-section-rotateCarouselBottomIn';
                outClass = 'animated-section-rotateCarouselBottomOut animated-section-ontop';
                break;
            case 66:
                inClass = 'animated-section-rotateSidesIn animated-section-delay200';
                outClass = 'animated-section-rotateSidesOut';
                break;
            case 67:
                inClass = 'animated-section-rotateSlideIn';
                outClass = 'animated-section-rotateSlideOut';
                break;
            case 68:
                // Page flip (custom). The page is hinged on its top edge, like a notepad.
                // Forward: the current page flips up and back, revealing the next one beneath.
                // Back: the previous page flips down from behind, on top of the current one.
                if (isGoingBack($pageTrigger)) {
                    inClass = 'animated-section-pageTurnIn';
                    outClass = 'animated-section-pageUnderOut';
                } else {
                    inClass = 'animated-section-pageUnderIn';
                    outClass = 'animated-section-pageTurnOut';
                }
                break;
            case 69:
                // Card stack (custom). The card underneath never moves.
                // Forward: the current card lifts up and fades away, revealing the next one beneath.
                // Back: the current card stays put and the previous one drops back in on top.
                if (isGoingBack($pageTrigger)) {
                    inClass = 'animated-section-stackDropIn';
                    outClass = 'animated-section-stackHold';
                } else {
                    inClass = 'animated-section-stackHold';
                    outClass = 'animated-section-stackLiftOut';
                }
                break;
        }

        // This will get the nav-anim elements parent wrapper div
        var $pageWrapper = sectionsContainer,
            currentPageId = $pageWrapper.data('current'), tempPageIndex,
            linkhref = $pageTrigger.attr('href').split("#"),
            gotoPage = linkhref[1];
            
            tempPageIndex = currentPageId;

            // Current page to be removed.
            var $currentPage = $('section[data-id="' + currentPageId + '"]');

            // NEXT PAGE
            currentPageId = gotoPage;

            // Check if the current page is same as the next page then do not do the animation
            // else reset the 'isAnimatiing' flag
            if (tempPageIndex != currentPageId) {
                isAnimating = true;

                $pageWrapper.data('current', currentPageId);

                // Next page to be animated.

                var $nextPage = $('section[data-id='+currentPageId+']').addClass('section-active');

                $nextPage.scrollTop(0);

                // Only the section's own animation counts (not ones inside it, e.g. the rotating subtitle)
                $currentPage.addClass(outClass).on(animEndEventName, function(e) {
                    if (e.target !== this) { return; }
                    $currentPage.off(animEndEventName);
                    endCurrentPage = true;
                    if(endNextPage) {
                        onEndAnimation($pageWrapper, $nextPage, $currentPage);
                        endCurrentPage = false;
                    }
                });

                $nextPage.addClass(inClass).on(animEndEventName, function(e) {
                    if (e.target !== this) { return; }
                    $nextPage.off(animEndEventName);
                    endNextPage = true;
                    if(endCurrentPage) {
                        onEndAnimation($pageWrapper, $nextPage, $currentPage);
                        endNextPage = false;
                        isAnimating = false;
                    }
                });

            }
            else {
                isAnimating = false;
            }


        // Check if the animation is supported by browser and reset the pages.
        if(!support) {
            onEndAnimation($currentPage, $nextPage);
        }

    }

    // True when moving back: the arrow pressed decides, otherwise the target
    // section coming before the current one in the page order
    function isGoingBack($pageTrigger) {
        if (arrowDirection) {
            return arrowDirection === 'back';
        }

        var ids = $('.animated-section').map(function () {
                return $(this).attr('data-id');
            }).get(),
            currentIndex = ids.indexOf(sectionsContainer.data('current')),
            targetIndex = ids.indexOf($pageTrigger.attr('href').split('#')[1]);

        return currentIndex !== -1 && targetIndex < currentIndex;
    }

    function onEndAnimation($pageWrapper, $nextPage, $currentPage) {
        resetPage($nextPage, $currentPage);
    }

    function resetPage($nextPage, $currentPage) {
        $currentPage.attr('class', $currentPage.data('originalClassList'));
        $nextPage.attr('class', $nextPage.data('originalClassList') + ' section-active');
    }

    return {
        init : init,
    };

})(jQuery);

/*
* Template Name: BreezyCV - Resume / CV / vCard / Portfolio Template
* Author: LMPixels
* Author URL: http://themeforest.net/user/lmpixels
* Version: 1.7.0
*/

(function($) {
"use strict";
    // Portfolio subpage filters
    // "All" shows the overview rows (one scrollable row per category, built from
    // the grid items). Any other filter shows the full grid filtered to that category.
    function portfolio_init() {
        var portfolio_grid = $('.portfolio-full-grid'),
            portfolio_filter = $('.portfolio-filters'),
            portfolio_overview = $('.portfolio-overview');

        if (!portfolio_grid.length) {
            return;
        }

        portfolio_build_rows(portfolio_grid, portfolio_overview);

        function showView($view) {
            $view.removeClass('is-hidden portfolio-view-enter');
            $view[0].offsetWidth; // restart the fade-in animation
            $view.addClass('portfolio-view-enter');
        }

        function showGroup(group) {
            $('.portfolio-filters .filter').parent().removeClass('active');
            $('.portfolio-filters .filter[data-group="' + group + '"]').parent().addClass('active');

            if (group === 'category_all' && portfolio_overview.length) {
                portfolio_grid.addClass('is-hidden');
                showView(portfolio_overview);
            } else {
                portfolio_overview.addClass('is-hidden');

                // Show only this category's items; the grid then fades in
                // (.portfolio-view-enter in css/main.css)
                portfolio_grid.children('figure').each(function () {
                    var inGroup = $.inArray(group, $(this).data('groups') || []) !== -1;
                    $(this).toggleClass('is-hidden', !inGroup);
                });
                showView(portfolio_grid);
            }

            $('.animated-section').perfectScrollbar('update');
        }

        portfolio_filter.on("click", ".filter", function (e) {
            e.preventDefault();
            showGroup($(this).attr('data-group'));
        });

        // "Show more" links and the arrow at the end of each row
        portfolio_overview.on("click", ".portfolio-show-more, .portfolio-row-more-btn", function (e) {
            e.preventDefault();
            showGroup($(this).attr('data-group'));
            $(this).closest('.animated-section').animate({ scrollTop: 0 }, 300);
        });

        showGroup('category_all');
    }

    // Fills each overview row with copies of the first few grid items in its category
    function portfolio_build_rows(portfolio_grid, portfolio_overview) {
        var limit = parseInt(portfolio_overview.attr('data-preview-limit'), 10) || 4;

        portfolio_overview.find('.portfolio-row').each(function () {
            var $row = $(this),
                group = $row.attr('data-group'),
                title = $row.find('.block-title h3').text(),
                $track = $row.find('.portfolio-row-track').empty(),
                $items = portfolio_grid.children('figure').filter(function () {
                    return $.inArray(group, $(this).data('groups') || []) !== -1;
                });

            if (!$items.length) {
                $row.addClass('is-hidden');
                return;
            }

            $items.slice(0, limit).clone().appendTo($track);

            $track.append(
                '<div class="portfolio-row-more">' +
                    '<a class="portfolio-row-more-btn" data-group="' + group + '" title="View all ' + title + '">' +
                        '<span class="lnr lnr-arrow-right"></span>' +
                    '</a>' +
                    '<span class="portfolio-row-more-label">View all</span>' +
                '</div>'
            );
        });
    }
    // /Portfolio subpage filters

    // Blog sorting and tag filters
    // The sort button flips between newest and oldest first in one click
    // (dates are read from each card's post-date, "21 Sep 2026").
    // "Filters" opens a panel of tag checkboxes built from each card's
    // data-tags ("art, rendering, ..."). Posts matching ANY chosen tag are
    // shown, and the chosen tags appear as removable chips beside the button.
    // index.html?tag=rendering#blog (the tag links in the posts) opens the Blog
    // tab already filtered; several tags can be comma-separated (?tag=art,color),
    // and ?sort=oldest sorts oldest first.
    function blog_init() {
        var $filter = $('.blog-filter'),
            $grid = $('.blog-grid'),
            $items = $grid.children('.item'),
            $toggle = $filter.find('.blog-filter-toggle'),
            $sortBtn = $filter.find('.blog-sort-toggle'),
            $options = $filter.find('.blog-filter-options'),
            $chips = $filter.find('.blog-filter-chips'),
            $count = $filter.find('.blog-filter-count'),
            months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
            tags = [],
            active = [],
            sort = 'newest';

        if (!$grid.length || !$filter.length) {
            return;
        }

        function itemTags($item) {
            return $.map(($item.attr('data-tags') || '').split(','), function (tag) {
                tag = $.trim(tag).toLowerCase();
                return tag ? tag : null;
            });
        }

        // "21 Sep 2026" -> a number that sorts by date
        function itemDate($item) {
            var parts = $.trim($item.find('.post-date').text()).split(/\s+/),
                month = $.inArray((parts[1] || '').slice(0, 3).toLowerCase(), months);
            return month === -1 ? 0 : new Date(+parts[2], month, +parts[0]).getTime();
        }

        // Collect every tag used on the cards, A-Z, and each card's date
        $items.each(function () {
            $(this).data('blog-date', itemDate($(this)));
            $.each(itemTags($(this)), function (i, tag) {
                if ($.inArray(tag, tags) === -1) {
                    tags.push(tag);
                }
            });
        });
        tags.sort();

        $.each(tags, function (i, tag) {
            $('<label class="blog-filter-option"><input type="checkbox"><span class="blog-filter-check"></span><span class="blog-filter-label"></span></label>')
                .appendTo($options)
                .find('input').val(tag).end()
                .find('.blog-filter-label').text(tag);
        });

        function setPanel(open) {
            $filter.toggleClass('is-open', open);
            $toggle.attr('aria-expanded', open ? 'true' : 'false');

            // Match the panel to what's applied whenever it opens
            if (open) {
                $options.find('input').each(function () {
                    this.checked = $.inArray(this.value, active) !== -1;
                });
            }

            setTimeout(function () {
                $('.animated-section').perfectScrollbar('update');
            }, 350);
        }

        function apply(selected, newSort, updateUrl) {
            active = $.grep(selected, function (tag) {
                return $.inArray(tag, tags) !== -1;
            });
            sort = newSort === 'oldest' ? 'oldest' : 'newest';

            $items.each(function () {
                var $item = $(this),
                    show = !active.length || $.grep(itemTags($item), function (tag) {
                        return $.inArray(tag, active) !== -1;
                    }).length > 0;
                $item.toggleClass('is-hidden', !show);
            });

            // Order the cards by date (with CSS order, so the order in the HTML doesn't matter)
            $items.sort(function (a, b) {
                var diff = $(a).data('blog-date') - $(b).data('blog-date');
                return sort === 'oldest' ? diff : -diff;
            }).each(function (i) {
                this.style.order = i;
            });

            // Sort button shows the current order; clicking flips it
            $sortBtn.toggleClass('is-oldest', sort === 'oldest')
                .attr('title', sort === 'oldest' ? 'Show newest posts first' : 'Show oldest posts first')
                .find('.blog-sort-label').text(sort === 'oldest' ? 'Oldest first' : 'Newest first');

            // Filter button count and tag chips
            $count.text(active.length ? ' (' + active.length + ')' : '');
            $toggle.toggleClass('has-active', active.length > 0);
            $chips.empty();
            $.each(active, function (i, tag) {
                $('<button type="button" class="blog-filter-chip"><span></span><span class="lnr lnr-cross"></span></button>')
                    .attr({ 'data-tag': tag, title: 'Remove ' + tag })
                    .appendTo($chips)
                    .find('span').first().text(tag);
            });
            if (active.length > 1) {
                $chips.append('<button type="button" class="blog-filter-chip-clear">Clear all</button>');
            }

            // Same fade as the portfolio tabs
            $grid.removeClass('portfolio-view-enter');
            $grid[0].offsetWidth;
            $grid.addClass('portfolio-view-enter');

            $('.animated-section').perfectScrollbar('update');

            // Keep the address in sync so a filtered view can be shared
            if (updateUrl && window.history && history.replaceState) {
                var params = [];
                if (active.length) {
                    params.push('tag=' + $.map(active, encodeURIComponent).join(','));
                }
                if (sort === 'oldest') {
                    params.push('sort=oldest');
                }
                try {
                    history.replaceState(null, '', location.pathname +
                        (params.length ? '?' + params.join('&') : '') + location.hash);
                } catch (e) {}
                remember_page();
            }
        }

        function checkedTags() {
            return $options.find('input:checked').map(function () {
                return this.value;
            }).get();
        }

        $toggle.on('click', function () {
            setPanel(!$filter.hasClass('is-open'));
        });

        $filter.on('click', '.blog-filter-close', function () {
            setPanel(false);
        });

        $sortBtn.on('click', function () {
            apply(active, sort === 'oldest' ? 'newest' : 'oldest', true);
        });

        $filter.on('click', '.blog-filter-apply', function () {
            apply(checkedTags(), sort, true);
            setPanel(false);
        });

        // Clear unticks every tag and shows all posts straight away (keeps the sort order)
        $filter.on('click', '.blog-filter-clear, .blog-filter-chip-clear', function () {
            $options.find('input').prop('checked', false);
            apply([], sort, true);
        });

        $filter.on('click', '.blog-filter-chip', function () {
            var tag = $(this).attr('data-tag');
            apply($.grep(active, function (t) { return t !== tag; }), sort, true);
            $options.find('input').filter(function () { return this.value === tag; }).prop('checked', false);
        });

        var tagMatch = /[?&]tag=([^&#]*)/.exec(location.search),
            sortMatch = /[?&]sort=([^&#]*)/.exec(location.search);
        apply(tagMatch ? $.map(decodeURIComponent(tagMatch[1].replace(/\+/g, ' ')).split(','), function (tag) {
            tag = $.trim(tag).toLowerCase();
            return tag ? tag : null;
        }) : [], sortMatch ? sortMatch[1] : 'newest', false);
    }
    // /Blog tag filters

    // Expanding content card (desktop only, see "13. Expanding Card" in main.css)
    // Past the Home card, the content card slides over most of the sidebar.
    // Hovering the sidebar's visible strip brings it back while the pointer is
    // there, and the pin button keeps it open for good (remembered per browser).
    function sidebar_init() {
        var $pageContent = $('.page-content'),
            $header = $('#site_header'),
            $pin = $('.sidebar-pin'),
            PIN_KEY = 'breezycv-sidebar-pinned',
            peekTimer;

        if (!$header.length) {
            return;
        }

        function isPinned() {
            try {
                return localStorage.getItem(PIN_KEY) === '1';
            } catch (e) {
                return false;
            }
        }

        function update() {
            var section = location.hash.split('/')[0],
                pastHome = $('.single-page-area').length > 0 || (section !== '' && section !== '#home'),
                pinned = isPinned();

            $pageContent.toggleClass('is-past-home', pastHome)
                .toggleClass('is-expanded', pastHome && !pinned);
            $pin.toggleClass('is-pinned', pinned)
                .attr('aria-pressed', pinned ? 'true' : 'false')
                .attr('title', pinned ? 'Let the content card cover the sidebar' : 'Keep the sidebar open');
        }

        function setPeek(peek) {
            clearTimeout(peekTimer);
            // A short delay stops it flickering when the pointer just brushes past
            peekTimer = setTimeout(function () {
                $pageContent.toggleClass('is-peeking', peek);
            }, peek ? 60 : 200);
        }

        // Hovering the sidebar (not the section menu on the far right, which sits inside it)
        $header.on('mousemove', function (e) {
            setPeek(!$(e.target).closest('.main-menu').length);
        }).on('mouseleave', function () {
            setPeek(false);
        }).on('focusin', function (e) {
            // Keyboard users tabbing into the sidebar (not the section menu)
            if (!$(e.target).closest('.main-menu').length) {
                setPeek(true);
            }
        }).on('focusout', function () {
            setPeek(false);
        });

        $pin.on('click', function () {
            try {
                localStorage.setItem(PIN_KEY, isPinned() ? '0' : '1');
            } catch (e) {}
            update();
        });

        // Re-measure the section scrollbars once the card has finished resizing
        $('.content-area').on('transitionend', function (e) {
            if (e.originalEvent && e.originalEvent.propertyName === 'max-width') {
                $('.animated-section, .single-page-content').perfectScrollbar('update');
            }
        });

        $(window).on('hashchange', update);
        update();
    }

    // Art galleries in blog posts (see "15. Art Gallery" in main.css)
    // Write each piece as <figure><img ...><figcaption>...</figcaption></figure>
    // (or a <video> for animations) inside <div class="art-gallery">; this turns
    // it into a slider with arrows, a counter and the caption underneath.
    // Images in galleries and in .post-image figures open full size on click.
    function art_gallery_init() {
        // Click-to-enlarge (the site's lightbox)
        $('.art-gallery figure img, .post-image img').each(function () {
            var $img = $(this);
            if (!$img.parent('a').length) {
                $img.wrap($('<a class="lightbox"></a>').attr({
                    href: $img.attr('src'),
                    title: $.trim($img.closest('figure').find('figcaption').text())
                }));
            }
        });

        $('.art-gallery').each(function () {
            var $gallery = $(this),
                $slides = $gallery.children('figure').addClass('art-gallery-slide'),
                $track = $('<div class="art-gallery-track"></div>').append($slides),
                $frame = $('<div class="art-gallery-frame"></div>').append($track).appendTo($gallery),
                $caption = $('<span class="art-gallery-caption"></span>'),
                $count = $('<span class="art-gallery-count"></span>'),
                current = -1;

            $('<div class="art-gallery-info"></div>').append($caption, $count).appendTo($gallery);

            if ($slides.length > 1) {
                $frame.append(
                    '<button type="button" class="art-gallery-nav art-gallery-prev" aria-label="Previous piece"><span class="lnr lnr-chevron-left"></span></button>' +
                    '<button type="button" class="art-gallery-nav art-gallery-next" aria-label="Next piece"><span class="lnr lnr-chevron-right"></span></button>'
                );
            } else {
                $gallery.addClass('is-single');
            }

            function show(index) {
                if (index === current) {
                    return;
                }
                current = index;
                var $slide = $slides.eq(index);

                $caption.text($.trim($slide.find('figcaption').text()));
                $count.text($slides.length > 1 ? (index + 1) + ' / ' + $slides.length : '');
                $gallery.find('.art-gallery-prev').prop('disabled', index === 0);
                $gallery.find('.art-gallery-next').prop('disabled', index === $slides.length - 1);

                // Animations play (muted, looping) only while their slide is showing
                $slides.find('video').each(function () {
                    if ($(this).closest('figure').is($slide)) {
                        var playing = this.play();
                        if (playing && playing.catch) {
                            playing.catch(function () {});
                        }
                    } else {
                        this.pause();
                    }
                });
            }

            function go(index) {
                index = Math.max(0, Math.min($slides.length - 1, index));
                $track[0].scrollTo({ left: index * $track[0].clientWidth, behavior: 'smooth' });
            }

            $gallery.on('click', '.art-gallery-prev', function () { go(current - 1); });
            $gallery.on('click', '.art-gallery-next', function () { go(current + 1); });

            // Swiping / scrolling the track also updates the caption and counter
            $track.on('scroll', function () {
                show(Math.round(this.scrollLeft / Math.max(1, this.clientWidth)));
            });

            show(0);
        });
    }

    // Remembers the Blog tab as you last left it (tag filters / sort order) so a
    // blog post's Back button returns to that same list
    var BLOG_LIST_KEY = 'breezycv-blog-list';

    function remember_page() {
        // Only the Blog tab of the main page counts
        if (location.hash.split('/')[0] === '#blog' && $('.blog-grid').length) {
            try {
                sessionStorage.setItem(BLOG_LIST_KEY, location.href);
            } catch (e) {}
        }
    }

    function page_history_init() {
        remember_page();
        $(window).on('hashchange', remember_page);

        // Blog post "Back" button: the Blog tab (as you left it, if you came from it)
        $('.post-back').on('click', function (e) {
            var list = null;
            try {
                list = sessionStorage.getItem(BLOG_LIST_KEY);
            } catch (err) {}
            if (list) {
                e.preventDefault();
                location.href = list;
            }
        });
    }


    // Hide Mobile menu
    function mobileMenuHide() {
        var windowWidth = $(window).width(),
            siteHeader = $('#site_header');

        if (windowWidth < 1025) {
            siteHeader.addClass('mobile-menu-hide');
            $('.menu-toggle').removeClass('open');
            setTimeout(function(){
                siteHeader.addClass('animate');
            }, 500);
        } else {
            siteHeader.removeClass('animate');
        }
    }
    // /Hide Mobile menu

    // Sections scroll natively (styled in main.css). Perfect Scrollbar is no
    // longer started: its rail sat inside each section and, in Firefox-based
    // browsers, let the card scroll past the end of its content. Its 'update'
    // calls elsewhere do nothing without an instance.

    // Contact form validator
    $(function () {

        $('#contact_form').validator();

        $('#contact_form').on('submit', function (e) {
            if (!e.isDefaultPrevented()) {
                var url = "contact_form/contact_form.php";

                $.ajax({
                    type: "POST",
                    url: url,
                    data: $(this).serialize(),
                    success: function (data)
                    {
                        var messageAlert = 'alert-' + data.type;
                        var messageText = data.message;

                        var alertBox = '<div class="alert ' + messageAlert + ' alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + messageText + '</div>';
                        if (messageAlert && messageText) {
                            $('#contact_form').find('.messages').html(alertBox);
                            $('#contact_form')[0].reset();
                        }
                    }
                });
                return false;
            }
        });
    });
    // /Contact form validator

    //On Window load & Resize
    $(window)
        .on('load', function() { //Load
            // Animation on Page Loading
            $(".preloader").fadeOut( 800, "linear" );

            // initializing page transition.
            var ptPage = $('.animated-sections');
            if (ptPage[0]) {
                PageTransitions.init({
                    menu: 'ul.main-menu',
                    // Section change animation (1 - 69, listed in js/animating.js).
                    // 69 = card stack (custom), 68 = notepad-style page flip, 27 = card shrinks away and the next grows in.
                    animation: 69,
                });
            }
        })
        .on('resize', function() { //Resize
             mobileMenuHide();
             $('.animated-section').each(function() {
                $(this).perfectScrollbar('update');
            });
        });


    // On Document Load
    $(document).ready(function () {
        var movementStrength = 23;
        var height = movementStrength / $(document).height();
        var width = movementStrength / $(document).width();
        $("body").on('mousemove', function(e){
            var pageX = e.pageX - ($(document).width() / 2),
                pageY = e.pageY - ($(document).height() / 2),
                newvalueX = width * pageX * -1,
                newvalueY = height * pageY * -1,
                elements = $('.lm-animated-bg');

            elements.addClass('transition');
            elements.css({
                "background-position": "calc( 50% + " + newvalueX + "px ) calc( 50% + " + newvalueY + "px )",
            });

            setTimeout(function() {
                elements.removeClass('transition');
            }, 300);
        })

        // Mobile menu
        $('.menu-toggle').on("click", function () {
            $('#site_header').addClass('animate');
            $('#site_header').toggleClass('mobile-menu-hide');
            $('.menu-toggle').toggleClass('open');
        });

        // Mobile menu hide on main menu item click
        $('.main-menu').on("click", "a", function (e) {
            mobileMenuHide();
        });

        // Sidebar toggle
        $('.sidebar-toggle').on("click", function () {
            $('#blog-sidebar').toggleClass('open');
        });

        // Initialize Portfolio grid
        var $portfolio_container = $(".portfolio-full-grid");
        $portfolio_container.imagesLoaded(function () {
            portfolio_init(this);
        });

        // Expanding content card, and the page memory behind the blog's Back button
        sidebar_init();
        page_history_init();

        // Blog post art galleries and click-to-enlarge images
        art_gallery_init();

        // Blog tag filters
        blog_init();

        // Blog grid init (the tag-filtered .blog-grid is a plain CSS grid instead)
        var $container = $(".blog-masonry").not(".blog-grid");
        $container.imagesLoaded(function(){
            $container.masonry();
        });

        // Skill bars: size each bar from the percentage written in its skill-value
        $('.skills-info .skill-container').each(function () {
            var value = parseFloat($(this).prev('.skill').find('.skill-value').text());

            if (!isNaN(value)) {
                $(this).find('.skill-percentage').css('width', Math.max(0, Math.min(100, value)) + '%');
            }
        });

        // Text rotation
        // All items share one centred spot (CSS grid), so the text stays centred
        // whatever the card width, even while the card is resizing.
        $('.text-rotation').each(function () {
            var $items = $(this).children('.item'),
                current = 0;

            $items.eq(0).addClass('is-active');
            if ($items.length < 2) {
                return;
            }

            setInterval(function () {
                var $leaving = $items.eq(current);
                current = (current + 1) % $items.length;

                $leaving.removeClass('is-active').addClass('is-leaving');
                $items.eq(current).addClass('is-active');

                setTimeout(function () {
                    $leaving.removeClass('is-leaving');
                }, 700);
            }, 1900);
        });

        // Testimonials Slider
        $(".testimonials.owl-carousel").owlCarousel({
            nav: true, // Show next/prev buttons.
            items: 3, // The number of items you want to see on the screen.
            loop: false, // Infinity loop. Duplicate last and first items to get loop illusion.
            navText: false,
            autoHeight: true,
            margin: 25,
            responsive : {
                // breakpoint from 0 up
                0 : {
                    items: 1,
                },
                // breakpoint from 480 up
                480 : {
                    items: 1,
                },
                // breakpoint from 768 up
                768 : {
                    items: 2,
                },
                1200 : {
                    items: 2,
                }
            }
        });

        // Clients Slider
        $(".clients.owl-carousel").imagesLoaded().owlCarousel({
            nav: true, // Show next/prev buttons.
            items: 2, // The number of items you want to see on the screen.
            loop: false, // Infinity loop. Duplicate last and first items to get loop illusion.
            navText: false,
            margin: 10,
            autoHeight: true,
            responsive : {
                // breakpoint from 0 up
                0 : {
                    items: 2,
                },
                // breakpoint from 768 up
                768 : {
                    items: 4,
                },
                1200 : {
                    items: 5,
                }
            }
        });


        //Form Controls
        $('.form-control')
            .val('')
            .on("focusin", function(){
                $(this).parent('.form-group').addClass('form-group-focus');
            })
            .on("focusout", function(){
                if($(this).val().length === 0) {
                    $(this).parent('.form-group').removeClass('form-group-focus');
                }
            });

        // Lightbox init
        $('body').magnificPopup({
            // :visible so hidden portfolio items (e.g. the grid while the "All"
            // rows are shown) aren't added to the lightbox gallery twice
            delegate: 'a.lightbox:visible',
            type: 'image',
            removalDelay: 300,

            // Class that is added to popup wrapper and background
            // make it unique to apply your CSS animations just to this exact popup
            mainClass: 'mfp-fade',
            image: {
                // options for image content type
                titleSrc: 'title',
                gallery: {
                    enabled: true
                },
            },

            iframe: {
                markup: '<div class="mfp-iframe-scaler">'+
                        '<div class="mfp-close"></div>'+
                        '<iframe class="mfp-iframe" frameborder="0" allowfullscreen></iframe>'+
                        '<div class="mfp-title mfp-bottom-iframe-title"></div>'+
                      '</div>', // HTML markup of popup, `mfp-close` will be replaced by the close button

                patterns: {
                    youtube: {
                      index: 'youtube.com/', // String that detects type of video (in this case YouTube). Simply via url.indexOf(index).

                      id: null, // String that splits URL in a two parts, second part should be %id%
                      // Or null - full URL will be returned
                      // Or a function that should return %id%, for example:
                      // id: function(url) { return 'parsed id'; }

                      src: '%id%?autoplay=1' // URL that will be set as a source for iframe.
                    },
                    vimeo: {
                      index: 'vimeo.com/',
                      id: '/',
                      src: '//player.vimeo.com/video/%id%?autoplay=1'
                    },
                    gmaps: {
                      index: '//maps.google.',
                      src: '%id%&output=embed'
                    }
                },

                srcAction: 'iframe_src', // Templating object key. First part defines CSS selector, second attribute. "iframe_src" means: find "iframe" and set attribute "src".
            },

            callbacks: {
                markupParse: function(template, values, item) {
                 values.title = item.el.attr('title');
                }
            },
        });

        //Google Maps
        if ($(".lmpixels-map")[0]){
            var address = 'San Francisco, S601 Townsend Street, California, USA', //Replace with Your Address
                address = encodeURIComponent(address),
                src = 'https://maps.google.com/maps?q=' + address + '&amp;t=m&amp;z=16&amp;output=embed&amp;iwloc=near&output=embed';
            $(".lmpixels-map iframe").attr("src", src);
        }

        $('.messages').on('click', '.close', function(){
            $(this).parent().remove();
        });
    });

})(jQuery);

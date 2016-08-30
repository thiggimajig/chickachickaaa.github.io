(function () {
"use strict";
/* Author:
    Gavyn McKenzie
    Initialising plugins from plugins.js
*/

 /**
  * Resize Images function
  *
  * Loops through all images with a resize class fires off
  * an Ajax call to determine which file to display depending
  * on the browser width
  */

 var col1 = "31em";
 var col2 = "40em";
 var col3 = "62.66em";
 var col4 = "78.32em";
 var col5 = "93.98em";

// image dpi
var imageDpiMultiplier = (function() {
    if (window.devicePixelRatio !== undefined) {
        return window.devicePixelRatio;
    }
    return 1;
})();

var resize = {
    selector: ".resize",
    images: [],
    widths: [],
    heights: [],
    init: function(){
        resize.images, resize.widths, resize.heights = [];
        resize.gather();
    },
    gather: function() {
        $(resize.selector).each(function(key, image){
            image = $(image);
            var width = Math.round(image.width() * imageDpiMultiplier),
                height = Math.round(image.height() * imageDpiMultiplier);

                resize.images.push(image.attr("rel"));
                resize.widths.push(width);
                resize.heights.push(height);

        });
        resize.grabFromServer();
    },
    grabFromServer: function(){
        var data = "";

        for (var i=0;i<resize.images.length;i++) {
            data += "image[]="+resize.images[i]+"&width[]="+resize.widths[i]+"&height[]="+resize.heights[i];
            if(i<resize.images.length-1) {
                data += "&";
            }
        }

        $.ajax({
            type: "POST",
            url: "/resize.php",
            data: data,
            success: function(data) {
                // So we now have image.og_src to identify the original image to replace
                // And image.src for the new image src
                $.each(data, function(key, image){

                    var el = $("img[rel='"+image.og_src+"']");
                    //console.log(el);
                    el.attr("src",image.src);

                    el.load(function(){
                        el = $(this);

                        // Work ou tthe parent container
                        if (el.closest('.image').length) {
                            var parent = el.closest('.image');
                        } else {
                            var parent = el.parent();
                        }

                        // Set as loaded
                        parent.addClass('img_loaded');
                        // Fade it in
                        if (el.css("opacity") === "0") {
                            el.stop(true,false).animate({opacity: 1},500);
                        }
                    });
                });

            }
        });
    }

}


/*
    Variables
        - Grid container
        - grid unit selector
        - num cols
    Start top left
    grid unit width/height = container/numcols
    make array of grid units set (none at this point)
    for each grid unit
        get data-rowspan and data-colspan
            for each row
                if there is space available for this unit
                    position unit
                    set units taken in array
                    go to next unit
*/

var grid = {
    container: null,
    containerSelector: ".grid-wrap",
    unit: null,
    unitSelector: ".block-wrap",
    unitSpan: 0,
    numCols: null,
    shuffleOn: false,
    popped: false,
    setArray: [],
    setup: function() {
        if ($(grid.containerSelector).length) {
            // If shuffle, shuffle
            if ($(".shuffle.grid-wrap").length) {
                grid.shuffleOn = true;
            }

            grid.init(true);

            if ($("[data-filter]").length) {
                grid.filter();
            }
            // On resize, reset the grid
            $(window).smartresize(function(){
                grid.shuffleOn = false;
                grid.init();
            });

            $(document).bind("fontresize", function (event, data) {
                grid.shuffleOn = false;
                grid.init();
            });
        } else {
            // Just fire resize
            resize.init();
            $(document).bind("fontresize", function (event, data) {
                resize.init();
            });
            $(window).smartresize(function(){
                resize.init();
            });
        }

    },
    init: function(forceReload) {
        // Set up number of cols
        var numCols = grid.setCols();

        // Only relayout if cols has changed
        if (grid.numCols !== numCols || forceReload) {

            grid.numCols = numCols;

            grid.container = $(grid.containerSelector);

            //Reset selection of elements
            grid.unit = $(grid.unitSelector+":visible");

            //Reset setArray
            grid.setArray = [];

            // Create the first row
            var newRow = [];
            for(var i=0;i<=grid.numCols-1;i++) {
                newRow[i] = 0;
            }
            grid.setArray.push(newRow);

            if (grid.numCols >= 3 && grid.unit.length) {
                // Layout the grid
                grid.layout();
            } else {
                // Otherwise, kill the grid
                grid.destroy();
            }
        }

    },
    destroy: function() {
        grid.unit = $(grid.unitSelector);
        // Reset all CSS back to default as specified in CSS
        grid.setArray = [];
        grid.unit.css({
            position:"",
            top: "",
            left: "",
            width: "",
            height: ""
        });

        grid.container.css({
            position: "",
            height: ""
        });
        grid.unit.find(".block").css({
            position: "",
            top: "",
            left: "",
            right: "",
            bottom: "",
            minHeight: ""
        });
        resize.init();
    },
    shuffle: function(units) {
        // Randomise the elements
        var shuffled = units.not(".ignore-shuffle");
        var nonShuffled = units.filter(".ignore-shuffle");

        shuffled = jQuery.makeArray(shuffled);
        nonShuffled = jQuery.makeArray(nonShuffled);

        for (var i = shuffled.length - 1; i > 0; i--) {

            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;

        }

        // Put non shuffle items back in beginning of array
        shuffled = nonShuffled.concat(shuffled);

        return $(shuffled);
    },
    setCols: function() {
        // If this has matches
        // NOTE: JS using default browser font size eg 16px = 1em so divide by 1.6
        if (matchMedia) {
            if (window.matchMedia("(min-width: "+col5+")").matches) {
                return 5;
            } else if (window.matchMedia("(min-width: "+col4+")").matches) {
                return 4;
            } else if (window.matchMedia("(min-width: "+col3+")").matches) {
                return 3;
            } else if (window.matchMedia("(min-width: "+col2+")").matches) {
                return 2;
            } else {
                return 1;
            }
        } else {
            return 1;
        }
    },
    filter: function() {
        // Check if we need to filter on load
        var url = document.location.href;
        url = url.replace(/^.*\/\/[^\/]+/, '');

        var selector = '#navmenu a[href="'+url+'"]';
        var link = $(selector)[0];

        if (url !== "/" && $(selector).length) {
            grid.filterOn(link);
        }

        // Checking for back button usage
        if (Modernizr.history) {

            window.addEventListener('popstate', function(event) {
                // For initial load in chrome
                if (grid.popped === true) {
                    url = event.state;
                    url = url.replace(/^.*\/\/[^\/]+/, '');
                    selector = '#navmenu a[href="'+url+'"]';
                    link = $(selector)[0];
                    if (url === "/") {
                        grid.filterOff(link);
                    } else {
                        grid.filterOn(link);
                    }
                }
            });

            // Store where we are for later
            history.replaceState(document.location.href, document.title, document.location.href);
        }

        // Hide everything not in this container
        $("[data-filter]").click(function(e){
            e.preventDefault();
            grid.filterOn(this);
            // Add this to the history log
            if (Modernizr.history) {
                var url = $(this).attr("href");
                history.pushState(url, document.title, url);
                grid.popped = true;
            }

        });
        $("[data-canxfilter]").click(function(e){
            e.preventDefault();
            grid.filterOff(this);
            // Add this to the history log
            if (Modernizr.history) {
                var url = $(this).attr("href");
                history.pushState(url, document.title, url);
                grid.popped = true;
            }

        });
    },
    filterOn: function(link) {


        $("[data-filter], [data-canxfilter]").removeClass("current");
        $(link).addClass("current");

        if (window.matchMedia("(min-width: "+col3+")").matches) {

            grid.shuffleOn = false;

            var filter = $(link).attr("data-filter");

            grid.unit.css({display: 'none'});

            $(filter).find(grid.unitSelector).show();

            grid.unit.not($(filter).find(grid.unitSelector)).css({
                position: "",
                top: "0",
                left: "0"
            });

            grid.init(true);

            // And scroll up
            $(window).scrollTo(0, 500, {onAfter: function(){
                // Crazy fix for ipads
                $(window).scrollTop($(window).scrollTop() + 1);
                $(window).scrollTop($(window).scrollTop() - 1);
            }
            });
        } else {
            $(window).scrollTo($(link).attr("href").replace("/", ""), 500, {offset: -$("[role=navigation]").outerHeight(true), onAfter: function(){
                // Crazy fix for ipads
                $(window).scrollTop($(window).scrollTop() + 1);
                $(window).scrollTop($(window).scrollTop() - 1);
            }});
        }


    },
    filterOff: function (link) {
        $("[data-filter]").removeClass("current");
        $(link).addClass("current");

        if (window.matchMedia("(min-width: "+col3+")").matches) {

            grid.shuffleOn = true;

            $(grid.unitSelector).css({display: ""});

            grid.init(true);

            // And scroll up
            $(window).scrollTo(0, 500, {onAfter: function(){
                // Crazy fix for ipads
                $(window).scrollTop($(window).scrollTop() + 1);
                $(window).scrollTop($(window).scrollTop() - 1);
            }
            });

        } else {
            $(window).scrollTo(0, 500, {onAfter: function(){
                // Crazy fix for ipads
                $(window).scrollTop($(window).scrollTop() + 1);
                $(window).scrollTop($(window).scrollTop() - 1);
            }
            });
        }
    },
    layout: function() {
        grid.unitSpan = grid.container.innerWidth()/grid.numCols;
        grid.unit.css("position", "absolute");
        grid.container.css("position", "relative");

        var padding = 10;
        grid.unit.find(".block").css({
            position: "absolute",
            top: padding,
            left: padding,
            right: padding,
            bottom: padding,
            minHeight: 0
        });
        if (grid.shuffleOn) {
            // Randomise the elements
            grid.unit = grid.shuffle(grid.unit);
        }

        var gridUnit = {};

        // Loop through the grid units
        for (var key=0;key<grid.unit.length;key++) {
            gridUnit = $(grid.unit[key])
            var rowSpan = parseInt(gridUnit.attr("data-rowspan"),10);
            var colSpan = parseInt(gridUnit.attr("data-colspan"),10);
            var placed = false;
            var newRow = [];
            var width = grid.unitSpan*colSpan;
            var height = grid.unitSpan*rowSpan;

            gridUnit.css({
                width: width,
                height: height
            });

            // For each grid row
            for(var row=0;row<=grid.setArray.length;row++) {
            //$.each(grid.setArray, function(rowNum, row){
                var freeUnits = 0;
                var takenUnits = 0;
                // Check for free columns
                for (var col=0;col<=grid.setArray[row].length;col++) {
                    // If there's a free space, note it down
                    if (grid.setArray[row][col] === 0) {
                        freeUnits++;
                    } else {
                        freeUnits = 0;
                        takenUnits++;
                    }
                    // If the number of free spaces in this row matches the number needed
                    if (freeUnits === colSpan) {
                        gridUnit.css({
                            top: row*grid.unitSpan,
                            left: (col-(colSpan-1))*grid.unitSpan
                        });
                        // Mark off which units we used
                        for (var i=colSpan+(col-(colSpan-1))-1;i>=(col-(colSpan-1));i--) {
                            grid.setArray[row][i] = 1;
                        }
                        // If this is taller than one row
                        if (rowSpan>1) {
                            // Add new row
                            var newRow = [];
                            for(i=0;i<=grid.numCols-1;i++) {
                                newRow[i] = 0;
                            }
                            grid.setArray.push(newRow);

                            //Add taken units to this row too
                            for (i=colSpan+(col-(colSpan-1))-1;i>=(col-(colSpan-1));i--) {
                                grid.setArray[row+1][i] = 1;
                            }
                        }
                        // We've placed it
                        placed = true;

                        // Break out of this loop
                        break;
                    }
                }
                // If we haven't placed it
                if (!placed) {
                    //If there's no more rows
                    if (!grid.setArray[row+1]) {
                        //Add a new row
                        newRow = [];
                        for(i=0;i<=grid.numCols-1;i++) {
                            newRow[i] = 0;
                        }
                        grid.setArray.push(newRow);
                    }
                } else {
                    // Break out to next unit
                    break;
                }

            }

        }

        //Sort out the images
        resize.init();


        // Finally, set the container height to match the number of rows
        grid.container.height(grid.setArray.length*grid.unitSpan);
    }
};

// Flyout Nav Menu - JR
var menu = {
    container: $('#navmenu'),
    trigger: null,
    init: function() {
        var toMove = "0";
        // Add the trigger to the DOM
        menu.trigger = $('<a id="nav-trigger"><i class="menu-icon icon-menu"></i></a>');

        menu.trigger.insertBefore("#navmenu");

        // On click
        menu.trigger.click(function(e){
            // Big sexy animation to move the nav items up and down. #WIP bit of a hack right now
            var navItems = $("[role=navigation] .subnav li");
            var totalTime = 400;
            var animationTime = 200;

            var offsetTime = (totalTime - animationTime)/navItems.length;

            var reversed = false;
            var link = $(this);

            if (navItems.css("top") !== "0px" && navItems.css("top") !== "auto") {
                navItems = jQuery.makeArray(navItems);
                navItems = navItems.reverse();
                navItems = $(navItems);
                reversed = true;
            }

            // If no subnav, just toggle
            if (!navItems.length) {
                $(this).toggleClass('active');

                menu.container.toggleClass('open');
            } else if (reversed) {
                toMove = '0';
                link.removeClass("active");
                menu.container.removeClass("open");
            } else {
                toMove = -$(".subnav").height();
                link.addClass("active");
                menu.container.addClass("open");
            }

            navItems.each(function(index,element){

                element = $(element);
                var offset = (index+1)*offsetTime;

                element.css({position: 'relative'});

                var t = setTimeout(function(){
                    element.animate({top: toMove},{
                        duration: animationTime,
                        easeing: 'easeInOutQuint'
                    });
                },offset);

            });

        });

        if ($("body").hasClass('open-menu')) {
            var t = setTimeout(function(){
                menu.trigger.click();
            },750);
        }
    }
}

var swipeGallery = {
  container: $(".pep-wrapper"),
  gallery: $(".pep-wrapper ul"),
  unit: $(".pep-wrapper li"),
  init: function() {
    var width = swipeGallery.unit.length*160;
    var parentWidth = swipeGallery.container.parent().width();

    this.unit.css({
      maxWidth: 160
    });

        // special case for last one
        this.unit.last().css({
            maxWidth: 180,
            paddingRight: 20
        });

        // add an extra 20px for the last one
        width = width + 20;

    this.unit.find("img").css({
      width: 140
    });

//    this.container.css({
//      width: width*2-parentWidth+20,
//      left: -(width-parentWidth+20),
//      overflow: 'hidden',
//          'min-height': 160
//    });

        // set this up for browser scrolling
        this.container.css({
            width: parentWidth,
            left: 0,
            overflowX: 'scroll',
            overflowY: 'hidden',
            'min-height': 155,
            position: 'relative',
            '-webkit-overflow-scrolling': 'touch',
            marginBottom: 5
        });

    this.gallery.css({
      width: width,
      position: "absolute"
    });


//    // If pep already exists, just restart it
//    if (!this.gallery.data('plugin_pep')) {
//      this.gallery.pep({
//        axis: 'x',
//        constrainToParent: true
//      });
//    } else {
//      //$.pep.startAll();
//      $.pep.toggleAll(true);
//    }

    this.gallery.css({
//      left: width-parentWidth+20
            left: 0
    });
  },
  destroy: function() {
    // Reset CSS
    this.container.css({
      width: "",
      left: "",
      overflow: "",
          'min-height': ""
    });

    // Reset gallery CSS and un-pep
    this.gallery.css({
      width: "",
      left: "",
      top: "",
      position: ""
    });//.unbind();

    this.unit.css({
      maxWidth: ""
    });

    this.unit.find("img").css({
      width: ""
    });

    // New plugin version needs toggleall instead
    //$['pep'].stopAll();
//    $.pep.toggleAll(false);
  },
  initOrDie: function() {
    if (window.matchMedia("(min-width: "+col2+")").matches) {
      swipeGallery.destroy();
    } else {
        swipeGallery.init();
    }
  },
  responsive: function() {
    if (matchMedia) {
      $(window).smartresize(function(){
        swipeGallery.initOrDie();
      });
      // And once to init
      swipeGallery.initOrDie();
    }
  }
}

var ajaxContact = {

    trigger: $("#nav-contact"),
    navContact: null,
    slideConfig: {
        duration: 500,
        easing: 'easeInOutQuint'
    },

    init: function() {

        this.navContact = $(this.trigger.attr("href"))
            .clone()
            .addClass("nav-contact")
            .attr("id", "new-contact")
            .hide()
            .appendTo("[role=navigation]");

        // Clicking the dropdown trigger
        this.trigger.click( function(e) {

            // Prevent jump to
            e.preventDefault();

            // If open
            if (ajaxContact.navContact.is(":visible")) {

                // Close
                ajaxContact.close();

            // If closed
            } else {

                //Open
                ajaxContact.open();

                // Stop the event bubbnling and driggering close
                e.stopPropagation();

            }

            // Clicking on the contact dropdown itself
            ajaxContact.navContact.click( function(e) {

                // Stop the event bubbnling and driggering close
                e.stopPropagation();

            });

        });

    },

    close: function() {
        if (Modernizr.cssanimations) {
            this.navContact.animateCSS('fadeOutDown', function(){
                $(this).hide();
            });
        } else {
            this.navContact.fadeOut("fast");
        }
    },

    open: function() {
        if (Modernizr.cssanimations) {
            this.navContact.animateCSS('fadeInDown');
        } else {
            this.navContact.fadeIn("fast");
        }
    }
}

var subnav = {
    container: $(".subnav"),
    moveToHead: function() {

        var headSubnav = subnav.container.clone(true,true);

        headSubnav.insertAfter("#navmenu");

        subnav.container.hide();

        //resize_images(headSubnav.find("img.resize"),null,null);

    },
    moveToFoot: function() {
        $("[role=navigation] .subnav").hide();

        subnav.container.show();
    },
    setLocation: function() {
        // If mobile, keep in foot
        if (window.matchMedia("(min-width: "+col3+")").matches) {

            if ($("[role=navigation] .subnav").length) {
                $("[role=navigation] .subnav").show();
                subnav.container.hide();
            } else {
                subnav.moveToHead();
            }
        } else {
            subnav.moveToFoot();
        }
    },
    toggliser: function() {
        $(window).smartresize(function(){
            subnav.setLocation();
        });

        //Init
        subnav.setLocation();
    }
}

/*  Slippery page transition
==============================================================*/

var slipNslide = {
    selector: $(".subnav a"),
    popped: false,
    init: function() {

        // Checking for back button usage
        if (Modernizr.history && slipNslide.selector.length) {

            window.addEventListener('popstate', function(event) {
                // For initial load in chrome
                if (slipNslide.popped === true) {
                    var url = event.state;
                    url = url.replace(/^.*\/\/[^\/]+/, '');
                    var selector = '.subnav a[href="'+url+'"]';
                    var link = $(selector).eq(0);
                    slipNslide.loadContent(link);
                }
            });

            // Store where we are for later
            history.replaceState(document.location.href, document.title, document.location.href);
        }

        slipNslide.selector.click(function(e){
            e.preventDefault();

            var link = $(this);

            slipNslide.loadContent(link);

            // Add this to the history log
            if (Modernizr.history) {
                history.pushState(link.attr("href"), document.title, link.attr("href"));
                slipNslide.popped = true;
            }

        });
        //slipNslide.swipe();
    },
    swipe: function() {
        $(".hero-banner").swipe({
            left: function() {
                if ($(".subnav .current").next().find("a").length) {
                    slipNslide.loadContent($(".subnav .current").next().find('a'));
                }
            },
            right: function() {
                if ($(".subnav .current").prev().find("a").length) {
                    slipNslide.loadContent($(".subnav .current").prev().find('a'));
                }
            },
            threshold: {
                x: 100,
                y: 50
            }
        });
    },
    loadContent: function(link){
        if (!link.parent().is(".current")) {

            var url = link.attr("href"),
                duration = 500,
                easing = 'swing';

            if (!$(".current-content").length) {
                $("[role=main]").wrapInner('<div class="current-content">');
            }

            $("[role=main]").css({height: $("[role=main]").height()});

            var newContent = $('<div class="new-content"></div>');

            newContent.insertAfter(".current-content");

            // Check if we want to swipe left or right
            if (link.parent().nextAll(".current").length) {
                var shiftLeft = $(window).width()/8;
            } else {
                var shiftLeft = -$(window).width()/8;
            }

            // Shift the new content wrapper into loading space
            newContent.css({
                opacity: 0,
                position: "relative",
                top: 0,
                left: -shiftLeft
            });

            // Animate the old content off screen
            $(".current-content").stop(true,false).animate({
                left: shiftLeft,
                opacity: 0
            },{
                duration: duration,
                easing: easing,
                complete: function() {
                    // Get rid of the old content
                    $(this).remove();

                    // Turn off ajax caching because IE will break (server returns not modified)
                    $.ajaxSetup({ cache: false });

                    // Go off and get the new content
                    $.get(url, function(data) {
                        newContent.html(data);

                        //Load images and grid
                        grid.containerSelector = ".new-content .grid-wrap";
                        //grid.destroy();
                        grid.setup();

                        // Sort out the other images
                        // Resize images outside the grid
                        /*var images = $("img.resize").not(".grid-wrap img");
                        images.each(function(key, image){
                            image = $(image);
                            resize_images(image,image.parent().width(),image.parent().height());
                        });*/

                        // Animate new content onto screen
                        newContent.css({top: 0}).stop(true,false).animate({
                            left: 0,
                            opacity: 1
                        },{
                            duration: duration,
                            easeing: easing,
                            complete: function() {
                                document.title = newContent.find("h1").text() + ', ' + newContent.find("h2").text();

                                newContent.removeClass("new-content").addClass("current-content");
                                // Now reset grid container selector
                                grid.containerSelector = ".grid-wrap";
                                $("[role=main]").css({height: ""});
                                //Re-init the swipe
                                slipNslide.swipe();

                                caseGal.init();

                                fillHerUp.init();

                                $(".js-zoom").each(function(){
                                    $(this).zoom({
                                        url: $(this).data("highres")
                                    });
                                });
                            },
                            useTranslate3d: true
                        });

                        $(".subnav li").removeClass("current");
                        link.parent().addClass("current");
                    }).error(function(){
                        window.location.href = url;
                    });
                },
                useTranslate3d: true
            });


        }
    }
}

var loaded = {

    init: function(){

        var $body = $('body');

        setTimeout( function(){

            if (!$body.hasClass('loaded')) {

                $body.addClass('loaded');

            }

        },3000);

        $body.addClass('loaded');
    }

}

var prettyPrintClasses = {
    init: function(){
        $("code").each(function(){
            if ($(this).parent("pre").length) {
                $(this).parent("pre").addClass("prettyprint");
            } else {
                $(this).addClass("prettyprint");
            }
        });

        // Mitigate height issues on hover with scrollbars
        $("pre.prettyprint").hover(function(){
            // Get the original inner height
            var ogHeight = $(this).innerHeight();

            $(this).addClass("js-hover");

            // Get the new height
            var newHeight = $(this).innerHeight();

            // Tags on the scrollbar height for less layout jump
            $(this).css({
                paddingBottom: "+="+(ogHeight-newHeight)+"px"
            });
        },function(){
            $(this).removeClass("js-hover");

            $(this).css({
                padding: ""
            });
        });
    }
}

// Check for horizontal scrollbar
$.fn.hasHozScroll = function() {
    return this.get(0).scrollWidth > this.innerWidth();
}

/* Case study galleries */
var caseGal = {
    tab: ".js-gallery-tab",
    image: ".js-gallery-image",
    init: function(){
        $(caseGal.image).hide();

        caseGal.bind();

        $(caseGal.tab).first().click();
    },
    bind: function(){
        $(caseGal.tab).click(function(e){
            e.preventDefault();
            caseGal.switch(this);
        });
    },
    switch: function(el){

        var $el = $(el);
        $(caseGal.tab).removeClass("active");
        $el.addClass("active");

        $(caseGal.image).hide();

        var href = $el.attr("href");

        $("[data-highres='"+href+"']").show();
    }
}

// Make element fill the height of it's parent
var fillHerUp = {
    tank: ".js-fill-her-up-tank",
    fuel: ".js-fill-her-up-fuel",
    init: function(){
        fillHerUp.please();
        fillHerUp.bind();
    },
    bind: function() {
        $(window).smartresize(function(){
            fillHerUp.please();
        });
    },
    // The actual code
    please: function(){
        $(fillHerUp.fuel).each(function(){

            var $this = $(this);
            var $parent = $this.closest(fillHerUp.tank);

            $this.css({
                height: ""
            });

            if (window.matchMedia && window.matchMedia("(min-width: "+col4+")").matches) {
                var height = $parent.height();

                $this.height(height);
            }
        });
    }
}



$(document).ready(function(){
    //Scale fix on iPhone/iPad when switching between portrait and landscape
    MBP.scaleFix();

    // Resize images outside the grid
    /*var images = $("img.resize").not(".grid-wrap img");
    images.each(function(key, image){
        image = $(image);
        resize_images(image,image.parent().width(),image.parent().height());
    });*/

    // Initiate fastClick for touch devices
    $(window).load(function(){
        new FastClick(document.body);
    });

    grid.setup();

    menu.init();

    swipeGallery.responsive();

    prettyPrintClasses.init();

    caseGal.init();

    fillHerUp.init();

    // Must be before toggliser
    if ($(".subnav").length) {
        slipNslide.init();
    }

    subnav.toggliser();

    // Show/Hide Media captions - JR

    $(document).on('click','.with-hidden-caption', function(){
        if (window.matchMedia("(min-width: "+col2+")").matches || !$(this).parents(".pep-wrapper").length) {
            $(this).toggleClass('show-caption')
            $(this).find('figcaption').slideToggle("fast");
        }
    });

    $(document).on('click', function(){

        if (ajaxContact.navContact.is(":visible")) {

            ajaxContact.close();

        }

    });

    ajaxContact.init();

    $(".js-zoom").each(function(){
        $(this).zoom({
            url: $(this).data("highres")
        });
    });


});

    $(window).load( function() {

        loaded.init();

        //resize.init();

    });


}());




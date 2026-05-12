(function ($) {
  'use strict';

  var spinner = function () {
    setTimeout(function () {
      if ($('#spinner').length > 0) {
        $('#spinner').removeClass('show');
      }
    }, 1);
  };
  spinner();

  if (typeof WOW === 'function') {
    new WOW().init();
  }

  $(window).on('scroll', function () {
    var scrollTop = $(this).scrollTop();

    if (scrollTop > 40) {
      $('.navbar').addClass('sticky-top');
    } else {
      $('.navbar').removeClass('sticky-top');
    }

    if (scrollTop > 100) {
      $('.back-to-top').fadeIn('slow');
    } else {
      $('.back-to-top').fadeOut('slow');
    }
  });

  $(document).on('click', '.back-to-top', function (e) {
    e.preventDefault();
    $('html, body').animate({ scrollTop: 0 }, 800, 'swing');
    return false;
  });

  $(document).ready(function () {
    function toggleNavbarMethod() {
      if ($(window).width() > 992) {
        $('.navbar .dropdown')
          .on('mouseover', function () {
            $('.dropdown-toggle', this).trigger('click');
          })
          .on('mouseout', function () {
            $('.dropdown-toggle', this).trigger('click').blur();
          });
      } else {
        $('.navbar .dropdown').off('mouseover').off('mouseout');
      }
    }
    toggleNavbarMethod();
    $(window).resize(toggleNavbarMethod);
  });

  (function () {
    var $videoSrc;
    $('.btn-play').on('click', function () {
      $videoSrc = $(this).data('src');
    });

    $('#videoModal').on('shown.bs.modal', function () {
      if ($videoSrc) {
        $('#video').attr('src', $videoSrc + '?autoplay=1&amp;modestbranding=1&amp;showinfo=0');
      }
    });

    $('#videoModal').on('hide.bs.modal', function () {
      $('#video').attr('src', $videoSrc || '');
    });
  })();

  if ($.fn.owlCarousel) {
    $('.product-carousel').owlCarousel({
      autoplay: true,
      smartSpeed: 1000,
      margin: 45,
      dots: false,
      loop: true,
      nav: true,
      navText: ['<i class="bi bi-arrow-left"></i>', '<i class="bi bi-arrow-right"></i>'],
      responsive: {
        0: { items: 1 },
        768: { items: 2 },
        992: { items: 3 },
        1200: { items: 4 },
      },
    });

    $('.team-carousel').owlCarousel({
      autoplay: true,
      smartSpeed: 1000,
      margin: 45,
      dots: false,
      loop: true,
      nav: true,
      navText: ['<i class="bi bi-arrow-left"></i>', '<i class="bi bi-arrow-right"></i>'],
      responsive: {
        0: { items: 1 },
        768: { items: 2 },
        992: { items: 3 },
        1200: { items: 4 },
      },
    });

    $('.testimonial-carousel').owlCarousel({
      autoplay: true,
      smartSpeed: 1000,
      items: 1,
      dots: false,
      loop: true,
      nav: true,
      navText: ['<i class="bi bi-arrow-left"></i>', '<i class="bi bi-arrow-right"></i>'],
    });
  }

  if ($.fn.counterUp) {
    $('[data-toggle="counter-up"]').counterUp({
      delay: 10,
      time: 2000,
    });
  }
})(jQuery);

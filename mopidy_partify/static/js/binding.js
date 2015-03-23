// uses watch.js and the following markup
// .binding =>
//    attr(data-bindto-selector) indicates a relative jquery selector to watch
//    attr(data-bindto-css) indicates css property to watch, and bind to
//    
// basically we bind $(attr(data-bindto-selector)).css(attr(data-bindto-css))
// to the html of $(.binding)
$(document).ready(function() {
  $(".binding").each(function() {
    var css = $(this).attr("data-bindto-css");
    var selector = $(this).attr("data-bindto-selector");
    var $bound = $(this);

    $(selector).watch(css, function() {
      $bound.html($(this).css(css));
    });
  });
});
// prevents #fakelink from doing anything
// 
// on document ready, iterates all <a />
// and if their href == #fakelink we
// prevent clicking
$(document).ready(function() {
  $("a").each(function() {
    if ($(this).attr("href") == "#fakelink") {
      $(this).click(function(e) {
        e.preventDefault();
      });
    }
  })
});
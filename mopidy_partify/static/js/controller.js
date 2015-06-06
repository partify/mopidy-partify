var progressBarInterval = null,
    progressBarValue = 0;
    
var maxSearchItems = 8;

var votes;

var voter = new Voter("//:3001/vote");

function likeClicked () {
  var $this = $(this);
  var uri = $this.attr("data-uri");
  voter.upvote(uri, function(err, data) {
    if (err) console.error(err); //TODO do more
    $this.parent().addClass("hidden");        
  });
}

function skipClicked () {
  var $this = $(this);
  var uri = $this.attr("data-uri");
  voter.downvote(uri, function(err, data) {
    if (err) console.error(err); //TODO do more
    $this.parent().addClass("hidden");
  });
}

function queryCurrent() {
  //this is the instance of mopidy
  var instance = this;

  // e is null or https://docs.mopidy.com/en/latest/api/models/#mopidy.models.Track
  instance.playback.getCurrentTrack().done(function(e) {
    if (e == null) return;
    var length = e.length;

    // map in the current playing info
    $(".current.track-name").text(e.name);
    $(".current.like").attr("data-uri", e.uri);
    $(".current.skip").attr("data-uri", e.uri);
    $(".current.artist-name").text(e.artists[0].name);
    $(".current.track-length").text(e.length);
    
    $("#like-skip-lg").removeClass("hidden");
    $("#like-skip-sm").removeClass("hidden");

    // this is nested since we need track-length first
    // e is null or number
    instance.playback.getTimePosition().done(function(e) {
      if (e == null) return;

      newProgressTimeout(length, e);
    });
  });
}

function queryTracklist() {
  //this is the instance of mopidy

  //TODO don't do this every time
  $(".tracklist").find(".item:not(.hidden)").remove();

  // get all the tracks and render them
  mopidy.tracklist.getTlTracks().done(function(tracks) {

    tracks.splice(0, 1);

    for (var i = 0 ; i < tracks.length; i++) {
      // this can throw if the track is pending or invalid, but we want to continue enumerating so
      try{
        var item = $(".tracklist .item.hidden").clone().hide().removeClass("hidden").appendTo(".tracklist");
        item.find(".track-name").text(tracks[i].track.name);
        item.find(".like").attr("data-uri", tracks[i].track.uri).on('click', likeClicked);
        item.find(".skip").attr("data-uri", tracks[i].track.uri).on('click', skipClicked);
        item.find(".artist-name").text(tracks[i].track.artists[0].name);
        item.fadeIn("slow");
      } catch(e) { console.error(e); }
    }
  });
}

function newProgressTimeout(trackLength, startTime) {
  var timeoutLength = 1000; //can be tweaked to match progress anim time so make bar smooth

  if (startTime) progressBarValue = startTime;

  $(".current.progress-bar").css("width", ((progressBarValue/trackLength)*100)+"%");

  //abstracted logic since used more than once
  progressBarInterval = setInterval(function() {
    progressBarValue+=timeoutLength;
    $(".current.progress-bar").css("width", ((progressBarValue/trackLength)*100)+"%");
  }, timeoutLength);
}

function event_trackPlaybackStarted(tl_trackWrapper) {
  //this is the instance of mopidy

  var track = tl_trackWrapper.tl_track.track;
  var trackLength = track.length;

  $(".current.track-name").text(track.name);
  $(".current.like").attr("data-uri", track.uri);
  $(".current.skip").attr("data-uri", track.uri);
  $(".current.artist-name").text(track.artists[0].name);
  
  $("#like-skip-lg").removeClass("hidden");
  $("#like-skip-sm").removeClass("hidden");

  // clear any stale progress interval
  if (progressBarInterval != null) {
    clearInterval(progressBarInterval);
    progressBarValue = 0;
  }

  // init the bar
  $(".current.progress-bar").css("width", ((progressBarValue/trackLength)*100)+"%");

  // set the timeout for updating
  newProgressTimeout(trackLength);
}

function event_trackPlaybackEnded(tl_trackWrapperWithTimePosition) {
  //this is the instance of mopidy

  // clear the old interval if it's set
  if (progressBarInterval != null) {
    clearInterval(progressBarInterval);
  }

  $(".current.progress-bar").css("width", 0+"%");
  progressBarValue = 0;  
}

function event_trackPlaybackPaused(tl_trackWrapperWithTimePosition) {
  //this is the instance of mopidy

  // clear the old interval if it's set
  if (progressBarInterval != null) {
    clearInterval(progressBarInterval);
  }

}

function event_trackPlaybackResumed(tl_trackWrapperWithTimePosition) {
  //this is the instance of mopidy

  var track = tl_trackWrapperWithTimePosition.tl_track.track;
  var trackLength = track.length;

  // init the bar
  $(".current.progress-bar").css("width", ((progressBarValue/trackLength)*100)+"%");

  // set the timeout for updating
  newProgressTimeout(trackLength);

}

function event_tracklistChanged() {
  //this is the instance of mopidy

  // we proxy this event to just call the tracklist querier
  $(".tracklist").find(".item:not(.hidden)").remove();
  queryTracklist.call(this);
}
var typeAheadTimeout = 0;
$(document).ready(function() {

  var mopidy = new Mopidy({
      webSocketUrl: "ws://"+document.location.host+"/mopidy/ws/"
  });
  
  mopidy.on("state:online", function() {
    window.mopidy = mopidy; //4dbg

    // when playback starts
    mopidy.on("event:trackPlaybackStarted", event_trackPlaybackStarted.bind(mopidy));

    // when playback ends, we're stopped
    mopidy.on("event:trackPlaybackEnded", event_trackPlaybackEnded.bind(mopidy));

    // when playback paused
    mopidy.on("event:trackPlaybackPaused", event_trackPlaybackPaused.bind(mopidy));

    // when playback resumed
    mopidy.on("event:trackPlaybackResumed", event_trackPlaybackResumed.bind(mopidy));

    // when tracklist changes, we need to reconfigure tracklist
    mopidy.on("event:tracklistChanged", event_tracklistChanged.bind(mopidy));


    // we're freshly connected, so we should query current info
    // and current tracklist so our ui can be populated
    queryCurrent.call(mopidy);
    queryTracklist.call(mopidy);

    // bind buttons
    $(".current.queue").click(function() {
      showSearch();
    });

    $(".queue-ui .close").click(function() {
      hideSearch();
    });

    $(".queue-ui .queue-search").keydown(function(e) {
      typeAheadTimeout = new Date().getTime()+200;
      var thing = this;
      setTimeout(function() {
        if(new Date().getTime() < typeAheadTimeout) {
        } else {
          search(e, thing);
        }
      }, 200);
      
    });

    $(".like").click(likeClicked);

    $(".skip").click(skipClicked);
  });
});

function search(e, thing) {
  if(e.which==8 && $(thing).val().length<=1) {
    $(".queue-results").find(".item:not(.hidden)").remove();
  }
  
  var char = String.fromCharCode(e.which);
  if(e.which >=65 && e.which <=90) {
    if(!e.shiftKey) {
      char = char.toLowerCase();
    }
  } else {
    char = "";
  }
  var term = $(thing).val();
  if(e.which==8) {
    term = term.substring(0, term.length);
  }
  
  if(term.length==0) {
    return;
  }
  
  if(term=="bored elon") {
    var item = $(".queue-results .item.hidden").clone().hide().removeClass("hidden").appendTo(".queue-results");
    item.css({"background-color":"#ff0000;"});
    item.find(".track-name").text("Select this to enable developer tools");
    item.find(".artist-name").text("punk");
    item.fadeIn("slow");
    item.bind("click", function() {
      
      hideSearch();
      setTimeout(function() {$(".queue-results").find(".item:not(.hidden)").remove();}, 500);
    });
    return;
  }
  
  // term is what to lookup
  $.get("https://api.spotify.com/v1/search?type=track&q="+term).then(function (data) {
    $(".queue-results").find(".item:not(.hidden)").remove();
    
    var items = data.tracks.items;
    for (var i = 0 ; i < items.length; i++) {
      if (i > maxSearchItems) return; // return, cause optimize
      
      var uri = items[i].uri;
      var images = items[i].album.images;
      var name = items[i].name;
      var artistName = items[i].artists[0].name;
      
      var elem = $(".queue-results .item.hidden").clone().hide().removeClass("hidden").appendTo(".queue-results");
      elem.find('.track-name').text(name);
      elem.find('.artist-name').text(artistName);
      
      if (elem.find('div .album-art').length > 0) {
        var art = elem.find('div .album-art');
        
        try{
          $(art).attr("src", images[((images.length == 1) ? 0 : images.length -1)].url);
        } catch (e) {}
        
        //isRepeat(uri, elem); // this is slow so let's just not for now
        elem.fadeIn("slow");
        
        elem.attr("data-uri", uri).bind("click", onSearchItemClick);
      }
    }
  });
}

function isRepeat(uri, item) {
  
  mopidy.tracklist.getTracks().done(function (tracks) {    
    
    var repeat = false;
    
    for(var r = 0; r < tracks.length; r++) {
      if (uri == tracks[r].uri) {
        item.find(".like").toggleClass("hidden");
        item.find(".like").bind("click", function() {
          var uri = $(this).attr("data-uri");
          votes.send(JSON.stringify({vtype:"upvote", uri: uri}));
        });
        repeat = true;
        break;
      }
    }
    
    if (repeat == false) {
      item.attr("data-uri", uri).bind("click", onSearchItemClick);
    }
  });
}

function onSearchItemClick() {
  
  var $btn = $(this);
  $btn.animate({height: 0, opacity: 0});
  $btn.css('margin-bottom', '0px').css('margin-top', '0px').
    css('padding-bottom', '0px').css('padding-top', '0px');
    
  hideSearch();
    
  mopidy.library.lookup($(this).attr("data-uri")).done(function(tracks) {

    // take the first one
    var trk = tracks[0];

    mopidy.tracklist.setConsume(true);
    
    mopidy.tracklist.add([trk]).done(function(t) {
      mopidy.playback.getState().done(function(s) {
        if (s != "playing") {
          mopidy.playback.play(t[0]);
        }
        
        $(".queue-ui .queue-search").val("");
        
        setTimeout(function() {
          $(".queue-results").find(".item:not(.hidden)").remove();
        }, 500);
      });
    });
  });
}

function getAlbumArt(id, container) {
  if (id.indexOf(":") !== -1) {
    id = id.split(":");
    id = id[id.length-1];
  }
  
  // see https://developer.spotify.com/web-api/get-album
  $.get("https://api.spotify.com/v1/albums/"+id).then(function (data) {
    
    // use length-1 hack since last entry is always smallest image (we scale to 48x48 anyway)
    $(container).attr("src", data.images[data.images.length-1].url);
  });
}

function showSearch() {
  $(".jumbotron .playing-ui").slideUp(400);
  $(".jumbotron .queue-ui").hide().removeClass("hidden").slideToggle(400);
  $(".jumbotron").removeClass("flat-bottom");
  $(".queue").animate({opacity:0}).addClass("disabled");
}

function hideSearch() {
  $(".jumbotron .playing-ui").slideDown(400);
  $(".jumbotron .queue-ui").slideToggle(400).show();
  $(".jumbotron").addClass("flat-bottom");
  $(".queue").animate({opacity:1}).removeClass("disabled");
}

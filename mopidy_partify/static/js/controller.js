var progressBarInterval = null,
    progressBarValue = 0;

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
  this.tracklist.getTlTracks().done(function(tracks) {

    tracks.splice(0, 1);

    for (var i = 0 ; i < tracks.length; i++) {
      // this can throw if the track is pending or invalid, but we want to continue enumerating so
      try{
        var item = $(".tracklist .item.hidden").clone().hide().removeClass("hidden").appendTo(".tracklist");
        item.find(".track-name").text(tracks[i].track.name);
        item.find(".like").attr("data-uri", tracks[i].track.uri);
        item.find(".skip").attr("data-uri", tracks[i].track.uri);
        item.find(".artist-name").text(tracks[i].track.artists[0].name);
        item.fadeIn("slow");
      } catch(e){console.error(e);}
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
  queryTracklist.call(this);
}
var typeAheadTimeout = 0;
$(document).ready(function() {

  var mopidy = new Mopidy({
      webSocketUrl: "ws://localhost:6680/mopidy/ws/"
  }),
    votes = new WebSocket("ws://localhost:6680/partify/ws"),
    cbs = [];

  votes.onmessage = function(evt) {
    for (var i = 0 ; i < cbs.length; i++)
      cbs[i](evt);
  };

  votes.onerror = console.error.bind(console);
  cbs.push(console.log.bind(console));

  mopidy.on(console.log.bind(console)); //4dbg

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
      $(".jumbotron .playing-ui").slideUp(400);
      $(".jumbotron .queue-ui").hide().removeClass("hidden").slideToggle(400);
      $(".jumbotron").removeClass("flat-bottom");
      $(".queue").animate({opacity:0}).addClass("disabled");
    });

    $(".queue-ui .close").click(function() {
      $(".jumbotron .playing-ui").slideDown(400);
      $(".jumbotron .queue-ui").slideToggle(400).show();
      $(".jumbotron").addClass("flat-bottom");
      $(".queue").animate({opacity:1}).removeClass("disabled");
    });

    $(".queue-ui .queue-search").keydown(function(e) {
      typeAheadTimeout = new Date().getTime()+300;
      var thing = this;
      setTimeout(function() {
        if(new Date().getTime() < typeAheadTimeout) {
        } else {
          search(e, thing);
        }
      }, 300);
      
    });

    $(".like").click(function() {
      var uri = $(this).attr("data-uri");
      votes.send(JSON.stringify({vtype:"upvote", uri: uri}));
    });

    $(".skip").click(function() {
      var uri = $(this).attr("data-uri");
      votes.send(JSON.stringify({vtype:"downvote", uri: uri}));
    });
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
  var term = $(thing).val();//+char;
  if(e.which==8) {
    term = term.substring(0, term.length);
  }
  
  if(term.length==0) {
    return;
  }
  
  mopidy.library.search({'any': [term]}).done(function(backends) {
    $(".queue-results").find(".item:not(.hidden)").remove();
    //TODO right now, results will almost always stop with backend[0]
    // because of this total thing
    var total = 0;
    // iterate backends
    for (var i = 0 ; i < backends.length; i++) {
      // iterate tracks
      if (backends[i].tracks) {
        for (var j = 0; j < backends[i].tracks.length ; j++) {
          var item = $(".queue-results .item.hidden").clone().hide().removeClass("hidden").appendTo(".queue-results");
          if (j == 0) {
            item.addClass("top-item");
          }
          if (j == 8) {
            item.addClass("bottom-item");
          }
          item.find(".track-name").text(backends[i].tracks[j].name);
          item.find(".artist-name").text(backends[i].tracks[j].artists[0].name);
          item.fadeIn("slow");

          item.attr("data-uri", backends[i].tracks[j].uri).bind("click", function() {
            var $btn = $(this);
            $btn.animate({height: 0, opacity: 0});
            $btn.css('margin-bottom', '0px').css('margin-top', '0px').
              css('padding-bottom', '0px').css('padding-top', '0px');
            mopidy.library.lookup($(this).attr("data-uri")).done(function(tracks) {

              // take the first one
              var trk = tracks[0];
              mopidy.tracklist.add([trk]).done(function() {  
                mopidy.playback.getState().done(function(s) {
                  if (s != "playing") mopidy.playback.play();
                });
              });
            });
          });

          total++;
          if (j > 7 || total > 20) break;
        }
      }

      //TODO: be better at the following

      //iterate artists
      // if (backends[i].artists)
      // for (var j = 0; j < backends[i].artists.length ; j++) {
      //   var item = $(".queue-results .item.hidden").clone().hide().removeClass("hidden").appendTo(".queue-results");
      //   item.find(".track-name").text(backends[i].artists[j].name);
      //   item.fadeIn("slow");

      //   total++;
      //   if (j > 5 || total > 20) break;
      // }
      // //iterate albums
      // if (backends[i].albums)
      // for (var j = 0; j < backends[i].albums.length ; j++) {
      //   var item = $(".queue-results .item.hidden").clone().hide().removeClass("hidden").appendTo(".queue-results");
      //   item.find(".track-name").text(backends[i].albums[j].name);
      //   item.fadeIn("slow");

      //   total++;
      //   if (j > 5 || total > 20) break;
      // }
    }
  });
}

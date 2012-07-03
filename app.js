define([
  'joshlib!utils/onready',
  'js/router'],
function(onReady, router) {

  // Start the router-> parse URL and act accordingly
  /**
  *
  * To summarize the files :
  *   - router kinda acts as the app controller. Depending
  *     on the URL it uses the model and modifies the views.
  *   - views contain the definition of the view "classes".
  *     They are defined using Backbone Views. They are either
  *     visual representation of models or static parts of the apps.
  *   - models contains the definitions of the data objects (posts, categories).
  *     They are defined uting Backbone Models
  *   - dataManager queries the data, reads it and creates
  *     the models using the data. the models then create their own views.
  *   - uiManager handles the view elements that are static : the
  *     containers, the sidebar, the config...
  *
  **/

  
  onReady(function() {

    /**
    *
    * If the user's browser is too old we kindly
    * inform him that lolno. Else, we start the app
    * with backbone's router.
    **/
    
    if($('html').attr('class').indexOf('disabled') > -1) {
      $('body').css({'background': 'transparent url(../img/img-background-sidebar.png) repeat top left'})
      $('body').html('<h1>This application is unavailable for your current browser. <br />Please consider upgrading to a newer version.</h1>');
      return;
    }
    else {
      router.historyStart();
    }

    document.addEventListener("deviceready", function() {
      //cordova.exec(null, null, "SplashScreen", "hide", []);
    }, false);
    
    document.addEventListener('pause', function() {
      //Backbone.history.navigate('/lock', true);
    }, false);

    // probably useless because of pause
    document.addEventListener('resume', function() {
      // Backbone.history.navigate('/lock', true);
    }, false);

  });
});
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
    
    router.historyStart();

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
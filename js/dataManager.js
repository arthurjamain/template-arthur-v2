define(['js/models',
        'joshlib!utils/dollar',
        'joshlib!vendor/underscore'], function(models, $, _) {
  var dataManager = {
    /**
    * This object is supposed to get, store and query
    * the data tree when needed.
    * Right now it only gets it but it can be used to
    * reach a specific post or whichever data-related activity.
    **/
    appTree: null,
    dataFile: null,

    initialize: function() {
      this.appTree = new models.ApplicationTree();
      return this;
    },
    loadDataTree: function(callback) {
      var self = this;
      if(self.dataFile) {
        $.getJSON(self.dataFile, function(data) {
          _.each(data, function(el) {
            self.appTree.addBranch(el);
          });
          callback(self.appTree);
        });
      }
      else {
        if(typeof callback == 'function')
          callback(self.appTree);
      }
    },
    getDataFromPath: function(path) {
      var elementIds = path.split('/'),
          toLoad = this.appTree;
      /**
      *  Get all the ids in the URL and loop on them.
      * Each iteration make us go deeper in the tree (toLoad).
      * The last iteration to erase toLoad is the element
      * that needs to be shown.
      **/
      
      for(var i = 0; i < elementIds.length; i++) {

        /**
        * c or p are passed as url fragments
        * to identify the shown element's type.
        **/
        //var theId = elementIds[i].substr(1);
        toLoad = toLoad.get('children').get(elementIds[i]); 
      }
      return toLoad;
    },
    getAppConfig: function() {
      var configIndex = localStorage.getItem('selectedConfig') - 1;
      var config = localStorage.getItem('config');

      config = JSON.parse(config);
      if(config)
        return config[configIndex].formElements;
      else
        return false;
    }
  };

  return dataManager.initialize();
});
define([
  'joshlib!router',
  'js/dataManager',
  'js/uiManager',
  'js/views',
  'joshlib!utils/onready'],
function(Router, dataManager, uiManager, views, onReady) {
  var router = Router({
    /**
    * Contains the routes and their associated functions.
    * Calls the uiManager to modify the views depending on the route.
    * Calls the dataManager to access the data that are shown
    *
    **/
    routes: {
      '.*'                            : 'defaultRoute',
      '/'                             : 'viewHome',
      '/view'                         : 'viewHome',
      '/view/:sidebar'                : 'viewSidebar',
      '/view/:sidebar/:content'       : 'viewFirstLevel',
      '/view/:sidebar/:content/*path' : 'viewSomething',
      '/update-deal/:id'              : 'viewDeal'
    },
    /**
    *  Constructor
    **/
    initialize: function() {
      var self = this;
      uiManager.initialize(this);
      uiManager.showPart('app');
      /**
      * Start loading the data. Once this is done,
      * _onDataLoaded is called and you can safely use
      * dataManager.appTree in this context.
      * TODO : del onready
      **/
      onReady(function() {
        self._loadData(function(tree) {
          // Register all the datasources as backbone Models
          if (Joshfire.factory) {
            var tabs = Joshfire.factory.getDataSource('main');
            for(var k in tabs.children) {
              tree.addBranch(tabs.children[k]);
            }
          }
        });
      });
    },

    /**
    * Use firstLaunch variable to track if we need to
    * display the startup animation (with tiles/mosaic)
    **/
    firstLaunch: true,
    loadStarted: false,
    loadFinished: false,
    previousContentIndex: 0,
    previousContentLevel: 0,
    previousContentId: 0,

    defaultRoute: function() {
      /**
      * In case of unknown or root route, go to lock screen.
      **/
      this.navigate('/', true);
    },

    lockRoute: function(action) {
      $('#codeform', self.$el).prepend('<input type="password" id="code" name="code">');
      uiManager.showPart('lock');
    },

    viewDeal: function(id) {
      if(uiManager.currentPart != 'config') {
        uiManager.showPart('config');
      }

      uiManager.staticViews.config.showTab(id);
      uiManager.staticViews.config.getFormData();

    },

    /**
    * Home Route -> animation, mozaic
    **/
    viewHome: function() {
      var self = this;
      self._onDataLoaded = function() {

        var data = dataManager.appTree;

        if (self.firstLaunch) {

          self.firstLaunch = false;
          var t = uiManager.setContentView(data, {
            container: 'content',
            id: 'contentRoot',
            listId: 'tableofcontent',
            itemType: 'home'
          });

          uiManager.getContentView('contentRoot').showAnimated();

        } else {

          if($('#contentRoot').hasClass('shown'))
            return;

          $('.theplayer', '.shown').remove();

          uiManager.setHomeLayout(function() {
            //setTimeout(function() {
              uiManager.slideContentPane('contentRoot', {direction: 'right'});
            //}, 2000);
          });
        }
        self.previousContentLevel = 0;

      };

      if (typeof dataManager.appTree !== undefined && dataManager.appTree) {
        // simulate latency
        self._onDataLoaded();
        self._onDataLoaded = null;
      }
    },

    /**
    * Just clicked a main tab
    **/
    viewSidebar: function(sidebarid) {
      var self = this;
      if (this.firstLaunch) {
        // If first launch with a specific path, hijack the route
        // and go to table of content directly
        Backbone.history.navigate('/view', true);
        return;
      }
      
      //Get the right data
      var rootModel = dataManager.getDataFromPath(sidebarid);

      // Put it in onDataLoaded in case data isn't loaded yet.
      rootModel._onDataLoaded = function(col) {
        //Show the app if it's hidden
        uiManager.showPart('app');
        //Clear the sidebar's content and set the new one
        uiManager.clearSidebar();
        uiManager.setSidebarView(rootModel, {
          container: 'sidebar .list',
          id: sidebarid,
          classes: 'sidebarlist',
          itemType: 'sidebar'
        });

        var firstChapter = col.first();
        //Get or create the content view
        var theview = uiManager.setContentView(firstChapter, {
          container: 'content',
          id: firstChapter.get('guid'),
          title: firstChapter.get('name'),
          showDescription: true,
          titleType: 'big',
          scrollable: true
        });
        uiManager.setSelectedSidebarItem(firstChapter.get('guid'));
        //If we previously were on the same level
        // but on a different element
        if(self.previousContentLevel == 2) {
          uiManager.slideContentPane(firstChapter.get('guid'), {direction: 'bottom'});
        }
        else {
          var direction = 'left';
          //we were on another post
          if(self.previousContentLevel > 2)
            direction = 'right';
          //we were 1 post deeper
          if(!theview.$el.hasClass('shown')) {
            uiManager.slideContentPane(firstChapter.get('guid'), {direction: direction}, function() {
              uiManager.setRegularLayout();
            });
          }
        }
        //remember those for navigation purposes
        self.previousContentIndex = 0;
        self.previousContentLevel = 1;
      };
      // If data is already loaded, trigger onDataLoaded.
      if(rootModel.firstLoading) {
        rootModel._onDataLoaded(rootModel.get('children'));
        rootModel._onDataLoaded = null;
      }
    },

    // Changes the content based on which
    // sidebar item was clicked.
    viewFirstLevel: function(sidebarid, contentid) {
      var self = this;
      if (this.firstLaunch) {
        // If first launch with a specific path, hijack the route
        // and go to table of content directly
        Backbone.history.navigate('/view', true);
        return;
      }

      // Put it in onDataLoaded in case data isn't loaded yet.
      self._onDataLoaded = function() {

        // Get the right data
        var rootModel = dataManager.getDataFromPath(sidebarid+'/'+contentid);

        // Get or create view
        var theview = uiManager.setContentView(rootModel, {
          container: 'content',
          id: rootModel.get('guid'),
          title: rootModel.get('name'),
          titleType: 'big',
          showDescription: true,
          scrollable: true
        });

        uiManager.setSelectedSidebarItem(rootModel.get('guid'));

        // Get index of item in collection
        // to determine the direction of the slide
        var curPaneIndex = rootModel.collection.indexOf(rootModel),
            direction = '';
        direction = (curPaneIndex < self.previousContentIndex)?'bottom':'top';

        // If we previously were deeper
        if(self.previousContentLevel > 2) {
          if(!theview.$el.hasClass('shown') && self.previousContentId == contentid)
            uiManager.slideContentPane(rootModel.get('guid'), {direction: 'right'});
          else if(!theview.$el.hasClass('shown') && self.previousContentId != contentid)
            uiManager.slideContentPane(rootModel.get('guid'), {direction: direction});
        }
        // If we land here normally
        else {
          if(!theview.$el.hasClass('shown')) {
            uiManager.slideContentPane(rootModel.get('guid'), {direction: direction});
          }
        }

        self.previousContentIndex = curPaneIndex;
        self.previousContentLevel = 2;
        self.previousContentId = contentid;
      };
      // If data is already loaded, trigger onDataLoaded.
      if (typeof dataManager.appTree !== undefined && dataManager.appTree) {
        self._onDataLoaded();
        self._onDataLoaded = null;
      }
    },

    // All the sublevels from here should look the same...
    viewSomething: function(sidebarid, contentid, path) {
      var self = this;
      if (this.firstLaunch) {
        // If first launch with a specific path, hijack the route
        // and go to table of content directly
        Backbone.history.navigate('/view', true);
        return;
      }

      // Put it in onDataLoaded in case data isn't loaded yet.
      self._onDataLoaded = function(tree) {

        var rootModel = dataManager.getDataFromPath(sidebarid+'/'+contentid+'/'+path);

        // Depending on the depth level we need a different format for the title
        var titletype = 'big';
        if(path.split('/').length > 1)
          titletype = 'small';
        else
          titletype = 'medium';

        uiManager.setContentView(rootModel, {
          container: 'content',
          id: rootModel.get('guid'),
          backButton: true,
          showDescription: true,
          title: rootModel.get('name'),
          titleType: titletype,
          scrollable: true
        });

        var direction = 'left';
        if(self.previousContentLevel > (2 + path.split('/').length))
          direction = 'right';

        uiManager.slideContentPane(rootModel.get('guid'), {direction: direction});

        self.previousContentLevel = 2 + path.split('/').length;
      };
      // If data is already loaded, trigger onDataLoaded.
      if (typeof dataManager.appTree !== undefined && dataManager.appTree) {
        self._onDataLoaded();
        self._onDataLoaded = null;
      }
    },

    _loadData: function(cb) {
      var self = this;
      // Security to avoid multiple queries
      if (!self.loadStarted) {
        self.loadStarted = true;
        // Start the query
        dataManager.loadDataTree(function(tree) {
          self.loadFinished = true;
          if (typeof cb == 'function') {
            cb(tree);
          }

          if (typeof self._onDataLoaded == 'function') {
            self._onDataLoaded(tree);
          }
        });
      }
    },

    _onDataLoaded: null
  });

  return router;
});
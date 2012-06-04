define([
  'joshlib!utils/dollar',
  'joshlib!vendor/underscore',
  'js/views'],
function($, _, views) {
  var uiManager = {
    /**
    * This object is supposed to take care of
    * most of the visual modifications to the app. It is the
    * best place to define trasitions between two states of the app.
    * It contains the views of all the static panels (which are
    * hard coded in HTML). Their IDs are passed as parameters.
    **/

    app: null,
    popup: null,
    router: null,
    staticViews: [],
    contentPanes: {},
    sidebarPane: null,
    currentPart: '',

    initialize: function(router) {
      this.router = router;
      this.staticViews.app = new views.app();
      this.popup = new views.popup();
      window.popup = this.popup;
    },

    // Creates or returns the appropriate content view
    // depending on options.
    setContentView: function(rootModel, opt) {

      if(this.contentPanes[opt.id] && opt.id == 'contentRoot') {
        return this.contentPanes[opt.id];
      }

      if (opt.id == 'contentRoot') { // tableofcontent
        this.contentPanes[opt.id] = new views.tocPane({
          data: rootModel.get('children'),
          paneOptions: opt
        });
        return this.contentPanes[opt.id];
      }
      // If it's a chapter we need a list
      // (it should never happen anymore)
      if(rootModel.get('@type') == 'Chapter') {
        // There is only one children, display it as a full element
        if(rootModel.get('children').length == 1) {
          var thechild = _.first(rootModel.get('children').models);
          // The child is content, display it either way.
          if(thechild.get('@type') == 'BlogPosting') {
            this.contentPanes[opt.id] = new views.mysteryPane({
              data: thechild,
              paneOptions: opt
            });
          }
          else {
            this.contentPanes[opt.id] = new views.mysteryListPane({
              data: rootModel.get('children'),
              paneOptions: opt
            });
          }
        }
        else {
          this.contentPanes[opt.id] = new views.mysteryListPane({
            data: rootModel.get('children'),
            paneOptions: opt
          });
        }
        return this.contentPanes[opt.id];
      }
      // We need a full post
      else {
        this.contentPanes[opt.id] = new views.mysteryPane({
          data: rootModel,
          paneOptions: opt
        });
        return this.contentPanes[opt.id];
      }
      return false;
    },

    getContentView: function(id) {
      return this.contentPanes[id];
    },

    setSidebarView: function(rootModel, opt) {
      
      if(rootModel.get('@type') == 'Chapter') {
        this.sidebarPane = new views.mysteryListPane({
          data: rootModel.get('children'),
          paneOptions: opt
        });

        this.sidebarPane.show();
        this.staticViews.app.sidebar.setTitle({'title': rootModel.get('name'), 'id': rootModel.get('guid')});

        return this.sidebarPane;
      }

      return false;
    },

    clearSidebar: function() {
      $('.list', this.staticViews.app.sidebar.$el).html('');
    },

    setSelectedSidebarItem: function(id) {
      $('#sidebar .selected').removeClass('selected');
      $('#sidebar-'+id).addClass('selected');
    },

    // Sliding animation
    // slides away the shown element and shown the asked one
    slideContentPane: function(id, opt, cb) {
      var self = this;
      var $prevSlide = $('.shown');

      var from = '', to = '';
      if(opt.direction && opt.direction == 'left') {
        from = 'raway';
        to = 'laway';
      }
      else if(opt.direction && opt.direction == 'right') {
        from = 'laway';
        to = 'raway';
      }
      else if(opt.direction && opt.direction == 'bottom') {
        from = 'taway';
        to = 'baway';
      }
      else if(opt.direction && opt.direction == 'top') {
        from = 'baway';
        to = 'taway';
      }
      this.contentPanes[id].$el.attr('class', 'notransition '+from).addClass(from);
      this.contentPanes[id].$el.show();
      
      $prevSlide.attr('class', to+' shown').removeClass('shown');
      self.contentPanes[id].$el.removeClass('notransition').addClass('shown');
      
      //Sadly, no other way to have a "callback" after CSS3 transitions
      setTimeout(function() {
        // Delete the prev slide, except the home
        if($prevSlide.attr('id') != 'contentRoot')
          $prevSlide.remove();

        if(typeof cb != 'undefined')
          cb();

      }, 500);

    },

    /**
    * These functions switch the layout between root content
    * (full width, no sidebar) to regular content (the opposite)
    **/
    setHomeLayout: function(cb) {
      var self = this;
      
      self.staticViews.app.sidebar.$el.removeClass('visible');
      /*self.staticViews.app.sidebar.$el.anim({translate3d: '0, 0, 0'}, 0.5, 'ease-in-out', function() {
        
        
      });*/
      self.staticViews.app.content.$el.removeClass('shrinked');
      //self.staticViews.app.content.$el.anim({translate3d: '0, 0, 0'}, 0.5, 'ease-in-out');
      $('#content').css({width: '100%'});

      setTimeout(function() {
        if(typeof cb != 'undefined')
          cb();
      }, 800);

    },
    setRegularLayout: function() {
      var self = this;

      var thewidth = $(window).width() - self.staticViews.app.sidebar.$el.width();
      $('#content').css({width: thewidth});
      self.staticViews.app.sidebar.$el.addClass('visible');
      /*self.staticViews.app.sidebar.$el.anim({translate3d: '287px, 0, 0'}, 0.5, 'ease-in-out', function() {
        
      });*/
      self.staticViews.app.content.$el.addClass('shrinked');
      /*self.staticViews.app.content.$el.anim({translate3d: '287px, 0, 0'}, 0.5, 'ease-in-out', function() {
        
      });*/
    },

    /**
    * Show one specific part of the app
    **/
    showPart: function(key) {
      for(var k in this.staticViews) {
        if(k == key) {
          this.staticViews[k].show();
          this.currentPart = k;
        }
        else {
          this.staticViews[k].hide();
        }
      }
    }
  };

  return uiManager;
});
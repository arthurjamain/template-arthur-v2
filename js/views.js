define([
  'joshlib!utils/dollar',
  'joshlib!vendor/underscore',
  'joshlib!uielement',
  'joshlib!ui/item',
  'joshlib!view',
  'joshlib!ui/list',
  'joshlib!ui/factorymedia'],
function($, _, UIelement, UIItem, View, List, FactoryMedia) {

  var views = {
    /**
    * This file defines the JS objects that encapsulate the various
    * UI parts.
    * Some of them are static (hard coded in HTML) -> lock, config, app...
    * Others are dynamically generated : post, category, treeRoot
    * The dynamically generated ones have a getHtml or getRootHtml method
    * to get the html code corresponding to the view based on the data
    * it is fed with.
    * getHtml when it's a list elements, getRootHtml when it's the main element
    **/

    /**
    * Main app wrapper : where the content & sidebar are
    **/
    app: View.extend({
      el: '#app',
      $el: $('#app'),
      content: null,
      sidebar: null,
      initialize: function(el) {
        this.sidebar = new views.sidebar();
        this.content = new views.content();
      }
    }),

    // The sidebar and its list
    sidebar: View.extend({
      el: '#sidebar',
      $el: $('#sidebar'),
      events: {
        'touchend .back': 'goBack'
      },
      setTitle: function(opt) {
        var self = this;
        $('header h2', self.$el).html(opt.title);
        //$('header h3', self.$el).html(st);
        $('header .curChapter', self.$el).attr('href', '#/view/'+opt.id);
      },
      goBack: function() {
        // Always home anyway
        document.location.hash = '/view';
        return false;
      }
    }),

    // The content view
    content: View.extend({
      el: '#content',
      $el: $('#content')
    }),

    // A generic elemnt container
    mysteryPane: View.extend({

      el: '<div></div>',
      $el: null,
      child: null,
      backButton: '<button class="back">back</button>',
      mediaTypes : [
        'MusicRecording',
        'VideoObject'
      ],

      events: {
        //'click .back': 'goBack'
      },

      initialize: function(opt) {
        var self = this;
        self.$el = $(self.el);
        self.$el.attr('id', opt.paneOptions.id);
        self.$el.attr('class', opt.paneOptions.classes);
        self.$el.hide();
        $('#'+opt.paneOptions.container).append(self.$el);
        console.log(opt.data);
        if(opt.data.get('@type') == 'VideoObject') {
          self.child = new FactoryMedia({
              model: opt.data,
              width: 736,
              height: 460,
              scroller: true,
              scrollerSelector: '.scroll-wrapper',
              templateEl: '#media-template',
              mediaOptions: {
                strategy: 'html5',
                width: '100%',
                height: '100%',
                adjustSize: true
              },
              el: self.$el[0]
          });
        }
        else if(opt.data.get('@type') == 'MusicRecording') {
          self.child = new FactoryMedia({
              model: opt.data,
              scroller: true,
              scrollerSelector: '.scroll-wrapper',
              templateEl: '#media-template',
              mediaOptions: {
                strategy: 'html5',
                adjustSize: true,
                autoPlay: true
              },
              el: self.$el[0]
          });
        }
        else if(opt.data.get('@type') == 'ImageObject') {
          self.child = new views.mysteryImage({
            model: opt.data,
            opt: opt.paneOptions,
            $parent: self.$el
          });
        }
        else {
          self.child = new views.mysteryBlogPost({
            model: opt.data,
            opt: opt.paneOptions,
            $parent: self.$el
          });
        }
        
        self.child.render();

        if(opt.paneOptions.backButton) {
          self.child.$el.prepend(self.backButton);
          $('.back', self.$el).bind('touchend', self.goBack);
        }
      },

      goBack: function(e) {
        var url = document.location.hash.split('/');
        url.pop();
        url = url.join("/");
        document.location.hash = url;
        return false;
      }

    }),

    mysteryImage: View.extend({

      el: '<div class="mysteryImage"></div>',
      $el: null,
      template: $('#image-template').html(),
      $parent: null,
      theScroller: null,

      initialize: function(opt) {
        var self = this;

        this.$parent = opt.$parent;
        this.$el = $(this.el);
        this.scrollable = opt.opt.scrollable;
      },

      generate: function(cb) {
        var self = this;
        cb(null, _.template(self.template, {item: self.model.toJSON()}));
      },

      setContent: function(html) {
        var self = this;
        var $html = $(html);
        $('img', $html).hide();
        self.$el.append(html);
        self.$parent.append(self.$el);

        /*
        if(self.scrollable) {
          if(!self.theScroller) {
            self.theScroller = new iScroll('scroll-'+self.model.get('guid'), {
              hScroll: false,
              scrollbarClass: 'contentScroll'
            });
          }
          setTimeout(function() {
            self.theScroller.refresh();
          }, 800);
        }
        */
      }

    }),

    // A blogpost element
    mysteryBlogPost: View.extend({
      el: '<div class="blogPost"></div>',
      $el: null,
      template: '<%=title%><div class="blogpaneInnerContainer innerContainer" id="<%=scrollId%>"><article><%=model.get("articleBody")%></article></div>',
      titleTemplate: '<h4><%=title%></h4>',
      subTitleTemplate: '<h5><%=title%></h4>',
      rubricTitleTemplate: '<h6><%=title%></h4>',
      titleEl: null,
      $parent: null,

      scrollable: false,
      theScroller: null,

      initialize: function(opt) {
        var self = this;

        this.$parent = opt.$parent;
        this.$el = $(this.el);
        this.scrollable = opt.opt.scrollable;

        // Fix weird values sent by google ...
        if(this.model.get('articleBody'))
          this.model.set({articleBody: this.model.get('articleBody').replace('src="//', 'src="http://')});

        // Add the title
        if (opt.opt.title) {
          // Trim preceding number
          if(opt.opt.titleType == 'small') {
            self.titleEl = _.template(this.rubricTitleTemplate, {title: opt.opt.title});
          }
          else if(opt.opt.titleType == 'medium') {
            self.titleEl = _.template(this.subTitleTemplate, {title: opt.opt.title});
          }
          else if(opt.opt.titleType == 'big') {
            self.titleEl = _.template(this.titleTemplate, {title: opt.opt.title});
          }
          else {
            self.titleEl = _.template(this.titleTemplate, {title: opt.opt.title});
          }
        }
      },

      generate: function(cb) {
        var self = this;
        cb(null, _.template(self.template, {title: self.titleEl, model: self.model, scrollId: 'scroll-' + self.model.get('guid')}));
      },

      setContent: function(html) {
        var self = this;
        var $html = $(html);
        $('img', $html).hide();
        self.$el.append(html);
        self.$parent.append(self.$el);

        /*
        if(self.scrollable) {
          if(!self.theScroller) {
            self.theScroller = new iScroll('scroll-'+self.model.get('guid'), {
              hScroll: false,
              scrollbarClass: 'contentScroll'
            });
          }
          setTimeout(function() {
            self.theScroller.refresh();
          }, 800);
        }
        */
      },

      replaceContentWithLocalStorage: function(opt) {
        var self = this;
        var config = JSON.parse(localStorage.getItem('config')),
            selectedConfigId = (localStorage.getItem('selectedConfig') - 1);
        var $panel = $('article', self.$el);

        // Clear the content
        $panel.empty();

        if(config) {
          var rightConfig = config.pop();

          if(opt.contentPart == 'Commitment') {
            var $table = $('<table id="configDataTable"></table>');
            var toAppend = '';
            // Delete last element
            rightConfig.formElements.pop();

            _.each(rightConfig.formElements, function(line) {
              var thehtml = '<tr>';
              thehtml += '<td class="key">'+line.key+'</td>';
              thehtml += '<td class="val">'+line.val+'</td>';
              thehtml += '</tr>';

              toAppend += thehtml;
            });
            $table.html(toAppend);
            $panel.append($table);
          }
          else if(opt.contentPart == 'Conditions') {
            $panel.append('<p>'+rightConfig.formElements.pop().val+'</p>');
          }
        } 
      },

      enhance: function() {
        var self = this;

        self._handleFullScreenVideo(self.$el);
        self._handleFullScreenImages(self.$el);

      },

      _handleFullScreenImages: function(container) {
        $('.image', container).bind('tap', function(e) {
          var theimg = $('img', this);
          theimg = theimg[0].cloneNode(true);
          theimg = $(theimg);
          theimg = $('<div>').append(theimg).html();
          window.popup.setImage(theimg);
        });
      },

      _handleFullScreenVideo: function(container) {
        var self = this;
        setTimeout(function() {
          $('.video-link', container).bind('tap', function(e) {
            window.popup.setVideo($('a', this).attr('href'));
            return false;
          });
        }, 0);
      }

    }),

    tocPane: View.extend({
      el: '<div></div>',
      $el: null,
      child: null,
      innerContainer: '<div id="logo">' +
                        '<div class="icon"></div>' +
                        '<div class="spots"></div>' +
                        '<div class="flare"></div>' +
                        '<div class="flareicon"></div>' +
                      '</div>' +
                      '<div id="intropicture"></div>' +
                      '<div id="introtext">' +
                      '</div>' +
                      '<div class="listpaneInnerContainer"></div>',
      listContainer: '<div class="listPane"></div>',

      initialize: function(opt) {
        var self = this;
        self.$el = $(self.el);
        self.$el.attr('id', opt.paneOptions.id);
        self.$el.attr('class', opt.paneOptions.classes);

        // Render the inner container (contains everything except the title.)
        self.innerContainer = $(self.innerContainer);
        //self.innerContainer.attr('id', 'scroll-'+opt.paneOptions.id);

        // Render the list container
        self.listContainer = $(self.listContainer);
        self.innerContainer.last().append(self.listContainer);

        // Fill the panel
        self.$el.append(self.innerContainer);

        // Render the panel
        $('#'+opt.paneOptions.container).append(self.$el);
        self.$el.hide();

        //Generate the data list and its items
        self.child = new views.mysteryList({
          // this selects the kind of view to create as
          // a list item
          itemFactory: function(model, offset) {
            if(opt.paneOptions.itemType == 'sidebar')
              return new views.mysterySidebarItem({model: model});
            if(opt.paneOptions.itemType == 'home')
              return new views.mysteryHomeItem({model: model});

            return new views.mysteryItem({model: model});
          },
          collection: opt.data,
          itemOptions: {
            $parent: self.listContainer,
            listId: opt.paneOptions.listId,
            listClasses: opt.paneOptions.listClasses
          }
        });

        // Render the data list
        self.child.render();
        // Hide the list at first
        $('#'+opt.paneOptions.listId).hide();
        $('.video-corp').hide();

        $('.video-corp a').on('touchend', function(event) {
          event.preventDefault();
          event.stopPropagation();
          window.popup.setVideo('medias/corpo/1m30.mp4');
          return false;
        });
      },

      showAnimated: function() {
        var self = this;
        self.$el.show().addClass('shown').addClass('anim');
        setTimeout(self.videoEnded.bind(self), 1600);
      },

      videoEnded: function(e) {
        var self = this;

        $('#tableofcontent').show();
        self.$el.addClass('anim2');
        $('#introtext').remove();
        setTimeout(function() {
          //self.$el.removeClass('anim').removeClass('anim2');
        }, 2500);
      }
    }),

    // A List container panel
    mysteryListPane: View.extend({
      el: '<div></div>',
      $el: null,
      child: null,
      titleTemplate: '<h4><%=title%></h4>',
      subTitleTemplate: '<h5><%=title%></h5>',
      rubricTitleTemplate: '<h6><%=title%></h6>',
      innerContainer: '<div class="listpaneInnerContainer innerContainer"></div>',
      descriptionTemplate: '<article class="description"><%=description%></article>',
      listContainer: '<div class="listPane"></div>',
      backButton: '<button class="back">back</button>',

      theScroller: null,

      events: {

      },

      initialize: function(opt) {
        var self = this;
        self.$el = $(self.el);
        self.$el.attr('id', opt.paneOptions.id);
        self.$el.attr('class', opt.paneOptions.classes);

        // Render the inner container (contains everything except the title.)
        self.innerContainer = $(self.innerContainer);
        self.innerContainer.attr('id', 'scroll-'+opt.paneOptions.id);

        // Add the title
        if (opt.paneOptions.title) {
          var realname = opt.paneOptions.title;
          if(opt.paneOptions.titleType == 'small') {
            self.$el.append(_.template(this.rubricTitleTemplate, {title: realname}));
          }
          else if(opt.paneOptions.titleType == 'medium') {
            self.$el.append(_.template(this.subTitleTemplate, {title: realname}));
          }
          else if(opt.paneOptions.titleType == 'big') {
            self.innerContainer.addClass('blacklisttitle');
            self.$el.append(_.template(this.titleTemplate, {title: realname}));
          }
          else {
            self.$el.append(_.template(this.titleTemplate, {title: realname}));
          }
        }

        // Generate the pane's description if needed
        var desc;
        if((desc = opt.data.getDescriptionPost()) && opt.paneOptions.showDescription) {
          self.innerContainer.append(_.template(this.descriptionTemplate, {description: desc.get('articleBody')}));
        }

        // Render the list container
        self.listContainer = $(self.listContainer);
        self.innerContainer.append(self.listContainer);

        // Fill the panel
        self.$el.append(self.innerContainer);

        // Render the panel
        $('#'+opt.paneOptions.container).append(self.$el);

        // Set iSCroll if asked
        /*
        if(opt.paneOptions.scrollable) {
          // couldn't use wrap() for some reason
          var elBuffer = self.innerContainer.children();
          self.innerContainer.append('<div class="scrollwrapper"></div>');
          $('.scrollwrapper', self.innerContainer).append(elBuffer);
          self.theScroller = new iScroll('scroll-'+opt.paneOptions.id, {
            hScroll: false,
            scrollbarClass: 'contentScroll'
          });
        }
        */

        self.$el.hide();
        //Generate the data list and its items
        self.child = new views.mysteryList({
          // this selects the kind of view to create as
          // a list item
          itemFactory: function(model, offset) {
            if(opt.paneOptions.itemType == 'sidebar')
              return new views.mysterySidebarItem({model: model});
            if(opt.paneOptions.itemType == 'home')
              return new views.mysteryHomeItem({model: model});

            return new views.mysteryItem({model: model});
          },
          collection: opt.data,
          itemOptions: {
            $parent: self.listContainer,
            listId: opt.paneOptions.listId,
            listClasses: opt.paneOptions.listClasses
          }
        });

        // Render the data list
        self.child.render();

        if(opt.paneOptions.backButton) {
          self.$el.prepend(self.backButton);
          $('.back', self.$el).on('touchend', self.goBack);
        }

        self._handleFullScreenImages(self.$el);
        self._handleFullScreenVideo(self.$el);
        /*
        if(self.theScroller) {
          // refresh scroller in a new "i can't believe it's not a thread" to let the dom refresh
          setTimeout(function() {
            self.theScroller.refresh();
          }, 0);
        }
        */
      },

      goBack: function(e) {
        var url = document.location.hash.split('/');
        url.pop();
        url = url.join("/");
        document.location.hash = url;
        return false;
      },

      _handleFullScreenImages: function(container) {
        $('.image', container).bind('touchend', function(e) {
          var theimg = $('img', this);
          theimg = theimg[0].cloneNode(true);
          theimg = $(theimg);
          theimg = $('<div>').append(theimg).html();
          window.popup.setImage(theimg);
        });
      },

      _handleFullScreenVideo: function(container) {
        var self = this;
        setTimeout(function() {
          $('.video-link').bind('touchend', function(e) {
            window.popup.setVideo($('a', this).attr('href'));
            e.preventDefault();
            return false;
          });
        }, 0);
      }

    }),
    
    mysteryMedia: View.extend({
      
    }),

    // a list representing a collection.
    // It extends a class from the framework.
    mysteryList: List.extend({

      // setContent is called by render(). It sets the content ...
      setContent: function(html) {
        $('ul', this.itemOptions.$parent).remove();
        this.itemOptions.$parent.append(html);
        $('ul', this.itemOptions.$parent).attr('id', this.itemOptions.listId || '');
        $('ul', this.itemOptions.$parent).attr('class', this.itemOptions.listClasses || '');
      },

      enhance: function() {
        var self = this;
        /** Handle clicks on links in JS
        * to avoid delay when clicking a link
        * (iOS style)
        **/
        /*
        $('a', this.itemOptions.$parent).on('touchstart', function(e) {
          self.delay = new Date().getTime();
          self.mousePos = {x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY};
          self.oldtarget = e.target;
        });

        $('a', this.itemOptions.$parent).on('touchend', function(e) {

          if(self.oldtarget != e.target)
            return false;

          if(new Date().getTime() - self.delay < 150)
            document.location = $(this).attr('href');
          return false;
        });
        */
        $('a', this.itemOptions.$parent).each(function(el) {
          var tap = new Tap(this);
          this.addEventListener('tap', function(e) {
            var thelink = e.target;

            while(!thelink.href) {
              thelink = thelink.parentElement;
            }

            document.location = thelink.href;
            e.preventDefault();
            e.stopPropagation();

            return false;
          });
          this.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          })
        });
      }

    }),

    // One list item in content
    mysteryItem: View.extend({
      template: '<li><a class="listitemlink" href="<%=model.get("path")%>"><h3><%=model.get("name")%></h3><% if(desc) {%><p><%=desc.get("description")%></p><%}%></a></li>',

      initialize: function() {
        View.prototype.initialize.call(this);
      },

      generate: function(cb) {
        // If the item is a category description, don't display it in the list.
        if(this.model.get('isChapterIntro')) {
          cb(null, '');
        }
        else {
          // get its description children and show it
          var desc = this.model.get('children').getDescriptionPost();
          cb(null, _.template(this.template, {model: this.model, desc: desc}));
        }
      }
    }),

    // One list item in content
    mysteryHomeItem: View.extend({
      template: '<li><a class="homelistitemlink" href="<%=model.get("path")%>"><h3><%=model.get("name")%></h3></a></li>',

      initialize: function() {
        View.prototype.initialize.call(this);
      },

      generate: function(cb) {
        // get its description children and show it
        var desc = this.model.get('children').getDescriptionPost();
        cb(null, _.template(this.template, {model: this.model, desc: desc}));
      }

    }),

    // One list item in the sidebar
    mysterySidebarItem: View.extend({

      template: '<li style="<%=style%>" id="sidebar-<%=model.get("guid")%>"><a class="sidelistitemlink" class="sidebarlink" href="<%=model.get("path")%>"><span class="count"><p><%=index%></p></span><div class="tablecell"><h3><%=model.get("name")%></h3></div></a></li>',

      initialize: function() {
        View.prototype.initialize.call(this);
      },

      generate: function(cb) {
        var index = this.model.collection.indexOf(this.model) + 1;
        var style = '';

        cb(null, _.template(this.template, {index: index, model: this.model, style: style}));
      },

      setSelected: function(e) {
        $('.selected').removeClass('selected');
        $(this).addClass('selected');
      }

    }),

    popup: View.extend({
      el: '<div id="popup"></div>',
      $el: null,
      template: '<span class="close"></span><div class="content"><%=content%></div>',
      videoTemplate: '<video id="videoplayer" controls="controls" width="<%=width%>" height="<%=height%>" webkit-playsinline><source src="<%=src%>" type="video/mp4" /></video>',


      initialize: function() {
        this.$el = $(this.el);
        this.render();
      },

      setImage: function(image) {
        var self = this;
        this.$el.show().css({"opacity": "0", "display": "block", "background": "#FFF"});
        $('.content', self.$el).html(image);
        this.$el.attr('class', 'playimage');
        setTimeout(function() {
          //var offset = self.$el.width()/2 - $('img', self.$el)[0].width/2;
          //$('img', self.$el).css({'margin-left': offset+'px'});
          self.$el.anim({opacity: 1}, 0.4, 'linear');
        }, 0);
      },

      setVideo: function(url, opt) {
        var self = this;
        var thespec = {width: 974, height: 718};
        thespec = _.extend(thespec, opt);
        this.$el.css({"opacity": "0", "display": "block", "background": "#000"});
        this.$el.attr('class', 'playvideo');

        setTimeout(function() {
          $('.content', self.$el).html(_.template(self.videoTemplate, {src: url, width: thespec.width, height: thespec.height}));
          self.$el.anim({opacity: 1}, 0.4, 'linear');
        }, 0);
      },

      setText: function(text) {
        this.$el.show().css({opacity: 0});
        $('.content', this.$el).html(text);
        this.$el.anim({opacity: 1}, 0.4, 'linear');
      },

      generate: function(cb) {
        cb(null, _.template(this.template, {content: ''}));
      },

      setContent: function(html) {
        if(!$('#popup').length)
          $('#popup').remove();

        this.$el.append(html);
        $('#app').append(this.$el);
      },

      enhance : function() {
        var self = this;
        this.$el.hide();
        $('.close', this.$el).bind('click', function(e) {
          self.$el.anim({opacity: 0}, 0.4, 'linear', function() {
            $('.content', self.$el).empty();
            self.$el.css({"opacity": "1", "display": "none"});
          });
        });
      }
    })

  };

  return views;
});
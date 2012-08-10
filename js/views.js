define([
  'joshlib!utils/dollar',
  'joshlib!vendor/underscore',
  'joshlib!uielement',
  'joshlib!ui/item',
  'joshlib!view',
  'joshlib!ui/list',
  'joshlib!ui/factorymedia',
  'joshlib!utils/cookie'],
function($, _, UIelement, UIItem, View, List, FactoryMedia, Cookie) {

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
      initialize: function(opt) {
        View.prototype.initialize.call(this, opt);
        this.$('.playlistcontrols').bind('click', _.bind(this.setPlaylistMode, this));
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
      },
      setPlaylistControls: function(is) {
        if(is) {
          this.$('.playlistcontrols').show();
        }
        else {
          this.$('.playlistcontrols').hide();
        }
        //Always off when first called
        Cookie('playlist', 0);
        this.$('.playlistcontrols .toggleplaylist').text('Off');
      },
      setPlaylistMode: function(e, manual) {
        var active = Cookie('playlist')?parseInt(Cookie('playlist'), 10):false;
        if(!active) {
          Cookie('playlist', 1);
          this.$('.playlistcontrols .toggleplaylist').text('On');
        }
        else {
          Cookie('playlist', 0);
          this.$('.playlistcontrols .toggleplaylist').text('Off');
        }
        return false;
      },
      setHomeButton:function(is) {
        if(is) {
          this.$('.back').hide();
          this.$('h2').css({left: 0});
        }
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
        
        if(opt.data.get('@type') == 'VideoObject') {
          self.child = new FactoryMedia({
              model: opt.data,
              width: 760,
              height: 460,
              templateEl: '#media-template',
              mediaOptions: {
                strategy: 'html5',
                width: '100%',
                height: '100%',
                adjustSize: true
              },
              el: self.$el[0]
          });
          self.child.render();
        }
        else if(opt.data.get('@type') == 'MusicRecording') {
          self.child = new FactoryMedia({
              model: opt.data,
              templateEl: '#media-template',
              mediaOptions: {
                strategy: 'html5',
                adjustSize: true,
                autoPlay: true
              },
              el: self.$el[0]
          });
          self.child.render();
        }
        else if(opt.data.get('@type') == 'ImageObject') {
          self.child = new views.mysteryImage({
            model: opt.data,
            opt: opt.paneOptions,
            $parent: self.$el
          });
          self.child.renderTitle();
          setTimeout(function() {
            self.child.render();
          }, 900);
        }
        else if(opt.data.get('@type') == 'Article/Status') {
          self.child = new views.mysteryArticle({
            model: opt.data,
            opt: opt.paneOptions,
            $parent: self.$el
          });
          self.child.render();
        }
        else if(opt.data.get('@type') == 'ExternalResource') {
          self.child = new views.mysteryIFrame({
            model: opt.data,
            opt: opt.paneOptions,
            $parent: self.$el
          });
          // Wait transition end
          setTimeout(function() {
            self.child.render();
          }, 1000);
        }
        else {
          self.child = new views.mysteryBlogPost({
            model: opt.data,
            opt: opt.paneOptions,
            $parent: self.$el
          });
          self.child.render();
        }

        if(opt.data.get('@type') == 'VideoObject') {

          var thevideo = $('iframe, object', self.$el).clone();
          $('.maincontent').css({height: thevideo.attr('height')+'px'});
          $('iframe, object', self.$el).remove();
          $('.maincontent', self.$el).append('<div style="height:'+(thevideo.attr('height')?thevideo.attr('height'):500)+'px;" class="loader"></div>');
            
          setTimeout(function() {
            thevideo.attr('width', $('#content').width() - 100);
            $('.maincontent', self.$el).append(thevideo);
            if($('iframe', self.$el).length) {
              $('iframe', self.$el).on('load', function() {
                if(Joshfire.framework.adapter == 'ios') {
                  $('.maincontent .loader', self.$el).anim({opacity: 0}, 0.6, 'linear', function() {
                    $(this).remove();
                    self.setPlaylistConfig(opt);
                  });
                }
                else {
                  $('.maincontent .loader', self.$el).animate({opacity: 0}, 600, function() {
                    $(this).remove();
                    self.setPlaylistConfig(opt);
                  });
                }
              });
            }
            else if($('object', self.$el).length) {
              $('object', self.$el).parent().css({margin: '0 auto'});
              if(Joshfire.framework.adapter == 'ios') {
                $('.maincontent .loader', self.$el).anim({opacity: 0}, 0.6, 'linear', function() {
                  $(this).remove();
                });
              }
              else {
                $('.maincontent .loader', self.$el).animate({opacity: 0}, 600, function() {
                  $(this).remove();
                });
              }
            }
          }, 800);
        }

        if(opt.paneOptions.backButton) {
          self.child.$el.prepend(self.backButton);
          $('.back', self.$el).bind('touchend', self.goBack);
        }
      },

      setPlaylistConfig: function(opt) {
        var self = this;
        /*
        if(opt.data.attributes.config.db === 'dailymotion') {
          var dmdoc = $('iframe', self.$el);
          var dmbody = dmdoc[0].contentDocument.body;
          var active = Cookie('playlist')?parseInt(Cookie('playlist'), 10):false;
          
          $('#startscreen', dmbody).bind('click', function() {
            // Let DM's script do its business
            setTimeout(function() {
              var next = self.options.data.collection.getNextModel(self.options.data);
              $('video', dmbody)[0].addEventListener('ended', function() {
                var active = Cookie('playlist')?parseInt(Cookie('playlist'), 10):false;
                if(active)
                  document.location.hash = next.get('path');
              });
            }, 100);
          });

          if(active) {
            $('#startscreen', dmbody).trigger('click');
          }
        }
        */
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
      template: '#image-template',
      titleTemplate: '<h4><%=title%></h4><div class="loader"></div>',
      $parent: null,
      theScroller: null,

      initialize: function(opt) {
        var self = this;
        this.$parent = opt.$parent;
        self.scrollable = true;
        //this.$el = this.$parent;
        this.template = $('#image-template').html();
        //this.scrollable = opt.opt.scrollable;
      },

      renderTitle: function() {
        var self = this;
        self.$parent.append(_.template(self.titleTemplate, {title: self.model.get('name')}));
      },

      generate: function(cb) {
        var self = this;
        cb(null, _.template(self.template, {item: self.model.toJSON()}));
      },

      setContent: function(html) {
        var self = this;
        var $html = $(html);
        var $theimg = $('<img src="'+self.model.get('contentURL')+'" />');
        self.$parent.append(html);
        
        $('.scrollwrapper', self.$parent).attr('id', 'scroll-'+self.model.get('guid'));
        
        $('.maincontent', self.$parent).append($theimg);
        $('.innerContainer', self.$parent).css({opacity: 0});
        $theimg.on('load', function() {
          $('.loader', self.$parent).remove();
          if(Joshfire.framework.adapter == 'ios')
            $('.innerContainer', self.$parent).anim({opacity: 1}, 0.4, 'ease-in-out');
          else
            $('.innerContainer', self.$parent).animate({opacity: 1}, 400);

          setTimeout(function() {
            if(self.scrollable) {
              if(!self.theScroller && Joshfire.framework.adapter != 'browser' && !Modernizr.overflowscrolling) {
                self.theScroller = new iScroll('scroll-'+self.model.get('guid'), {
                  hScroll: false,
                  scrollbarClass: 'contentScroll'
                });
                
                setTimeout(function() {
                  self.theScroller.refresh();
                }, 200);
              }
            }
          }, 400);
        });
      }

    }),
    
    mysteryArticle: View.extend({
      el: '<div class="articleStatus"></div>',
      $el: null,
      templateEl: '#article-template',
      titleEl: null,
      $parent: null,

      scrollable: false,
      theScroller: null,

      initialize: function(opt) {
        var self = this;

        this.$parent = opt.$parent;
        this.$el = $(this.el);
        this.scrollable = opt.opt.scrollable;
        this.templateEl = $(this.templateEl);

        // Fix weird values sent by google ...
        if(this.model.get('articleBody')) {
          this.model.attributes.articleBody = this.model.get('articleBody').replace('src="//', 'src="http://');
          this.model.attributes.articleBody = this.model.get('articleBody').replace(/href="/gi, 'target="_blank" href="');
        }
      },
      
      generate: function(cb) {
        var self = this;
        cb(null, _.template(self.templateEl.html(), {title: self.titleEl, item: self.model.toJSON(), scrollId: 'scroll-' + self.model.get('guid')}));
      },
      
      setContent: function(html) {
        var self = this;
        var $html = $(html);
        $('img', $html).hide();
        self.$el.append(html);
        self.$parent.append(self.$el);
        setTimeout(function() {
          if(self.scrollable) {
            if(!self.theScroller && Joshfire.framework.adapter != 'browser' && !Modernizr.overflowscrolling) {
              self.theScroller = new iScroll('scroll-'+self.model.get('guid'), {
                hScroll: false,
                scrollbarClass: 'contentScroll'
              });
              
              setTimeout(function() {
                self.theScroller.refresh();
              }, 200);
            }
          }
        }, 800);
        return;
      }
      
    }),

    // A blogpost element
    mysteryBlogPost: View.extend({
      el: '<div class="blogPost"></div>',
      $el: null,
      template: '<%=title%><div class="spinner"></div><div class="blogpaneInnerContainer innerContainer" id="<%=scrollId%>"><article><%=model.get("articleBody")%></article></div>',
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

        this.fixGoogleNews();

        // Add the title
        if (opt.opt.title) {

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
      /**
      * Fixes weird values sent by google's feed.
      **/
      fixGoogleNews: function() {
        if(this.model.get('articleBody')) {
          this.model.attributes.articleBody = this.model.get('articleBody').replace('src="//', 'src="http://');
          this.model.attributes.articleBody = this.model.get('articleBody').replace(/href="/gi, 'target="_blank" href="');
          
          // Fixes HuffPost's encoding
          this.model.attributes.articleBody = this.model.get('articleBody').replace(/&Atilde;&copy;/gi, 'é');
          this.model.attributes.articleBody = this.model.get('articleBody').replace(/&Atilde;&nbsp;/gi, 'à');
          this.model.attributes.articleBody = this.model.get('articleBody').replace(/&Atilde;&sup1;/gi, 'ù');
          this.model.attributes.articleBody = this.model.get('articleBody').replace(/&Atilde;&uml;/gi, 'è');
          this.model.attributes.articleBody = this.model.get('articleBody').replace(/&Acirc;&nbsp;/gi, '');
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
        var spinner = '<div class="spinner"></div>';
        self.$el.append(html);

        var copy = $('.blogpaneInnerContainer', self.$el).clone();
        $('.blogpaneInnerContainer', self.$el).remove();
        self.$parent.append(self.$el);
        
        setTimeout(function() {
          $('.spinner', self.$el).remove();
          self.$el.append(copy);
          $('.blogpaneInnerContainer', self.$el).css({opacity: 0});
          $('.blogpaneInnerContainer', self.$el).animate({opacity: 1}, 400);
          $('a[rel=nofollow]', self.$el).remove();

          if(self.scrollable) {
            if(!self.theScroller && Joshfire.framework.adapter != 'browser' && !Modernizr.overflowscrolling) {
              self.theScroller = new iScroll('scroll-'+self.model.get('guid'), {
                hScroll: false,
                scrollbarClass: 'contentScroll'
              });
              
              setTimeout(function() {
                self.theScroller.refresh();
              }, 200);
            }
          }
        }, 800);
      },
      enhance: function() {
        var self = this;
        $('a[rel="nofollow"]', self.$el).remove();
      }

    }),

    tocPane: View.extend({
      el: '<div></div>',
      $el: null,
      child: null,
      innerContainer: '<div class="listpaneInnerContainer"></div>',
      listContainer: '<div class="listPane"><h1 id="appNameHeader"></h1></div>',

      initialize: function(opt) {
        var self = this;
        self.$el = $(self.el);
        self.$el.attr('id', opt.paneOptions.id);
        self.$el.attr('class', opt.paneOptions.classes);

        // Render the inner container (contains everything except the title.)
        self.innerContainer = $(self.innerContainer);
        
        // Render the list container
        self.listContainer = $(self.listContainer);

        // Fill the panel
        self.innerContainer.append(self.listContainer);
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
            listClasses: opt.paneOptions.listClasses,
            homepage: true
          }
        });

        // Render the data list
        if(Joshfire.framework.adapter != 'desktop')
          self.child.render();
        // Hide the list at first
        $('#'+opt.paneOptions.listId).hide();

        self.setConfig(opt);
      },
      /**
      * Sets the properties given by the factory
      **/
      setConfig: function(opt) {
        if(Joshfire && Joshfire.factory) {
          // Set the background image.
          var bg = Joshfire.factory.config.template.options.backgroundurl;
          if(bg) {
            $('#'+opt.paneOptions.listId).css({
              background: '#F8F6F4 url('+bg+') no-repeat center center',
              backgroundSize: 'cover'
            });
          }

          // Set the corporate logo.
          var logo = Joshfire.factory.config.app.logo;
          if(logo) {
            $('#logo .icon').css({background: 'transparent url('+logo.contentURL+') no-repeat center center'});
            $('#logo .flareicon').css({
              background: 'transparent url('+logo.contentURL+') no-repeat center center'
            });
          }
        }
      },
      /**
      * Used at first launch to trigger
      * the zoomingout & scattering animations.
      **/
      showAnimated: function() {
        var self = this;
        
        self.$el.show().addClass('shown');
        $('#tableofcontent').show();
        self.scatter();
      
      },
      CShowAnimated: function() {
        var self = this;

        self.$el.show().addClass('shown');
        $('#tableofcontent').show();
        self.Cscatter();
      
      },

      scatter: function(e) {
        var self = this;
        $('#logo').remove();
        self.$el.addClass('anim2');
        setTimeout(function(e) {
          $('.anim').removeClass('anim').removeClass('anim2');
          // Sadly, let the DOM refresh
          setTimeout(function() {
            self.$el.addClass('anim3');
            // Set the final, unvariable position
            // of the li's
            setTimeout(function() {
              $('#content').addClass('scattered');
            });
          }, 100);
        }, 600);
      },

      Cscatter: function() {
        var self = this;
        self.$el.removeClass('anim');
        $('#content').addClass('cscattered');
      }
    }),

    // An External Resource
    mysteryIFrame: View.extend({
      el: '<iframe>',
      $parent: null,
      attributes: {
        url: ''
      },

      initialize: function(opt) {
        var self = this;
        self.$parent = opt.$parent;
      },

      render: function() {
        var self = this;
        self.el.src = self.model.get('contentURL');
        $(self.el).css({width: '100%', height: '100%'});
        self.$parent.html(self.el);
      }

    }),

    // A List container panel
    mysteryListPane: View.extend({
      el: '<div></div>',
      $el: null,
      child: null,
      titleTemplate: '<h4><%=title%></h4>',
      innerContainer: '<div class="listpaneInnerContainer innerContainer"></div>',
      descriptionTemplate: '<article class="description"><%=description%></article>',
      listContainer: '<div class="listPane"></div>',
      backButton: '<button class="back">back</button>',

      scrollable: false,
      theScroller: null,

      events: {

      },

      initialize: function(opt) {
        var self = this;
        self.$el = $(self.el);
        self.$el.attr('id', opt.paneOptions.id);
        self.$el.attr('class', opt.paneOptions.classes);

        self.scrollable = true;

        // Render the inner container (contains everything except the title.)
        self.innerContainer = $(self.innerContainer);
        self.innerContainer.attr('id', 'scroll-'+opt.paneOptions.id);

        // Add the title
        if (opt.paneOptions.title) {
          self.$el.append(_.template(this.titleTemplate, {title: opt.paneOptions.title}));
        }

        // Render the list container
        self.listContainer = $(self.listContainer);
        self.innerContainer.append(self.listContainer);

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
            if(opt.paneOptions.itemType == 'sidebar') {
              /**
              * This hack corrects Flickr's terrible file
              * name format
              **/
              if(model.get('@type') == 'ImageObject' && model.get('url') && model.get('url').indexOf('flickr') > 0) {
                model.attributes.name = model.get('name').split('_').shift();
                model.attributes.name = model.get('name').split(/(?=[A-Z])/).join(' ');
              }

              return new views.mysterySidebarItem({model: model});
            }
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

        if(self.scrollable) {
          if(!self.theScroller && Joshfire.framework.adapter != 'browser' && !Modernizr.overflowscrolling) {
            setTimeout(function() {

              self.theScroller = new iScroll("sidebarlist", {
                hScroll: false,
                scrollbarClass: 'contentScroll'
              });

              var theel = $('#'+opt.paneOptions.id);
              setTimeout(function() {
                self.theScroller.refresh();
              }, 200);
            }, 800);
          }
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

    /**
    * A list representing a collection.
    * Used on homepage & sidebar.
    **/
    mysteryList: List.extend({

      // setContent is called by render().
      setContent: function(html) {
        $('ul', this.itemOptions.$parent).remove();
        var self = this,
            $html = $(html),
            theopt = this.itemOptions,
            thelis = $('li', $html);
        /**
        * Only insert the first five elements right away.
        * Wait for the end of the animation to load the
        * rest of the list into the DOM.
        * Only for sidebars...
        **/
        if(thelis.length > 5 && !theopt.homepage) {
          $('li', $html).remove();
          $html.append(thelis.slice(0, 5));

          setTimeout(function() {
            var modulo = Math.round((thelis.length - 5)/20),
                i = 0;

            var interval = setInterval(function() {
              $html.append(thelis.slice(i*20, i*20+20));
              if(i == modulo) {
                // Manually triger enhance once again to add
                // handlers on the more recent links.
                self.enhance();
                clearInterval(interval);
                return;
              }
              i++;
            }, 50);
          }, 800);
        }
        /**
        * Set backgrounds !
        **/
        theopt.$parent.append($html);
        $('ul', theopt.$parent).attr('id', theopt.listId || '');
        $('ul', theopt.$parent).attr('class', theopt.listClasses || '');

      },

      enhance: function() {
        var self = this;
        
        if(Joshfire.framework.adapter == 'ios') {
          $('a', this.itemOptions.$parent).each(function(el) {
            var tap = new Tap(this);
            this.removeEventListener('tap', self.taphandle);
            this.addEventListener('tap', self.taphandle);
            this.removeEventListener('click', self.clickhandle);
            this.addEventListener('click', self.clickhandle);
          });
        }
        else {
          $('a', this.itemOptions.$parent).click(self.taphandle);
        }
      },

      taphandle: function(e) {
        var thelink = e.target;
        while(!thelink.href) {
          thelink = thelink.parentElement || thelink.parentNode;
        }
        
        document.location = thelink.href;

        e.preventDefault();
        e.stopPropagation();

        return false;
      },

      clickhandle: function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
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
      template: '<li id="homeitem-<%=model.get("id")%>"><a class="homelistitemlink" href="<%=model.get("path")%>"><h3><%=model.get("name")%></h3></a></li>',
      
      initialize: function() {
        var self = this;

        View.prototype.initialize.call(this);
        this.id = 'homeitem-'+this.model.get("id");

        var setFirstChildrenImage = function(item) {
          if(!self.coverImage) {
            if(item.get('image')) {
              self.setImage(item.get('image').contentURL);
              self.model.get('children').unbind('add', setFirstChildrenImage);
            }
          }
        };

        this.model.get('children').bind('add', setFirstChildrenImage);
        
      },

      generate: function(cb) {
        // get its description children and show it
        var desc = this.model.get('children').getDescriptionPost();
        cb(null, _.template(this.template, {model: this.model, desc: desc}));
      },

      setImage: function(url) {
        var self = this;
        var img = new Image();
        img.src = url;
        img.onload = function() {
          var bg = $('<div />')
            .addClass('background')
            .css({
              background: 'transparent url('+url+') no-repeat top center',
              backgroundSize: 'cover',
              opacity: 0
            });
          
          $('#'+self.id).append(bg);
          if(Joshfire.framework.adapter == "ios")
            $(bg).anim({opacity: 1}, 0.4, 'linear');
          else
            $(bg).animate({opacity: 1}, 400);
          
        };
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
          if(Joshfire.framework.adapter == "ios")
            self.$el.anim({opacity: 1}, 0.4, 'linear');
          else
            self.$el.animate({opacity: 1}, 400);
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
          if(Joshfire.framework.adapter == "ios")
            self.$el.anim({opacity: 1}, 0.4, 'linear');
          else
            self.$el.animate({opacity: 1}, 400);
        }, 0);
      },

      setText: function(text) {
        this.$el.show().css({opacity: 0});
        $('.content', this.$el).html(text);
        if(Joshfire.framework.adapter == "ios")
          self.$el.anim({opacity: 1}, 0.4, 'linear');
        else
          self.$el.animate({opacity: 1}, 400);
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
          
          var cb = function() {
            $('.content', self.$el).empty();
            self.$el.css({"opacity": "1", "display": "none"});
          };

          if(Joshfire.framework.adapter == "ios")
            self.$el.anim({opacity: 1}, 0.4, 'linear', cb);
          else
            self.$el.animate({opacity: 1}, 400, cb);
        });
      }
    })

  };

  return views;
});
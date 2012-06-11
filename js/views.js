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
        else {
          self.child = new views.mysteryBlogPost({
            model: opt.data,
            opt: opt.paneOptions,
            $parent: self.$el
          });
          self.child.render();
        }

        if(opt.data.get('@type') == 'VideoObject') {
          var thevideo = $('iframe', self.$el).clone();
          $('.maincontent').css({height: thevideo.attr('height')+'px'});
          $('iframe', self.$el).remove();
          $('.maincontent', self.$el).append('<div style="height:'+thevideo.attr('height')+'px;" class="loader"></div>');
            
          setTimeout(function() {
            thevideo.attr('width', $('#content').width() - 100);
            $('.maincontent', self.$el).append(thevideo);
            $('iframe', self.$el).on('load', function() {
              $('.maincontent .loader', self.$el).anim({opacity: 0}, 0.6, 'linear', function() {
                $(this).remove();
              });
            });
          }, 800);
        }

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
      template: '#image-template',
      titleTemplate: '<h4><%=title%></h4><div class="loader"></div>',
      $parent: null,
      theScroller: null,

      initialize: function(opt) {
        var self = this;

        this.$parent = opt.$parent;
        this.$el = $(this.el);
        this.template = $('#image-template').html();
        //this.scrollable = opt.opt.scrollable;
      },

      renderTitle: function() {
        var self = this;
        self.$el.append(_.template(self.titleTemplate, {title: self.model.get('name')}));
        self.$parent.append(self.$el);
      },

      generate: function(cb) {
        var self = this;
        cb(null, _.template(self.template, {item: self.model.toJSON()}));
      },

      setContent: function(html) {
        var self = this;
        var $html = $(html);
        var $theimg = $('<img src="'+self.model.get('contentURL')+'" />');
        self.$el.append(html);
        $('.maincontent', self.$el).append($theimg);
        $('.innerContainer', self.$el).css({opacity: 0});
        $theimg.on('load', function() {
          $('.loader', self.$el).remove();
          $('.innerContainer', self.$el).anim({opacity: 1}, 0.4, 'ease-in-out');
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
        return;
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
        if(this.model.get('articleBody')) {
          this.model.attributes.articleBody = this.model.get('articleBody').replace('src="//', 'src="http://');
          this.model.attributes.articleBody = this.model.get('articleBody').replace(/href="/gi, 'target="_blank" href="');
        }

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


      enhance: function() {
        var self = this;
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

        if(Joshfire && Joshfire.factory) {
          // Set the background image.
          var bg = Joshfire.factory.config.template.options.backgroundurl;
          if(bg) 
            $('#'+opt.paneOptions.listId).css({
              background: '#F8F6F4 url('+bg+') no-repeat center center',
              backgroundSize: 'cover'
            });

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

      showAnimated: function() {
        var self = this;
        var theconf;
        if(Joshfire.factory && Joshfire.factory.config)
          theconf = Joshfire.factory.config.template.options.introanim;
        
        if(Joshfire.factory && Joshfire.factory.config && Joshfire.factory.config.template.options && Joshfire.factory.config.template.options.introanim) {
          self.$el.show().addClass('shown');
          $('#tableofcontent').show();
          self.videoEnded();
        }
        else {
          self.$el.show().addClass('shown').addClass('anim');
          $('#tableofcontent').show();
          setTimeout(function(e) {
            self.videoEnded(e);
          }, 1400);
        }
      },

      videoEnded: function(e) {
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
        }, 1600);
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
    }),

    // a list representing a collection.
    // It extends a class from the framework.
    mysteryList: List.extend({

      // setContent is called by render(). It sets the content ...
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
        **/
        if(thelis.length > 5) {
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

        theopt.$parent.append($html);
        $('ul', theopt.$parent).attr('id', theopt.listId || '');
        $('ul', theopt.$parent).attr('class', theopt.listClasses || '');

      },

      enhance: function() {
        var self = this;
        
        $('a', this.itemOptions.$parent).each(function(el) {
          var tap = new Tap(this);
          this.removeEventListener('tap', self.taphandle);
          this.addEventListener('tap', self.taphandle);
          this.removeEventListener('click', self.clickhandle);
          this.addEventListener('click', self.clickhandle);
        });

      },

      taphandle: function(e) {
        var thelink = e.target;
        while(!thelink.href) {
          thelink = thelink.parentElement;
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
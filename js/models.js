define(['joshlib!vendor/backbone', 'js/views'], function(Backbone, views) {
  var models = {
    /**
    * Defines the data models of the app. ApplicationTree is manually
    * created first then it creates all of its children.
    * They are mostly data objects.
    * They also create and keep their views as properties.
    **/

    /**
    * Root of the app -> main view, mosaique
    **/
    ApplicationTree: Backbone.Model.extend({

      defaults: {
        view: null,
        children: null,
        '@type': 'Chapter'
      },

      initialize: function() {
        /**
        * Store the children in a collection
        **/
        this.set({'children': new models.Elements()});
      },

      addBranch: function(data) {
        /**
        * Test what you expected as a value
        **/
        if(data) {
          if(!data['@type']) {
            data['@type'] = "Chapter";
          }
          data.path = '#/view';
          this.get('children').add(new models.Element(data));
        }
      }
    }),

    /**
    * An element, category or post
    **/
    Element: Backbone.Model.extend({
      idProperty: '_id',
      defaults: {
        _id: 0,
        name: 'posttitle',
        slug: 'postslug',
        dateAdded: '',
        dateModified: '',
        parent: 0,
        //medias: null,
        content: '',
        children: null,
        '@type': 'Thing',
        guid: null,
        path: 0
      },
      firstLoading: false,
      initialize: function(data) {
        var self = this;

        this.set({
          id: data.ID || data.id,
          _id: data.ID || data.id,
          name: data.name,
          content: data.articleBody,
          slug: data.post_name,
          children: new models.Elements,
          path: ''
        });

        this.set({id: this.cid})
        this.set({'guid': this.cid});
        this._find = data.find;
        // Set its absolute path property
        this.set({path: data.path + '/' + this.get('guid')});
        // Load the first elements
        if(typeof this._find == 'function') {
          this.find({}, function() {
            self.firstLoading = true;
          });
        }
      },

      find: function(opt, cb) {
        var self = this;
        this._find(opt, function(err, data) {
          if(err) {
            console.warn('Query to datasource could not be completed : '+err);
            return;
          }
          
          for(var k in data.entries) {
            data.entries[k].path = self.get('path');
            self.get('children').add(new models.Element(data.entries[k]));
          }

          if(typeof self._onDataLoaded == 'function')
            self._onDataLoaded(self.get('children'));

          cb(err, self.get('children'));
        });
      },

      _find: null,

      _onDataLoaded: null,

      _populateChildren: function(children) {
        for(var i in children) {
          if(children.hasOwnProperty(i)) {
            children[i].path = this.get('path');
            this.get('children').add(new models.Element(children[i]));
          }
        }
      },

      _populateMedias: function(medias) {
        for(var m in medias) {
          if(medias.hasOwnProperty(m)) {
            this.medias.add(new models.Media(medias[m]));
          }
        }
      }
    }),

    /**
    * A Collection of items
    **/
    Elements: Backbone.Collection.extend({
      
      comparator: function(el) {
        // Find the first int in the name of the element.
        // It is supposed to be the index of the post
        // (client validated convention, specific)
        var m = /(\d+)/.exec(el.get('name'));
        if(m && m.length) {
          m = m.shift();
          return parseInt(m);
        }
        return 0;
        
      },

      getFirstChapter: function() {
        for(var i in this.models) {

          if(this.models[i].get('@type') == 'Chapter') {
            return this.models[i];
          }
        }
        return false;
      },

      getFirstPost: function() {
        for(var i in this.models) {

          if(this.models[i].get('@type') == 'BlogPosting') {
            return this.models[i];
          }
        }
        return false;
      },

      getDescriptionPost: function() {
        for(var i in this.models) {
          if(this.models[i].get('isChapterIntro'))
            return this.models[i];
        }

        return false;
      }

    })

  };
  return models;
});
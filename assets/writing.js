/* jshint ignore:start */

/* jshint ignore:end */

define('writing/adapters/application', ['exports', 'writing/config/environment', 'firebase', 'emberfire/adapters/firebase'], function (exports, config, Firebase, FirebaseAdapter) {

  'use strict';

  exports['default'] = FirebaseAdapter['default'].extend({
    firebase: new Firebase['default'](config['default'].firebase)
  });

});
define('writing/app', ['exports', 'ember', 'ember/resolver', 'ember/load-initializers', 'writing/config/environment'], function (exports, Ember, Resolver, loadInitializers, config) {

  'use strict';

  var App;

  Ember['default'].MODEL_FACTORY_INJECTIONS = true;

  App = Ember['default'].Application.extend({
    modulePrefix: config['default'].modulePrefix,
    Resolver: Resolver['default']
  });

  loadInitializers['default'](App, config['default'].modulePrefix);

  exports['default'] = App;

});
define('writing/components/new-thought', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    thought: null,
    classNames: ['thought-form'],
    noisyTyping: Ember['default'].inject.service(),

    actions: {
      finish: function finish() {
        this.sendAction('finish', this.get('thought'));
      },
      typed: function typed() {
        var tracker = this.get('noisyTyping');

        tracker.recordTyping();
        tracker.playSound();

        var size = tracker.size();
        Ember['default'].$('input').css('font-size', size + 'px');
        Ember['default'].$('input').css('height', size + size / 2 + 'px');
      }
    },

    didInsertElement: function didInsertElement() {
      Ember['default'].$('input').focus();
    },

    autoSave: function autoSave() {
      var thought = this.get('thought');

      this.sendAction('save', thought);
    },

    stateChanged: (function () {
      var thought = this.get('thought');
      if (thought.get('isDirty') && !thought.get('isSaving')) {
        Ember['default'].run.once(this, this.autoSave);
      }
    }).on('init').observes('thought.body')
  });

});
define('writing/controllers/array', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Controller;

});
define('writing/controllers/object', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Controller;

});
define('writing/controllers/thoughts/index', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].ArrayController.extend({
    sortProperties: ['createdAt'],
    sortAscending: false
  });

});
define('writing/initializers/app-version', ['exports', 'writing/config/environment', 'ember'], function (exports, config, Ember) {

  'use strict';

  var classify = Ember['default'].String.classify;
  var registered = false;

  exports['default'] = {
    name: 'App Version',
    initialize: function initialize(container, application) {
      if (!registered) {
        var appName = classify(application.toString());
        Ember['default'].libraries.register(appName, config['default'].APP.version);
        registered = true;
      }
    }
  };

});
define('writing/initializers/emberfire', ['exports', 'emberfire/initializers/emberfire'], function (exports, EmberFireInitializer) {

	'use strict';

	exports['default'] = EmberFireInitializer['default'];

});
define('writing/initializers/export-application-global', ['exports', 'ember', 'writing/config/environment'], function (exports, Ember, config) {

  'use strict';

  exports.initialize = initialize;

  function initialize(container, application) {
    var classifiedName = Ember['default'].String.classify(config['default'].modulePrefix);

    if (config['default'].exportApplicationGlobal && !window[classifiedName]) {
      window[classifiedName] = application;
    }
  }

  ;

  exports['default'] = {
    name: 'export-application-global',

    initialize: initialize
  };

});
define('writing/models/thought', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    body: DS['default'].attr('string'),
    createdAt: DS['default'].attr('date', {
      defaultValue: function defaultValue() {
        return new Date();
      }
    }),
    hasBody: (function () {
      return this.get('body');
    }).property('body')
  });

});
define('writing/router', ['exports', 'ember', 'writing/config/environment'], function (exports, Ember, config) {

  'use strict';

  var Router = Ember['default'].Router.extend({
    location: config['default'].locationType
  });

  Router.map(function () {
    this.route('thoughts', function () {
      this.route('new');
    });
  });

  exports['default'] = Router;

});
define('writing/routes/index', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    beforeModel: function beforeModel() {
      return this.transitionTo('thoughts.index');
    }
  });

});
define('writing/routes/thoughts/index', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model() {
      return this.store.find('thought');
    }
  });

});
define('writing/routes/thoughts/new', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    actions: {
      save: function save(model) {
        if (model.get('hasBody')) {
          model.save();
        }
        return false;
      },
      finish: function finish(model) {
        var _this = this;

        if (model.get('hasBody')) {
          model.save().then(function () {
            _this.transitionTo('thoughts');
          });
        } else {
          model.destroyRecord().then(function () {
            _this.transitionTo('thoughts');
          });
        }
      }
    },
    model: function model() {
      return this.store.createRecord('thought');
    }
  });

});
define('writing/services/noisy-typing', ['exports', 'ember', 'wad'], function (exports, Ember, Wad) {

  'use strict';

  exports['default'] = Ember['default'].Service.extend({
    typingDelays: [],
    lastTypingTime: null,
    sound: new Wad['default'](Wad['default'].presets.piano),

    recordTyping: function recordTyping() {
      this.set('typingDelays', this.get('typingDelays').concat(this._timeSinceLastTyping()));
      this.set('lastTypingTime', Date.now());

      return null;
    },

    playSound: function playSound() {
      this.get('sound').pitch = this.pitch();
      this.get('sound').play();
    },

    pitch: function pitch() {
      var typingDelays = this.get('typingDelays');
      var totalTypingDelay = 0;
      var typingDelayCount = 0;

      if (!typingDelays.length) {
        return 5;
      }

      for (var i = 1; i <= 5; i++) {
        var typingDelay = typingDelays[typingDelays.length - i];

        if (!typingDelay) {
          break;
        }

        totalTypingDelay += typingDelay;
        typingDelayCount += 1;
      }

      var pitch = 1000 / (totalTypingDelay / typingDelayCount / 10);
      return pitch;
    },

    size: function size() {
      var size = this.pitch();
      if (size < 20) {
        size = 20;
      } else if (size > 100) {
        size = 100;
      }

      return size;
    },

    _timeSinceLastTyping: function _timeSinceLastTyping() {
      if (!this.get('lastTypingTime')) {
        return 2000;
      }

      return Date.now() - this.get('lastTypingTime');
    } });

});
define('writing/templates/application', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.12.0",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "outlet");
        return fragment;
      }
    };
  }()));

});
define('writing/templates/components/new-thought', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.12.0",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","wrapper");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("form");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","actions");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("a");
        dom.setAttribute(el4,"href","#");
        var el5 = dom.createTextNode("Click me when you're done!");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content, element = hooks.element, get = hooks.get, inline = hooks.inline;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [2, 1]);
        var element1 = dom.childAt(element0, [1, 1]);
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        var morph1 = dom.createMorphAt(element0,3,3);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "yield");
        element(env, element0, context, "action", ["finish"], {"on": "submit"});
        element(env, element1, context, "action", ["finish"], {});
        inline(env, morph1, context, "view", ["complaining-text-view"], {"value": get(env, context, "thought.body"), "key-press": "typed"});
        return fragment;
      }
    };
  }()));

});
define('writing/templates/thoughts/index', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.12.0",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","thought");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
          content(env, morph0, context, "thought.body");
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.12.0",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("section");
        dom.setAttribute(el1,"class","thoughts");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","wrapper");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h1");
        var el4 = dom.createTextNode("\n      Thoughts\n\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, inline = hooks.inline, get = hooks.get, block = hooks.block, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0, 1]);
        var morph0 = dom.createMorphAt(dom.childAt(element0, [1]),1,1);
        var morph1 = dom.createMorphAt(element0,3,3);
        var morph2 = dom.createMorphAt(fragment,2,2,contextualElement);
        inline(env, morph0, context, "link-to", ["new", "thoughts.new"], {"class": "button"});
        block(env, morph1, context, "each", [get(env, context, "controller")], {"keyword": "thought"}, child0, null);
        content(env, morph2, context, "outlet");
        return fragment;
      }
    };
  }()));

});
define('writing/templates/thoughts/new', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.12.0",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        inline(env, morph0, context, "new-thought", [], {"thought": get(env, context, "model"), "save": "save", "finish": "finish"});
        return fragment;
      }
    };
  }()));

});
define('writing/tests/adapters/application.jshint', function () {

  'use strict';

  module('JSHint - adapters');
  test('adapters/application.js should pass jshint', function() { 
    ok(true, 'adapters/application.js should pass jshint.'); 
  });

});
define('writing/tests/app.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('app.js should pass jshint', function() { 
    ok(true, 'app.js should pass jshint.'); 
  });

});
define('writing/tests/components/new-thought.jshint', function () {

  'use strict';

  module('JSHint - components');
  test('components/new-thought.js should pass jshint', function() { 
    ok(true, 'components/new-thought.js should pass jshint.'); 
  });

});
define('writing/tests/controllers/thoughts/index.jshint', function () {

  'use strict';

  module('JSHint - controllers/thoughts');
  test('controllers/thoughts/index.js should pass jshint', function() { 
    ok(true, 'controllers/thoughts/index.js should pass jshint.'); 
  });

});
define('writing/tests/helpers/resolver', ['exports', 'ember/resolver', 'writing/config/environment'], function (exports, Resolver, config) {

  'use strict';

  var resolver = Resolver['default'].create();

  resolver.namespace = {
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix
  };

  exports['default'] = resolver;

});
define('writing/tests/helpers/resolver.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/resolver.js should pass jshint', function() { 
    ok(true, 'helpers/resolver.js should pass jshint.'); 
  });

});
define('writing/tests/helpers/start-app', ['exports', 'ember', 'writing/app', 'writing/router', 'writing/config/environment'], function (exports, Ember, Application, Router, config) {

  'use strict';



  exports['default'] = startApp;
  function startApp(attrs) {
    var application;

    var attributes = Ember['default'].merge({}, config['default'].APP);
    attributes = Ember['default'].merge(attributes, attrs); // use defaults, but you can override;

    Ember['default'].run(function () {
      application = Application['default'].create(attributes);
      application.setupForTesting();
      application.injectTestHelpers();
    });

    return application;
  }

});
define('writing/tests/helpers/start-app.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/start-app.js should pass jshint', function() { 
    ok(true, 'helpers/start-app.js should pass jshint.'); 
  });

});
define('writing/tests/models/thought.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/thought.js should pass jshint', function() { 
    ok(true, 'models/thought.js should pass jshint.'); 
  });

});
define('writing/tests/router.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('router.js should pass jshint', function() { 
    ok(true, 'router.js should pass jshint.'); 
  });

});
define('writing/tests/routes/index.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/index.js should pass jshint', function() { 
    ok(true, 'routes/index.js should pass jshint.'); 
  });

});
define('writing/tests/routes/thoughts/index.jshint', function () {

  'use strict';

  module('JSHint - routes/thoughts');
  test('routes/thoughts/index.js should pass jshint', function() { 
    ok(true, 'routes/thoughts/index.js should pass jshint.'); 
  });

});
define('writing/tests/routes/thoughts/new.jshint', function () {

  'use strict';

  module('JSHint - routes/thoughts');
  test('routes/thoughts/new.js should pass jshint', function() { 
    ok(true, 'routes/thoughts/new.js should pass jshint.'); 
  });

});
define('writing/tests/services/noisy-typing.jshint', function () {

  'use strict';

  module('JSHint - services');
  test('services/noisy-typing.js should pass jshint', function() { 
    ok(true, 'services/noisy-typing.js should pass jshint.'); 
  });

});
define('writing/tests/test-helper', ['writing/tests/helpers/resolver', 'ember-qunit'], function (resolver, ember_qunit) {

	'use strict';

	ember_qunit.setResolver(resolver['default']);

});
define('writing/tests/test-helper.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('test-helper.js should pass jshint', function() { 
    ok(true, 'test-helper.js should pass jshint.'); 
  });

});
define('writing/tests/unit/components/new-thought-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForComponent('new-thought', 'Unit | Component | new thought', {});

  ember_qunit.test('it renders', function (assert) {
    assert.expect(2);

    // Creates the component instance
    var component = this.subject();
    assert.equal(component._state, 'preRender');

    // Renders the component to the page
    this.render();
    assert.equal(component._state, 'inDOM');
  });

  // Specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar']

});
define('writing/tests/unit/components/new-thought-test.jshint', function () {

  'use strict';

  module('JSHint - unit/components');
  test('unit/components/new-thought-test.js should pass jshint', function() { 
    ok(true, 'unit/components/new-thought-test.js should pass jshint.'); 
  });

});
define('writing/tests/unit/controllers/thoughts/index-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('controller:thoughts/index', {});

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var controller = this.subject();
    assert.ok(controller);
  });

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('writing/tests/unit/controllers/thoughts/index-test.jshint', function () {

  'use strict';

  module('JSHint - unit/controllers/thoughts');
  test('unit/controllers/thoughts/index-test.js should pass jshint', function() { 
    ok(true, 'unit/controllers/thoughts/index-test.js should pass jshint.'); 
  });

});
define('writing/tests/unit/models/thought-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('thought', 'Unit | Model | thought', {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test('it exists', function (assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('writing/tests/unit/models/thought-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/thought-test.js should pass jshint', function() { 
    ok(true, 'unit/models/thought-test.js should pass jshint.'); 
  });

});
define('writing/tests/unit/routes/thoughts/index-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:thoughts/index', 'Unit | Route | thoughts/index', {});

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('writing/tests/unit/routes/thoughts/index-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes/thoughts');
  test('unit/routes/thoughts/index-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/thoughts/index-test.js should pass jshint.'); 
  });

});
define('writing/tests/unit/routes/thoughts/new-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:thoughts/new', 'Unit | Route | thoughts/new', {});

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('writing/tests/unit/routes/thoughts/new-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes/thoughts');
  test('unit/routes/thoughts/new-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/thoughts/new-test.js should pass jshint.'); 
  });

});
define('writing/tests/unit/services/noisy-typing-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('service:noisy-typing', 'Unit | Service | noisy typing', {});

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var service = this.subject();
    assert.ok(service);
  });

  // Specify the other units that are required for this test.
  // needs: ['service:foo']

});
define('writing/tests/unit/services/noisy-typing-test.jshint', function () {

  'use strict';

  module('JSHint - unit/services');
  test('unit/services/noisy-typing-test.js should pass jshint', function() { 
    ok(true, 'unit/services/noisy-typing-test.js should pass jshint.'); 
  });

});
define('writing/tests/unit/views/complaining-text-view-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('view:complaining-text-view', 'Unit | View | complaining text view');

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var view = this.subject();
    assert.ok(view);
  });

});
define('writing/tests/unit/views/complaining-text-view-test.jshint', function () {

  'use strict';

  module('JSHint - unit/views');
  test('unit/views/complaining-text-view-test.js should pass jshint', function() { 
    ok(true, 'unit/views/complaining-text-view-test.js should pass jshint.'); 
  });

});
define('writing/tests/views/complaining-text-view.jshint', function () {

  'use strict';

  module('JSHint - views');
  test('views/complaining-text-view.js should pass jshint', function() { 
    ok(true, 'views/complaining-text-view.js should pass jshint.'); 
  });

});
define('writing/views/complaining-text-view', ['exports', 'ember', 'wad'], function (exports, Ember, Wad) {

  'use strict';

  exports['default'] = Ember['default'].TextField.extend({
    complainSound: new Wad['default'](Wad['default'].presets.hiHatOpen),
    keyUp: function keyUp(e) {
      // Play noise on backspace
      if (e.keyCode === 8) {
        this.get('complainSound').play();
      }
    }
  });

});
/* jshint ignore:start */

/* jshint ignore:end */

/* jshint ignore:start */

define('writing/config/environment', ['ember'], function(Ember) {
  var prefix = 'writing';
/* jshint ignore:start */

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

/* jshint ignore:end */

});

if (runningTests) {
  require("writing/tests/test-helper");
} else {
  require("writing/app")["default"].create({"name":"writing","version":"0.0.0."});
}

/* jshint ignore:end */
//# sourceMappingURL=writing.map
(function (j, i, n) {
  var m = Array.prototype.slice,
  f = {VERSION: "0.1.1"};
  // class
  var x = function (a) {
    var b = function () {};
    b.prototype = a;
    return new b();
  },
  // extend
  k = function (a) {
    for (var b = m.call(arguments, 1), c = 0; c < b.length; c++) {
      for (var d in b[c]) {
        b[c][d] !== n && (a[d] = b[c][d]);
      }
    }
    return a;
  },
  // 继承
  y = function (a, b, c) {
    var d = function () {
      return a.apply(this, arguments);
    };
    k(d, a);
    d.prototype = x(a.prototype);
    b && k(d.prototype, b);
    c && k(d, c);
    d.prototype.constructor = d;
    d.__super__ = {};
    k(d.__super__, a);
    d.prototype.__super__ = a.prototype;
    return d;
  },
  z = history.pushState ? !0: !1,
  A = "onhashchange" in j,
  B = function (a) {
    if (a.configure) {
      var b = a.configure;
      h.build_table(b.name,b.table_key,b.table_index,b.table_suffix);
      a.summary=function(c,d,e){
        if(e)
          i.ajax({
          url:b.url+".json?ids="+c.join(",")+"&response=summary",type:"GET",dataType:"json",success:function(a){var c=[];if(!a||a.error)d([]);else{for(var e=0;e<a.length;e++)c.push(i.extend({},a[e]));h.set_summary(c,b.name,b.summary_key,b.complete_key,b.default_value?b.default_value:{});d(a)}},error:function(){d(null)}
          });
        else{
          var g=[].concat(c);
          h.get_summary(g,function(c){
            for(var e=0,f=0,i=[];e<c.length;){
              if(c[e]&&c[e][b.summary_key]){
                var h=g.indexOf(c[e].id);-1!==h&&(g[h]=c[e])
              }
              e++
            }
            for(;f<g.length;)
              g[f][b.summary_key]||i.push(g[f]),f++;0<i.length?a.summary(i,function(a){
                if(a)
                  for(e=a.length;e--;)
                    for(f=g.length;f--;)
                      if(g[f]==a[e].id){
                        g[f]=a[e];break
                      }
                d(g)
              },!0):d(g)},b.name)
        }
      };
      a.complete=function(c,d,e){
        e?i.ajax({
          url:b.url+"/"+c+".json",
          type:"GET",
          dataType:"json",
          success:function(a){
            if(!a||a.error)
              d(null);
            else{
              var c=b.default_value?b.default_value:{};h.set_complete(i.extend({},a),b.name,null,b.summary_key,b.complete_key,c);
              d(a)
            }
          },
          error:function(){d(null)}
        }):h.get_complete(c,function(e){
          e[0]&&e[0][b.complete_key]?d(e[0]):a.complete(c,d,!0)},b.name)
      };
      a.simple=function(a,d,e){
        b.before_simple&&b.before_simple(a);
        var g=b.url+".json",a=i.param(a)+(e?"&filter=true":"");
        i.ajax({url:g,type:"GET",dataType:"json",
          data:a,
          success:function(a){
            if(!a||a.error)a={data:[]};
            h.set_simple(a.data,b.name,b.summary_key,b.complete_key);
            b.after_simple&&b.after_simple(a,e);d(a)},
          error:function(){
            b.after_simple&&b.after_simple(null,e);d(null)
          }
        })
      };
      a.find=function(b,d){
        a.simple(b,function(b){
          b&&b.data&&0<b.data.length?a.summary(b.data,function(a){d(a)}):d([])})
      };
      a.clear_cache=function(a){
        h.clear(a,b.name)
      }
    }
  },
  h={
    init:function(){
      var a;
      if(a=webSql.connect("ihaveu",0.1,"ihaveu mobile app",5E5))
        try{
          j.localStorage.setItem("useLocalStorage","yes"),a=!0
        }catch(b){
          a=!1
        }
      if(a)
        this.cache_type="websql";
      else
        try{
          j.localStorage.setItem("useLocalStorage","yes"),this.cache_type="localStorage"
        }catch(c){
          this.cache_type="cache"
        }
      if(DB_CONFIGURE&&DB_CONFIGURE[this.cache_type])
        DB_CONFIGURE[this.cache_type]()
    }(),
    build_table:function(a,b,c,d){
      if("websql"==j.cache_type)
        try{
          this[a+"Sql"]=webSql.define(a+d,b,c)
        }catch(e){
          this[a+"Sql"].drop(),this[a+"Sql"]=webSql.define(a+d,b,c)}
    },
    store_gap:"_",
    _get_sql:function(a){
      return this[a+"Sql"]
    },
    _get_cache:function(a,b){
      this.CACHE||(this.CACHE={});
      this.CACHE[a]||(this.CACHE[a]={});
      return i.extend({},this.CACHE[a][b])
    },
    _set_cache:function(a,b,c){
      this.CACHE||(this.CACHE={});
      this.CACHE[a]||(this.CACHE[a]={});
      this.CACHE[a][b]=c
    },
    get_summary:function(){if("websql"==this.cache_type)return function(a,
b,c){this._get_sql(c).find("*",{where:"id in ("+a.join(",")+")"},function(a,c){b(c)},function(a,c){b([]);throw c;})};if("localStorage"==this.cache_type)return function(a,b,c){for(var d=[],e=0;e<a.length;e++){var g=MI.store.get(c+h.store_gap+a[e]);g&&d.push(g)}b(d)};if("cache"==this.cache_type)return function(a,b,c){for(var d=[],e=0;e<a.length;e++){var g=this._get_cache(c,a[e]);g&&d.push(g)}b(d)}}(),get_complete:function(){if("websql"==this.cache_type)return function(a,b,c){this._get_sql(c).find("*",
{where:"id ="+a},function(a,c){b(c)},function(a,c){b([]);throw c;})};if("localStorage"==this.cache_type)return function(a,b,c){b([MI.store.get(c+h.store_gap+a)])};if("cache"==this.cache_type)return function(a,b,c){b([this._get_cache(c,a)])}}(),set_summary:function(){return"websql"==this.cache_type?function(a,b,c,d,e){var g=this._get_sql(b);0<a.length&&g.find("*",{where:"id = "+a[0].id},function(g){h.set_complete(a[0],b,g,c,d,e);for(var f=1;f<a.length;)h.set_complete(a[f],b,g,c,d,e),f++},function(g,
f){for(var i=1;i<a.length;)h.set_complete(a[i],b,g,c,d,e),i++;throw f;})}:function(a,b,c,d,e){for(var g=0;g<a.length;)h.set_complete(a[g],b,null,c,d,e),g++}}(),set_complete:function(){if("websql"==this.cache_type)return function(a,b,c,d,e,g){var f=this._get_sql(b);
  f.find("*",{where:"id = "+a.id},function(b,c){(c=c[0])?h.need_update(a,c,d,e)&&f.update(i.extend({},g,a),function(){},function(a,b){throw b;},b):f.insert(i.extend({},g,a),function(){},function(a,b){throw b;},b)},function(a,b){throw b;},
c||null)};if("localStorage"==this.cache_type)return function(a,b,c,d,e){c=MI.store.get(b+h.store_gap+a.id);(!c||h.need_update(a,c,d,e))&&MI.store.set(b+h.store_gap+a.id,a)};if("cache"==this.cache_type)return function(a,b,c,d,e){c=this._get_cache(b,a.id);(!c||h.need_update(a,c,d,e))&&this._set_cache(b,a.id,a)}}(),_update_simple:function(){if("websql"==this.cache_type)return function(a,b,c,d,e){var g=this._get_sql(b);g.find("*",{where:"id = "+a.id},function(b,c){(c=c[0])&&h.need_update(a,c,d,e)&&g.destroy(a.id,
function(){},function(){},b)},function(a,b){throw b;},c||null)};if("localStorage"==this.cache_type)return function(a,b,c,d,e){(c=MI.store.get(b+h.store_gap+a.id))&&h.need_update(a,c,d,e)&&MI.store.remove(b+h.store_gap+a.id)};if("cache"==this.cache_type)return function(a,b,c,d,e){(c=this._get_cache(b,a.id))&&h.need_update(a,c,d,e)&&this._set_cache(b,a.id,null)}}(),set_simple:function(){return"websql"==this.cache_type?function(a,b,c,d){var e=this._get_sql(b);0<a.length&&e.find("*",{where:"id = "+a[0].id},
function(e){var f=1;for(h._update_simple(a[0],b,e,c,d);f<a.length;)h._update_simple(a[f],b,e,c,d),f++},function(a,b){throw b;})}:function(a,b,c,d){for(var e=0;e<a.length;)h._update_simple(a[e],b,null,c,d),e++}}(),clear:function(){if("websql"==this.cache_type)return function(a,b){this._get_sql(b).destroy(a)};if("localStorage"==this.cache_type)return function(a,b){MI.store.remove(b+h.store_gap+a)};if("cache"==this.cache_type)return function(a,b){this._set_cache(b,a,null)}}(),need_update:function(a,
b,c,d){return a.updated_at>b.updated_at||a[d]&&!b[d]||!b[c]}};

f.Events={
  bind:function(a,b,c,d){var e=this._callbacks||(this._callbacks={});(e[a]||(e[a]=[])).push(1===d?[b,c,1]:[b,c]);return this},
  one:function(a,b,c){this.bind(a,b,c,1);return this},
  unbind:function(a,b){var c;if(a){if(c=this._callbacks)if(b){c=c[a];if(!c)return this;for(var d=0,e=c.length;d<e;d++)if(c[d]&&b===c[d][0]){c[d]=null;break}}else c[a]=[]}else this._callbacks={};return this},
  trigger:function(a){var b,c,d,e,g=2;if(!(c=this._callbacks))return this;
for(;g--;)if(b=g?a:"all",b=c[b])for(var f=0,i=b.length;f<i;f++)(d=b[f])?(e=g?m.call(arguments,1):arguments,d[0].apply(d[1]||this,e),1===d[2]&&(b[f]=null)):(b.splice(f,1),f--,i--);return this}
};
// Model
f.Model=function(a,b){
  var c;a||(a={});if(c=this.defaults)i.isFunction(c)&&(c=c.call(this)),a=k({},c,a);this.attributes={};this.set(a,{silent:!0});this._changed=!1;this.initialize(a,b)
};
k(f.Model.prototype,f.Events,{
    initialize:function(){},
    get:function(a){return this.attributes[a]},
    set:function(a,b){
      b||(b={});
      if(!a)
        return this;
      a.attributes&&(a=a.attributes);var c=this.attributes,d;for(d in a){var e=a[d];c[d]!=e&&(c[d]=e,this._changed=!0,b.silent||this.trigger("change:"+d,this,e,b))}!b.silent&&this._changed&&this.trigger("change",this,b);this._changed=!1;return this}
});

var t="body",
C="swipe,swipeLeft,swipeRight,swipeUp,swipeDown,doubleTap,tap,singleTap,longTap,click,dbclick,mousedown,mouseup,mousemove,mouseover,mouseout,mouseenter,mouseleave,submit".split(","),
u=!0,l=[];

f.Controller=function(a){
  a||(a={});
  a.id&&(this.id=a.id);
  a.state&&(this.state=a.state);
  a.page&&(this.page=a.page);
  this.container||(this.container=t);
  this.className&&(this.page.className=this.className);
  this.silent=!!a.silent;
  this.constructor.isDetected||this._detectEvents(this.events,this.customEvents);this.pageSelector&&(this.page=i(this.pageSelector,this.container)[0]||i(this.pageSelector)[0])&&this.bindEvents(this.constructor.customEvents);
  this.bindEvents(this.constructor.events,!0);
  u&&(u=!1,l=MI.store.get_ex("page_cache_list",!0)||[],l.forEach(function(a){
    MI.store.remove_ex("p@"+a,true)
  }), MI.store.set_ex("page_cache_list",[],!0),l=[]);
  if(!0===this.constructor.pageCache&&j.supported_localStorage){
    this.bind("afterhide",function(){
      if(this.constructor.pageCache){
        this.addCache();this.destroy()
      }
    });
    this.removeCache=function(){
      localStorage.removeItem("p@"+this.id);
      var a=l.indexOf(this.id);
      if(a>-1){
        l.splice(a,1);
        localStorage.setItem("page_cache_list",JSON.stringify(l))
      }
    };
    this.addCache=function(){
      try{
        localStorage.setItem("p@"+this.id,JSON.stringify({dom:this.page.innerHTML,data:this.cache||{}}));
        if(l.indexOf(this.id)===-1){
          l.push(this.id);localStorage.setItem("page_cache_list",JSON.stringify(l))
        }
      }catch(a){
        localStorage.removeItem("p@"+this.id);this.addCache()
      }
    };
    this.getCache=function(){
      return JSON.parse(localStorage.getItem("p@"+this.id)||'""')
    };
    var b=this.getCache();
    b&&b.dom&&(this.render=function(){
      this.page.innerHTML=b.dom;
      this.cache=b.data;
      i(this.container).append(this.page);
      this.trigger("renderEnd");this.silent||f.doComplete(this)
    },
    this.fetch=function(){
      this.render()
    },
    this.reBuild=function(){this.reRender()},
    this.reRender=function(){
      var a=function(){
        this.trigger("bindCustomEvents");
        this.created=true;
        this.trigger("create");
        this.page_animation_end=false;
        this.trigger("show")
      };
      if(this.page_animation_end)
        a();
      else
        this.unbind("pageAnimationEnd",a).one("pageAnimationEnd",a)
    })
  }
  !0===this.constructor.reLoad&&this.bind("afterhide",function(){
    this.destroy()
  });
  this.initialize.apply(this,arguments);
  this.initEvents.apply(this,arguments)
};
var o=/^(\S+)\s*(.*)$/;
k(f.Controller.prototype,f.Events,{
  className:"",
  $:function(a){
    return i(a,this.page)
  },
  initialize:function(){},
  initEvents:function(){
    this.bind("show",this.afterShow)
  },
  render:function(a,b,c){
    a||(a={});b||(b=this.constructor.template);
    b&&i(this.page).html(Mustache.to_html(b,a,c));this._create()
  },
  _create:function(){i(this.container).append(this.page);this.bindEvents(this.constructor.customEvents);this.created=!0;this.trigger("create");this.silent||p(this)},
  fetch:function(){this.render()},
  afterShow:function(){},
  destroy:function(){this.deleted=!0;i(this.page).remove();delete PAGES[this.id]},
  append:function(a,b){
    if(a&&b){var c=i(b).addClass("eventsbind");i(a).append(c);var d=this.constructor.customEvents,e;for(e in d){var f=this[d[e]];if(!f)throw Error('Event "'+d[e]+'" does not exist');var h=e.match(o),j=h[1],h=h[2],f=f._bind(this),h=i(this.page).find(h);h.length&&(h.filter(".eventsbind").on(j,f),h.each(function(a,b){var c=i(b);if(c.parents(".eventsbind")[0])c.on(j,f)}))}c.removeClass("eventsbind")}
  },
  bindEvents:function(a,b){if(a){var b=!0===b?!0:!1,c;for(c in a){var d=this[a[c]];if(!d)throw Error('Event "'+a[c]+'" does not exist');var e=c.match(o),f=e[1],e=e[2],d=d._bind(this);if(b)i(this.page).on(f,e,d);else i(e,this.page).on(f,d)}}},
  _detectEvents:function(a,b){
    var c=k({},a),d=k({},b),e,f;for(e in c)if((f=e.match(o)[1])&&-1==C.indexOf(f))d[e]=c[e],delete c[e];this.constructor.events=c;
    this.constructor.customEvents=d;this.constructor.isDetected=!0
  }
},{
  events:null,
  customEvents:null,
  isDetected:!1
});
var v=/:([\w\d]+)/g,D=/\*([\w\d]+)/g,E=/[-[\]{}()+?.,\\^$|#\s]/g,w=/^#*/,q=!1;
PAGES={};
Class={};
f.currentController=null;
f.generateId=function(a){return"p"+md5(a)};
f.Router={
  init:function(a){
    a||(a={});
    a.routes&&(this.routes=a.routes);
    this.pushState=z;
    !1===a.pushState&&(this.pushState=!1);
    a.routeMap&&i.isFunction(a.routeMap)&&(this._routeMap=a.routeMap,this.customRoute=!0);
    a.parseHash&&(this.parseHash=a.parseHash);
    this.prefix=a.prefix||"#";
    w=RegExp("^"+this.prefix+"*");
    a.defaultHash&&(this.defaultHash=a.defaultHash);
    a.defaultController&&(this.defaultController=a.defaultController);
    a.container&&(t=a.container);
    this._bindRoutes();
    a.initialize&&(this.initialize=a.initialize);
    this.initialize.apply(this,arguments)
  },
  curState:{},
  routesAry:[],
  paramsAry:[],
  actions:[],
  initialize:function(){},
  buildPage:function(a){
    var a=this.cleanHash(a),b=f.generateId(a),c=PAGES[b];c||(PAGES[b]=c=this.buildController(a,{silent:!0}),c.fetch());
    return c
  },
  buildController:function(a,b,c){var d=b&&b.state||this.getState(a),e=
b&&!0===b.silent?!0:!1,g=this._routeMap(a),h=f.generateId(a),i=document.createElement("div");i.id=h;this.getConstructor(g,function(a){var b=null;if(!a)throw Error(g+" does not exist");a.beforeFilter?!0===a.beforeFilter()&&(b=new a({state:d,id:h,page:i,silent:e})):b=new a({state:d,id:h,page:i,silent:e});delete Class[g];c&&c(b)})},
  getConstructor:function(a,b){var c=j[a]||Class[a];if(c)b&&b(c);else{var c=a.replace("Controller","").split(/(?=[A-Z])/).join("_").toLowerCase(),d;MI.cache&&(d=localStorage.getItem("c@"+
c));var e=function(b,c){j.eval.call(j,b);Class[a]=j[a];MI.cache&&(j[a]=null);c&&c(Class[a])};if(d)try{e(d,b)}catch(f){this.getSource(c,function(a){e(a,b)})}else this.getSource(c,function(a){e(a,b)})}},getSource:function(a,b){i.get("/cdn/mobile/javascripts/controller/"+a+".js?"+(MI.dev?Date.now():"201303161813"),function(c){if(c&&MI.cache)try{try{localStorage.setItem("c@"+a,c)}catch(d){localStorage.removeItem("c@"+a),localStorage.setItem("c@"+a,c)}}catch(e){}b&&b(c)})},getState:function(a){return{params:this.parseHash(a),
hash:a}},cleanHash:function(a){try{a=decodeURI(a)}catch(b){}return a.replace(w,"").replace(/#/,"")},_bindRoutes:function(){if(!0!==this.customRoute){if(!this.routes)return;var a=this.routes,b,c;for(c in a)b=this._routeToRegExp(c),this.routesAry.push(b[0]),this.paramsAry.push(b[1]),this.actions.push(a[c])}this.pushState?j.addEventListener("popstate",this._popstate.bind(this),!1):A&&j.addEventListener("hashchange",this._hashchange.bind(this),!1)},_popstate:function(a){a=a.state;f.changePage(a?a.hash:
j.location.hash,{state:a,hashchange:!1})},_hashchange:function(){q?q=!1:f.changePage(j.location.hash,{hashchange:!1})},_routeMap:function(a){return this.actions[this._match(a)]||this.defaultController},_match:function(a){var b=this.routesAry,c=b.length,d;for(d=0;d<c&&!b[d].test(a);d++);return d},parseHash:function(a){var b=this._match(a),c=this.routesAry[b],d=this.paramsAry[b],e={};if(c){d=this.paramsAry[b];a=c.exec(a).slice(1);b=0;for(c=d.length;b<c;b++)e[d[b]]=a[b]}return e},_routeToRegExp:function(a){var b,
c,d=[];b=a.replace(E,"\\$&").replace(v,"([^/]*)").replace(D,"(.*?)");for(b=RegExp("^"+b+"$");null!=(c=v.exec(a));)d.push(c[1]);return[b,d]}};
  f.History={
    isBack:!1,
    hist:[],
    add:function(a){
      this.hist.unshift(a)
    },
    getPrev:function(){
      return this.hist[1]
    }
  };
  var r=[],s=!1;
  f.changePage=function(a,b){var c=f.Router,a=c.cleanHash(a);!a&&c.defaultHash&&(a=decodeURI(c.defaultHash));if(s)r.push({hash:a,options:b});else if(s=!0,a==c.curState.hash)f.end();else{f.History.add(c.prefix+a);var d=b&&b.state||c.getState(a);
b&&!1===b.hashchange||(c.pushState?j.history.pushState(d,"",c.prefix+encodeURI(a)):(q=!0,j.location.hash=c.prefix+encodeURI(a)));c.curState=d;var e=f.generateId(a),g=PAGES[e];g?p(g):c.buildController(a,{state:d,silent:!1},function(a){if(a){PAGES[e]=a;PAGES[e].fetch()}else f.end()})}};var p=function(a){var b=f.currentController;f.currentController=a;f.complete(b,a)};
  f.end=function(){
    s=!1;if(0<r.length){var a=r.shift();f.changePage(a.hash,a.options)}
  };
  f.complete=function(a,b){
    a&&(i(a.page).hide(),a.trigger("hide"));
    i(b.page).show();
    b.trigger("show");
    f.end()
  };
  f.start=function(a){
    var b=j.location.hash,c=!1;!b&&a&&(b=a,c=!0);
    f.changePage(b,{hashchange:c})
  };
  f.doComplete=p;
  f.Model.extend=f.Controller.extend=function(a,b){
    var c=y(this,a,b);
    c.extend=this.extend;
    c.configure&&B(c);
    return c
  };
  f.extend=k;
  j.Istrap=j.I=f
})(window,window.Zepto||window.jQuery);

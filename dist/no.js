
/*
	A simplified version of Make.
 */
var cls, cmder, error, kit, launch, loadNofile, searchTasks, task, _;

if (process.env.NODE_ENV == null) {
  process.env.NODE_ENV = 'development';
}

kit = require('./kit');

cls = kit.require('colors/safe');

_ = kit._;

cmder = kit.requireOptional('commander', __dirname);

error = function(msg) {
  var err;
  err = new Error(msg);
  err.source = 'nokit';
  throw err;
};


/**
 * A simplified task wrapper for `kit.task`
 * @param  {String}   name
 * @param  {Array}    deps
 * @param  {String}   description
 * @param  {Boolean}  isSequential
 * @param  {Function} fn
 * @return {Promise}
 */

task = function() {
  var alias, aliasSym, args, depsInfo, helpInfo, sep;
  args = kit.defaultArgs(arguments, {
    name: {
      String: 'default'
    },
    deps: {
      Array: null
    },
    description: {
      String: ''
    },
    isSequential: {
      Boolean: null
    },
    fn: {
      Function: function() {}
    }
  });
  depsInfo = args.deps ? (sep = args.isSequential ? ' -> ' : ', ', cls.grey("deps: [" + (args.deps.join(sep)) + "]")) : '';
  sep = args.description ? ' ' : '';
  helpInfo = args.description + sep + depsInfo;
  alias = args.name.split(' ');
  aliasSym = '';
  return alias.forEach(function(name) {
    cmder.command(name).description(helpInfo);
    kit.task(name + aliasSym, args, function() {
      return args.fn(cmder);
    });
    aliasSym = '@'.magenta;
    return helpInfo = cls.cyan('-> ') + alias[0];
  });
};


/**
 * Load nofile.
 * @return {String} The path of found nofile.
 */

loadNofile = function() {
  var dir, exts, lang, path, paths, rdir, _i, _j, _len, _len1, _ref;
  if (process.env.nokitPreload) {
    _ref = process.env.nokitPreload.split(' ');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      lang = _ref[_i];
      try {
        require(lang);
      } catch (_error) {}
    }
  } else {
    try {
      require('coffee-cache');
    } catch (_error) {
      try {
        require('coffee-script/register');
      } catch (_error) {}
    }
  }
  exts = _(require.extensions).keys().filter(function(ext) {
    return ['.json', '.node', '.litcoffee', '.coffee.md'].indexOf(ext) === -1;
  });
  paths = kit.genModulePaths('nofile', process.cwd(), '').reduce(function(s, p) {
    return s.concat(exts.map(function(ext) {
      return p + ext;
    }).value());
  }, []);
  for (_j = 0, _len1 = paths.length; _j < _len1; _j++) {
    path = paths[_j];
    if (kit.existsSync(path)) {
      dir = kit.path.dirname(path);
      rdir = kit.path.relative('.', dir);
      if (rdir) {
        kit.log(cls.cyan('Change Working Direcoty: ') + cls.green(rdir));
      }
      process.chdir(dir);
      require(path)(task, cmder.option.bind(cmder));
      return path;
    }
  }
  return error('Cannot find nofile');
};

searchTasks = function() {
  var list;
  list = _.keys(kit.task.list);
  return _(cmder.args).map(function(cmd) {
    return kit.fuzzySearch(cmd, list);
  }).compact().value();
};

module.exports = launch = function() {
  var cwd, nofilePath, tasks;
  cwd = process.cwd();
  cmder.option('-v, --version', 'output version of nokit', function() {
    var info;
    info = kit.readJsonSync(__dirname + '/../package.json');
    console.log(cls.green("nokit@" + info.version), cls.grey("(" + (require.resolve('./kit')) + ")"));
    return process.exit();
  });
  nofilePath = loadNofile();
  cmder.usage('[options] [fuzzy_task_name]...' + cls.grey("  # " + (kit.path.relative(cwd, nofilePath))));
  if (!kit.task.list) {
    return;
  }
  cmder.parse(process.argv);
  if (cmder.args.length === 0) {
    if (kit.task.list['default']) {
      kit.task.run('default', {
        init: cmder
      });
    } else {
      cmder.outputHelp();
    }
    return;
  }
  tasks = searchTasks();
  if (tasks.length === 0) {
    error('No such tasks: ' + cmder.args);
  }
  return kit.task.run(tasks, {
    init: cmder,
    isSequential: true
  });
};

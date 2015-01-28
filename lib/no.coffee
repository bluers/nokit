###
	A simplified version of Make.
###

if not process.env.NODE_ENV?
	process.env.NODE_ENV = 'development'

kit = require './kit'
{ _ } = kit
cmder = kit.requireOptional 'commander'

loadNofile = ->
	try require 'coffee-script/register'

	paths = kit.genModulePaths('nofile', __dirname, '')[1..]
	for path in paths
		try
			return require path
		catch err
			if err.code != 'MODULE_NOT_FOUND'
				throw err

###*
 * A simplified task wrapper for `kit.task`
 * @param  {String}   name
 * @param  {Array}    deps
 * @param  {String}   description
 * @param  {Boolean}  isSequential
 * @param  {Function} fn
 * @return {Promise}
###
task = (name, deps, description, isSequential, fn) ->
	# Allowed option format:
	#
	# task name, fn
	# task name, description, fn
	# task name, deps, fn
	# task name, deps, description, fn
	if _.isFunction deps
		fn = deps
		deps = undefined
		description = ''
		isSequential = undefined
	else if _.isString(deps) and _.isFunction(description)
		fn = description
		description = deps
		deps = undefined
		isSequential = undefined
	else if _.isArray(deps) and _.isFunction(description)
		fn = description
		description = ''
		isSequential = undefined
	else if _.isArray(deps) and _.isString(description) and
	_.isFunction(isSequential)
		fn = isSequential
		isSequential = undefined

	argedFn = -> fn cmder

	cmder.command name
	.description description
	.action ->
		kit.task.run name, { init: cmder }

	kit.task name, { deps, description, isSequential }, argedFn

option = cmder.option.bind(cmder)

# Expose global helpers.
kit._.extend global, {
	_
	kit
	task
	option
	cmder
}

loadNofile()

cmder.parse process.argv

if cmder.args.length == 0
	kit.task.run? undefined, { init: cmder }
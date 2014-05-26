
all:
	@make npm
	@make test

npm:
	@npm install

test:
	@( [ -d node_modules ] || make npm )
	@( grunt test jshint )

jshint:
	@( [ -d node_modules ] || make npm )
	@( grunt jshint )

watch:
	@( grunt watchall )

docs:
	@( grunt jsdoc )

publish:
	@( npm publish ./ )

.PHONY:	npm
.PHONY:	test
.PHONY:	jshit
.PHONY:	watch
.PHONY:	publish

JSFILES=index.js lib/*.js test/*.js test/fixtures/*.js
TESTFILES=test/*.js
JSHINT=node_modules/.bin/jshint
MOCHA=node_modules/.bin/mocha

all:
	@make npm
	@make test

npm:
	@npm install

test:
	@( [ -d node_modules ] || make npm )
	@( $(MOCHA) $(TESTFILES) )

jshint:
	@( [ -d node_modules ] || make npm )
	@( $(JSHINT) --verbose --reporter node_modules/jshint-stylish/  $(JSFILES) )

watch:
	@( ./watcher.js )

edit:
	vi -O3 $(JSFILES)

.PHONY:	npm
.PHONY:	test
.PHONY:	jshint
.PHONY:	watch

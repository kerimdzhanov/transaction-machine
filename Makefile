BINS = ./node_modules/.bin

TESTS = test/*.spec.js \
	test/**.spec.js

test:
	@NODE_ENV=test $(BINS)/mocha $(TESTS)

test-cov:
	@NODE_ENV=test $(BINS)/istanbul cover $(BINS)/_mocha $(TESTS)

clean:
	rm -rf coverage

install link:
	@npm $@

.PHONY: test test-cov clean install link

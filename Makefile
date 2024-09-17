develop:
	npx webpack serve --allowed-hosts all

install:
	npm ci

build:
	NODE_ENV=production npx webpack

test:
	npm test

lint:
	npx eslint .

.PHONY: test
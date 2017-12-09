.PHONY: install run build test

include .env

check: ## Check dependencies
	@ command -v node > /dev/null 2>&1 || (echo "node is not available please install" && exit 1)
	@ command -v yarn > /dev/null 2>&1 || (echo "yarn is not available please install: npm i -g yarn" && exit 1)

install: check ## Install application
	@ cp -n .env.dist .env
	@ yarn --ignore-engines
	@ ./node_modules/.bin/selenium-standalone install

run: ## Run prod application
	@ NODE_ENV=production node public/index.js

dev: ## Run dev application
	@ rm -rf public && mkdir -p public
	@ NODE_ENV=development ./node_modules/.bin/pm2 start --watch src/ --no-daemon src/server/index.js --interpreter ./node_modules/.bin/babel-node & make watch

watch: ## Watch
	@ mkdir -p public
	@ ./node_modules/.bin/webpack --watch -d

build: ## Build with webpack
	@ rm -rf public && mkdir -p public
	@ NODE_ENV=production ./node_modules/.bin/babel --minified --no-comments --compact true -d public/ src/server
	@ NODE_ENV=production ./node_modules/.bin/webpack -p --progress --colors

start-selenium: ## Start Selenium
	@ ./node_modules/.bin/selenium-standalone start

test: ## Run tests
	@ NODE_ENV=test ./node_modules/.bin/mocha -t 99999999 --require babel-register --require babel-polyfill test/hook.js test/specs/*.spec.js

lint: ## Lint
	@ ./node_modules/.bin/eslint src/

lint-fix: ## Lint-fix
	@ ./node_modules/.bin/eslint --fix src/

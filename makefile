.PHONY: install run build test
.SILENT:

TOKEN := $$(cat $$TELEPRESENCE_ROOT/var/run/secrets/kubernetes.io/serviceaccount/token)
PORT := 4444

install: ## Install application
	@ command -v node > /dev/null 2>&1 || (echo "node is not available please install" && exit 1)
	@ command -v kubectl > /dev/null 2>&1 || (echo "kubectl is not available please install" && exit 1)
	@ npm install
	@ kubectl apply -f ethibox.yaml

uninstall:
	@ \rm -rf public node_modules

run: ## Run prod application
	@ TOKEN=$(TOKEN) NODE_ENV=production node public/index.js

dev: ## Run dev application
	@ command -v telepresence > /dev/null 2>&1 || (echo "telepresence is not available please install" && exit 1)
	@ test -n "$(TOKEN)" || (echo "Run dev application on kubernetes environement with Telepresence: make enter" && exit 1)
	@ \rm -rf public && mkdir -p public
	@ TOKEN=$(TOKEN) NODE_ENV=development ./node_modules/.bin/pm2 start --watch src/ --no-daemon src/server/index.js --interpreter ./node_modules/.bin/babel-node & make watch

watch: ## Watch
	@ mkdir -p public
	@ ./node_modules/.bin/webpack --watch -d

build: ## Build with webpack
	@ \rm -rf public && mkdir -p public
	@ NODE_ENV=production ./node_modules/.bin/babel --minified --no-comments --compact true -d public/ src/server
	@ NODE_ENV=production ./node_modules/.bin/webpack -p --progress --colors

start-selenium: ## Start Selenium
	@ ./node_modules/.bin/selenium-standalone install
	@ ./node_modules/.bin/selenium-standalone start

enter:
	@ command -v telepresence > /dev/null 2>&1 || (echo "telepresence is not available please install" && exit 1)
	@ command -v kubectl > /dev/null 2>&1 || (echo "kubectl is not available please install" && exit 1)
	@- kubectl --namespace kube-system delete deployment ethibox > /dev/null 2>&1
	@- kubectl --namespace kube-system delete service ethibox > /dev/null 2>&1
	@ telepresence --namespace kube-system --new-deployment ethibox --expose $(PORT) --run-shell

test: ## Run tests
	@ NODE_ENV=test ./node_modules/.bin/mocha -t 99999999 --require babel-register --require babel-polyfill test/hook.js test/specs/*.spec.js

lint: ## Lint
	@ ./node_modules/.bin/eslint src/

lint-fix: ## Lint-fix
	@ ./node_modules/.bin/eslint --fix src/

package-charts:
	@ command -v helm > /dev/null 2>&1 || (echo "helm is not available please install" && exit 1)
	@ helm package ./charts/charts/* -d ./charts/packages/
	@ helm repo index ./charts/packages/

deploy: build
	@ docker build -t ston3o/ethibox .
	@ docker push ston3o/ethibox

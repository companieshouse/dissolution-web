artifact_name       := dissolution-web
version             := "unversioned"

.PHONY: all
all: build

.PHONY: clean
clean:
	rm -f ./$(artifact_name)-*.zip
	rm -rf ./dist
	rm -rf ./build-*
	rm -f ./build.log

package-install:
	npm install

.PHONY: build
build:	package-install lint
	bash -l -c 'nvm use && npm run build'

.PHONY: lint
lint:
	npm run lint

.PHONY: test
test: test-unit

.PHONY: test-unit
test-unit:
	bash -l -c 'nvm use && npm run test:coverage'

.PHONY: security-check
security-check:
	bash -l -c 'nvm use && npm audit'

.PHONY: package
package: build
ifndef version
	$(error No version given. Aborting)
endif
	$(info Packaging version: $(version))
	$(eval tmpdir := $(shell mktemp -d build-XXXXXXXXXX))
	cp -r ./dist $(tmpdir)
	cp -r ./package.json $(tmpdir)
	cp -r ./package-lock.json $(tmpdir)
	cp ./start.sh $(tmpdir)
	cp ./routes.yaml $(tmpdir)
	cd $(tmpdir) && bash -l -c 'nvm use && npm install --production'
	rm $(tmpdir)/package.json $(tmpdir)/package-lock.json
	cd $(tmpdir) && zip -r ../$(artifact_name)-$(version).zip .
	rm -rf $(tmpdir)

.PHONY: sonar
sonar:
	bash -l -c 'nvm use && npm run analyse-code'


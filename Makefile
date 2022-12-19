.PHONY: build-RuntimeDependenciesLayer build-lambda-common

build-ConfigFunction:
	$(MAKE) HANDLER=src/handlers/config.mts build-lambda-common
build-ShopifySyncFunction:
	$(MAKE) HANDLER=src/handlers/shopify-sync.mts build-lambda-common
build-DiscordSnsFunction:
	$(MAKE) HANDLER=src/handlers/discord-sns.mts build-lambda-common
build-DiscordNotificationFunction:
	$(MAKE) HANDLER=src/handlers/discord-notification.mts build-lambda-common

build-lambda-common:
	npm install
	rm -rf dist
	echo "{\"extends\": \"./tsconfig.json\", \"include\": [\"${HANDLER}\"] }" > tsconfig-only-handler.json
	npm run build -- --build tsconfig-only-handler.json
	#renamer --find js --replace mjs './dist/**/*.js'
	cp -r dist "$(ARTIFACTS_DIR)/"

build-RuntimeDependenciesLayer:
	mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	cp package.json package-lock.json "$(ARTIFACTS_DIR)/nodejs/"
	npm install --production --prefix "$(ARTIFACTS_DIR)/nodejs/"
	rm "$(ARTIFACTS_DIR)/nodejs/package.json" # to avoid rebuilding when changes doesn't relate to dependencies



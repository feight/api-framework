
clean:
	@rm -rf dist
	@rm -f demo/api-framework.tgz

build:
	@make clean
	@tsc

local:
	@make build
	@npm pack | tail -n 1 | xargs -I "{}" mv {} demo/api-framework.tgz
	@cd demo && npm install api-framework.tgz --force
	@cd demo && npm run start

push:
	@make build
	@npm version prerelease --no-git-tag-version
	@npm publish

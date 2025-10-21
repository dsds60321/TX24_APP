# Repository Guidelines
- 소통은 항상 한국말로 진행한다.
- 계획을 짜고 개발자에게 동의를 받고 진행한다.

## Project Structure & Module Organization
- `src/` holds Java sources. Keep boot logic in `kr.tx24.fc.main` and MVC controllers in `kr.tx24.fc.ctl` so the component scan declared in `conf/server.json` stays tight.
- `webroot/` provides Thymeleaf views and static assets (`layout/` for fragments, `pages/` for production screens, `sample/` for demos). Match templates to the view names returned by controllers.
- `conf/` stores runtime JSON (`server.json`, `db.json`, `nlb.json`). Use it for environment overrides and keep credentials out of version control.
- `lib/` contains third-party and TX24 platform JARs, while `classes/` is the compiled output listed in `.classpath`. Do not commit binaries; clean `classes/` when switching branches.

## Build, Test, and Development Commands
- `javac -d classes -cp "lib/*" $(find src -name '*.java')` compiles the project against the bundled libraries with JDK 17 (see `.classpath`). Run it after dependency or API changes.
- `java -cp "classes:lib/*" kr.tx24.fc.main.Launcher` boots the embedded TX24 server using the host/port in `conf/server.json`. Hit `http://localhost:8080/example/thymeleaf` for a smoke check.
- Import the module via `.project` or `.iml` files. IDE run configs should launch `kr.tx24.fc.main.Launcher` with the repo root as the working directory.

## Coding Style & Naming Conventions
- Follow the existing tab-based indentation and K&R brace style in `src/kr/tx24/fc/main/Launcher.java`. Stay under roughly 120 characters per line.
- Classes use UpperCamelCase (`ExampleCtl`), members use lowerCamelCase, and request mappings mirror template names.
- Keep Spring annotations idiomatic (`@Controller`, `@GetMapping`) and place shared utilities under `kr.tx24.fc.*` to stay within the scan path.

## Testing Guidelines
- No automated suite is committed yet. Add JUnit 5 tests under a new `src-test/java` tree that mirrors package names, compiling with the same classpath, and run them through your IDE or a console runner.
- Until coverage exists, list manual verification steps (URL, expected view) in PRs, especially for Thymeleaf work.

## Commit & Pull Request Guidelines
- History currently shows one-word commits (`init`, `first commit`). Prefer imperative, descriptive subject lines (`feat: add dashboard widgets`) under 72 characters.
- Keep PRs focused, summarise config or UI impacts, attach screenshots for front-end changes, and call out new `lib/` binaries or `conf/` keys.

## Configuration Tips
- `conf/server.json` controls the application port, context path, and controller base package; adjust it when introducing new top-level packages.
- Database and infrastructure settings live in `conf/db.json` and `conf/nlb.json`. Pair changes to these files with environment notes so deployers can replicate the setup.

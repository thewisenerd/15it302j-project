css:
	sassc -m sass/app.scss public/css/app.css

css-watch:
	while true; do \
		make css; \
		inotifywait -qre close_write sass/; \
	done

test:
	@mysql -u $(shell bin/getenv DB_USER) -p$(shell bin/getenv DB_PASS) < writr.sql
	-ate tests/
	find reports/tests/ -type f | sort | tail -n 1 | xargs xdg-open

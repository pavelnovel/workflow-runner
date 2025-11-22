.PHONY: test smoke

test:
	pytest

smoke:
	scripts/smoke.sh


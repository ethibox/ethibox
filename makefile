.PHONY: enter package
.SILENT:

enter:
	@ command -v telepresence > /dev/null 2>&1 || (echo "telepresence is not available please install" && exit 1)
	@ command -v kubectl > /dev/null 2>&1 || (echo "kubectl is not available please install" && exit 1)
	@- kubectl --namespace kube-system delete deployment ethibox > /dev/null 2>&1
	@- kubectl --namespace kube-system delete service ethibox > /dev/null 2>&1
	@ telepresence --namespace kube-system --new-deployment ethibox --expose 4444 --run-shell

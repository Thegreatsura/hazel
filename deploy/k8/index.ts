import * as k8s from "@pulumi/kubernetes"
import * as hkh from "@spigell/hcloud-kube-hetzner"

const clusterName = "hazel-cluster"

const cluster = new hkh.Cluster(clusterName, {
	config: {
		Nodepools: {
			Servers: [
				{
					Config: {
						Server: {
							ServerType: "cx22",
							Location: "fsn1",
						},
					},
					PoolID: "servers",
					Nodes: [{ NodeID: "server-01" }],
				},
			],
		},
	},
})

const k8sProvider = new k8s.Provider("hkh-k8s-provider", {
	kubeconfig: cluster.kubeconfig as any,
})

const zeroCacheReleaseName = "zero-cache-instance"
const zeroCacheNamespaceName = "zero-cache-ns"
const zeroCacheChartVersion = "0.21.2025052000"

const appNamespace = new k8s.core.v1.Namespace(
	zeroCacheNamespaceName,
	{
		metadata: { name: zeroCacheNamespaceName },
	},
	{ provider: k8sProvider },
)

const zeroCacheChart = new k8s.helm.v3.Chart(
	zeroCacheReleaseName,
	{
		chart: "oci://ghcr.io/synapdeck/zero-cache-chart/zero-cache",
		version: zeroCacheChartVersion,
		namespace: appNamespace.metadata.name,
		values: {
			replicaCount: 1,

			common: {
				auth: {
					jwksUrl: {
						value: "https://modest-scorpion-78.clerk.accounts.dev/.well-known/jwks.json",
					},
				},
				database: {
					upstream: {
						url: {
							value: "postgresql://postgres:mkwqhcfdnqdelwn1@142.132.228.194:6992/zero",
						},
					},
				},
			},
			singleNode: {
				enabled: true,
			},

			config: {
				logLevel: "info",
			},
			service: {
				type: "ClusterIP",
				port: 80,
			},
		},
	},
	{
		provider: k8sProvider,
		dependsOn: [appNamespace],
	},
)

export const phkh = {
	[clusterName]: {
		kubeconfig: cluster.kubeconfig,
		servers: cluster.servers,
		privatekey: cluster.privatekey,
	},
}

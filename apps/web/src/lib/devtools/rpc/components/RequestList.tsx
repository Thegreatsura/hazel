import { formatDistanceToNow } from "date-fns"
import type { CapturedRequest } from "../types"

interface RequestListProps {
	requests: CapturedRequest[]
	selectedId: string | null
	onSelect: (id: string | null) => void
}

export function RequestList({ requests, selectedId, onSelect }: RequestListProps) {
	if (requests.length === 0) {
		return (
			<div className="flex flex-1 items-center justify-center text-gray-500 text-sm">
				No RPC requests captured yet
			</div>
		)
	}

	return (
		<div className="flex-1 overflow-auto">
			<table className="w-full text-sm">
				<thead className="sticky top-0 bg-gray-800 text-left text-gray-400">
					<tr>
						<th className="px-3 py-2 font-medium">Method</th>
						<th className="w-20 px-3 py-2 font-medium">Status</th>
						<th className="w-20 px-3 py-2 text-right font-medium">Time</th>
						<th className="w-24 px-3 py-2 text-right font-medium">When</th>
					</tr>
				</thead>
				<tbody>
					{requests.map((request) => (
						<tr
							key={request.captureId}
							onClick={() =>
								onSelect(selectedId === request.captureId ? null : request.captureId)
							}
							className={`cursor-pointer border-gray-700 border-b transition-colors hover:bg-gray-700/50 ${selectedId === request.captureId ? "bg-gray-700" : ""}`}
						>
							<td className="px-3 py-2">
								<code className="text-blue-400">{request.method}</code>
								<MethodTypeBadge method={request.method} />
							</td>
							<td className="px-3 py-2">
								<StatusBadge request={request} />
							</td>
							<td className="px-3 py-2 text-right text-gray-400 tabular-nums">
								{request.response?.duration != null
									? `${request.response.duration}ms`
									: "..."}
							</td>
							<td className="px-3 py-2 text-right text-gray-500 text-xs">
								{formatDistanceToNow(request.timestamp, { addSuffix: true })}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

function StatusBadge({ request }: { request: CapturedRequest }) {
	if (!request.response) {
		return (
			<span className="inline-flex items-center gap-1 rounded bg-yellow-500/20 px-2 py-0.5 font-medium text-xs text-yellow-400">
				<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
				pending
			</span>
		)
	}

	if (request.response.status === "success") {
		return (
			<span className="inline-flex items-center gap-1 rounded bg-green-500/20 px-2 py-0.5 font-medium text-green-400 text-xs">
				<span className="h-1.5 w-1.5 rounded-full bg-green-400" />
				success
			</span>
		)
	}

	return (
		<span className="inline-flex items-center gap-1 rounded bg-red-500/20 px-2 py-0.5 font-medium text-red-400 text-xs">
			<span className="h-1.5 w-1.5 rounded-full bg-red-400" />
			error
		</span>
	)
}

function getMethodType(method: string): "mutation" | "query" {
	const mutationVerbs = ["create", "update", "delete", "remove", "post", "put", "patch"]
	const methodParts = method.split(".")
	const action = methodParts[methodParts.length - 1]
	return mutationVerbs.includes(action!) ? "mutation" : "query"
}

function MethodTypeBadge({ method }: { method: string }) {
	const type = getMethodType(method)
	if (type === "mutation") {
		return (
			<span className="ml-2 rounded bg-purple-500/20 px-1.5 py-0.5 font-medium text-[10px] text-purple-400">
				mutation
			</span>
		)
	}
	return (
		<span className="ml-2 rounded bg-cyan-500/20 px-1.5 py-0.5 font-medium text-[10px] text-cyan-400">
			query
		</span>
	)
}

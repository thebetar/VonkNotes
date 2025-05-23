import { createSignal, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import FolderSvg from '../assets/svg/used/folder.svg';
import EyeSvg from '../assets/svg/used/eye.svg';

// Helper to build a tree from flat tags
function buildTagTree(tags) {
	const map = {};
	const roots = [];

	tags.forEach(tag => {
		map[tag.id] = { ...tag, children: [] };
	});

	tags.forEach(tag => {
		if (tag.parent_id) {
			map[tag.parent_id]?.children.push(map[tag.id]);
		} else {
			roots.push(map[tag.id]);
		}
	});

	return roots;
}

function TagsPage() {
	const [tags, setTags] = createSignal([]);
	const [editTag, setEditTag] = createSignal(null);
	const [tree, setTree] = createSignal([]);
	const [selectedPath, setSelectedPath] = createSignal([]); // Array of tag ids
	const [showParentPopup, setShowParentPopup] = createSignal(false);
	const navigate = useNavigate();

	async function fetchTags() {
		const response = await fetch(`${window.location.origin}/api/tags.php`);
		if (!response.ok) return;
		const data = await response.json();
		if (!data || !data.tags) {
			return;
		}

		setTags(data.tags);
		setTree(buildTagTree(data.tags));
	}

	onMount(() => {
		fetchTags();
	});

	// Get tags at a given path depth
	function getTagsAtLevel(level) {
		let nodes = tree();

		for (let i = 0; i < level; i++) {
			const id = selectedPath()[i];

			const found = nodes.find(t => t.id === id);

			if (!found) {
				return [];
			}
			nodes = found.children;
		}

		return nodes;
	}

	// Handle tag click (navigate deeper)
	function handleTagClick(tag, level) {
		if (tag.children.length === 0) {
			setSelectedPath(selectedPath().slice(0, level));
			return;
		}

		setSelectedPath([...selectedPath().slice(0, level), tag.id]);
	}

	// Handle folder click (change parent)
	function handleFolderClick(tag) {
		setEditTag(tag);
		setShowParentPopup(true);
	}

	// Assign new parent to tag
	async function assignParent(newParentId) {
		const tag = editTag();
		await fetch(`${window.location.origin}/api/tags.php`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				tagId: tag.id,
				name: tag.name,
				parentId: newParentId,
			}),
		});

		setShowParentPopup(false);
		setEditTag(null);

		await fetchTags();
	}

	// Render columns for each level in the path
	function renderColumns() {
		const columns = [];

		for (let level = 0; ; level++) {
			const tagsAtLevel = getTagsAtLevel(level);

			if (!tagsAtLevel.length) {
				break;
			}

			// Find how many columns are in the next level
			const nextLevelTags = getTagsAtLevel(level + 1);

			columns.push(
				<ul
					class={`lg:w-80 w-screen border-r border-zinc-700 max-h-screen overflow-auto min-w-3xs lg:block ${
						nextLevelTags.length ? 'hidden' : 'block'
					}`}
				>
					{tagsAtLevel.map(tag => (
						<li
							key={tag.id}
							class={`relative group h-20 flex items-center justify-between px-2 py-3 border-b border-zinc-700 hover:bg-zinc-700 cursor-pointer transition-colors ${
								selectedPath()[level] === tag.id ? 'bg-zinc-700/60' : ''
							}`}
							onClick={() => handleTagClick(tag, level)}
						>
							<span class="text-base flex flex-col items-start justify-center gap-1">
								<span>{tag.name}</span>

								<span class="min-w-[2.5em] text-xs rounded-full text-zinc-200 text-center">
									{tag.note_count} notes, {tag.children.length} children
								</span>
							</span>
							<div class="flex gap-1 items-center">
								{/* Eye icon to view notes for this tag */}
								<div
									class="p-2 rounded-full hover:bg-zinc-600/50 cursor-pointer transition-colors"
									onClick={e => {
										e.stopPropagation();
										navigate(`/notes/tag/${tag.id}`);
									}}
									title="View notes with this tag"
								>
									<img src={EyeSvg} class="w-4 h-4" alt="View" />
								</div>
								{/* Folder icon to change parent */}
								<div
									class="p-2 rounded-full hover:bg-zinc-600/50 cursor-pointer transition-colors"
									onClick={e => {
										e.stopPropagation();
										handleFolderClick(tag);
									}}
									title="Change parent tag"
								>
									<img src={FolderSvg} class="w-4 h-4" alt="Folder" />
								</div>
							</div>
						</li>
					))}
				</ul>,
			);

			const selected = tagsAtLevel.find(t => t.id === selectedPath()[level]);

			if (!selected) {
				break;
			}
		}
		return columns;
	}

	// Popup for selecting parent tag
	function ParentPopup() {
		const allTags = tags();
		return (
			<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
				<div class="bg-zinc-900 p-6 rounded shadow-lg min-w-[20rem]">
					<h2 class="mb-4 text-lg font-bold">Select Parent Tag</h2>
					<ul class="max-h-60 overflow-y-auto">
						<li>
							<button
								class="w-full text-left px-2 py-1 hover:bg-zinc-700 rounded"
								onClick={() => assignParent(null)}
							>
								Root (no parent)
							</button>
						</li>
						{allTags
							.filter(t => t.id !== editTag()?.id)
							.map(tag => (
								<li key={tag.id}>
									<button
										class="w-full text-left px-2 py-1 hover:bg-zinc-700 rounded"
										onClick={() => assignParent(tag.id)}
									>
										{tag.name}
									</button>
								</li>
							))}
					</ul>
					<div class="mt-4 flex justify-end">
						<button class="px-3 py-1 bg-zinc-700 rounded" onClick={() => setShowParentPopup(false)}>
							Cancel
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div class="relative flex h-full lg:min-h-screen min-h-[100vh-56px] lg:max-h-none max-h-[calc(100vh-56px)]">
			{renderColumns()}
			{showParentPopup() && <ParentPopup />}
			{selectedPath().length > 0 && (
				<button
					class="lg:hidden underline block absolute bottom-4 left-2 right-2"
					onClick={() => setSelectedPath(selectedPath().slice(0, -1))}
				>
					Go to parent
				</button>
			)}
		</div>
	);
}

export default TagsPage;

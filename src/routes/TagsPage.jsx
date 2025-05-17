import { createSignal, onMount } from 'solid-js';

import FolderSvg from '../assets/svg/used/folder.svg';

function TagsPage() {
	const [tags, setTags] = createSignal([]);

	async function fetchTags(selected = null) {
		const response = await fetch('/api/tags.php');

		if (!response.ok) {
			return;
		}

		const data = await response.json();

		if (!data || !data.tags) {
			return;
		}

		// Remove file extension from names
		const tags = data.tags;

		setTags(tags);
	}

	onMount(() => {
		fetchTags();
	});

	return (
		<div class="flex h-full min-h-screen">
			{tags().length > 0 ? (
				<ul class="w-80">
					{tags().map(tag => (
						<li
							key={tag}
							class="relative group h-12 flex items-center justify-between px-2 py-3 border-b border-zinc-700 cursor-pointer transition-colors"
						>
							<span class="text-base">{tag.name}</span>

							<div className="p-2 rounded-full hover:bg-zinc-700/50 cursor-pointer">
								<img src={FolderSvg} class="w-4 h-4" alt="Folder" />
							</div>
						</li>
					))}
				</ul>
			) : (
				<div class="flex items-center justify-center w-full h-full">
					<p>No tags found.</p>
				</div>
			)}
		</div>
	);
}

export default TagsPage;

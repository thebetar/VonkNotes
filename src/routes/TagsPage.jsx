import { createSignal, onMount } from 'solid-js';

import TagSvg from '../assets/svg/used/tag.svg';
import XMarkSvg from '../assets/svg/used/xmark.svg';

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
				<ul class="flex flex-col gap-2 p-4">
					{tags().map(tag => (
						<li
							key={tag}
							class="bg-zinc-600 text-white px-2 py-1 rounded flex items-center gap-x-1 hover:bg-zinc-500 transition-colors cursor-default"
						>
							<img src={TagSvg} class="w-[14px] h-[14px]" alt="Tag" />
							<span class="text-base">{tag.name}</span>
							<button
								class="p-1 rounded-full hover:bg-red-700/50 cursor-pointer"
								title="Delete tag"
								onClick={e => {
									e.stopPropagation();
									removeTag(tag.id);
								}}
							>
								<img src={XMarkSvg} class="w-3 h-3" />
							</button>
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

import { createSignal, onMount, useContext } from 'solid-js';

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
						<li key={tag} class="p-2 bg-gray-200 rounded-md">
							{tag}
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

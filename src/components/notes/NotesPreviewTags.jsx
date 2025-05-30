import { createSignal, createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';

import { useNotes } from '../../services/notes';
import { useTags } from '../../services/tags';

import TagSvg from '../../assets/svg/used/tag.svg';
import XMarkSvg from '../../assets/svg/used/xmark.svg';

export default function NotesPreviewTags() {
	const notesStore = useNotes();
	const tagsStore = useTags();
	let tagInputElement;

	const navigate = useNavigate();

	const [loading, setLoading] = createSignal(false);
	const [tagInput, setTagInput] = createSignal('');
	const [filteredTags, setFilteredTags] = createSignal([]);
	const [highlightedTag, setHighlightedTag] = createSignal(null);

	async function addTag() {
		setLoading(true);

		const newTag = (highlightedTag() || tagInput()).trim();

		if (!newTag) {
			return;
		}

		const currentNote = notesStore.currentNote();

		const response = await fetch(`${window.location.origin}/api/tags.php`, {
			method: 'POST',
			body: JSON.stringify({
				name: newTag,
				noteId: currentNote.id,
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const error = await response.json();
			alert(`Error adding tag: ${error.message}`);
			setLoading(false);
			return;
		}

		const data = await response.json();

		currentNote.tags = [
			...currentNote.tags,
			{
				id: data.id,
				name: newTag,
			},
		];
		setTagInput('');

		await notesStore.fetch();
		await tagsStore.fetch();

		setFilteredTags(Array.from(new Set([...filteredTags(), newTag])));
		setHighlightedTag(null);

		setLoading(false);

		// Target the input element and focus it
		tagInputElement.focus();
	}

	async function removeTag(tagId) {
		setLoading(true);

		const currentNote = notesStore.currentNote();

		await fetch(`${window.location.origin}/api/tags.php`, {
			method: 'DELETE',
			body: JSON.stringify({
				tagId,
				noteId: currentNote.id,
			}),
			headers: { 'Content-Type': 'application/json' },
		});

		currentNote.tags = currentNote.tags.filter(t => t.id !== tagId);
		setTagInput('');

		await notesStore.fetch();
		await tagsStore.fetch();

		setFilteredTags(filteredTags().filter(t => t.id !== tagId));
		setHighlightedTag(null);

		setLoading(false);
	}

	function handleTagInput(e) {
		e.preventDefault();
		e.stopPropagation();

		// Only allow alphanumeric characters, underscores, and hyphens
		if (!/^[a-zA-Z0-9_\-/]*$/.test(e.data) && e.data !== null) {
			const newValue = tagInput().replace(e.data, '');

			setTagInput(newValue);
			e.target.value = newValue;
			return;
		}

		setTagInput(e.target.value);
	}

	function handleTagHighlight(e) {
		if (e?.key !== 'ArrowDown') {
			return;
		}

		if (tagInput().length > 0 && filteredTags().length > 0) {
			if (handleTagHighlight() === null) {
				setHighlightedTag(filteredTags()[0]);
			}

			const currentIndex = filteredTags().indexOf(highlightedTag());
			const nextTag = filteredTags()[currentIndex + 1];

			if (nextTag) {
				setHighlightedTag(nextTag);
			} else {
				setHighlightedTag(filteredTags()[0]);
			}
		}
	}

	function getFullTagName(tag) {
		let tagName = tag.name;
		let tagParentId = tag.parent_id;

		while (tagParentId) {
			const parentTag = tagsStore.tags().find(t => t.id === tagParentId);

			if (parentTag) {
				tagName = `${parentTag.name}/${tagName}`;
				tagParentId = parentTag.parent_id;
			} else {
				break;
			}
		}

		return tagName;
	}

	function renderTag(tag) {
		return (
			<div
				class="bg-zinc-600 text-white px-2 py-1 rounded flex items-center gap-x-1 hover:bg-zinc-500 transition-colors cursor-default"
				onClick={() => navigate(`/notes/tag/${tag.id}`)}
			>
				<img src={TagSvg} class="w-[14px] h-[14px]" alt="Tag" />
				<span class="text-base">{getFullTagName(tag)}</span>
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
			</div>
		);
	}

	createEffect(() => {
		if (!tagInput()) {
			return;
		}

		setHighlightedTag(null);
		const filtered = tagsStore
			.tags()
			.filter(tag => getFullTagName(tag).toLowerCase().includes(tagInput().toLowerCase()));
		setFilteredTags(filtered.map(tag => getFullTagName(tag)));
	});

	return (
		<div class="mb-4 flex flex-wrap items-center gap-2">
			{!loading() && notesStore.currentNote().tags.map(renderTag)}

			<form
				onSubmit={e => {
					e.preventDefault();
					addTag();
				}}
				class="relative"
			>
				<input
					ref={tagInputElement}
					class={`px-2 py-1 focus:bg-zinc-700 focus:outline-none text-base w-[200px] ${
						tagInput().length > 0 ? 'rounded-t-md' : 'rounded-md'
					}`}
					placeholder="Add tag"
					value={tagInput()}
					onInput={handleTagInput}
					onKeyDown={handleTagHighlight}
				/>

				{tagInput().length > 0 && filteredTags().length > 0 && (
					<ul class="absolute bg-zinc-800 border border-zinc-700 rounded-b-md max-h-40 overflow-y-auto w-full">
						{filteredTags()
							.slice(0, 5)
							.map(tag => (
								<li
									class={`px-2 py-1 hover:bg-zinc-700 cursor-pointer ${
										highlightedTag() === tag ? 'bg-zinc-700' : 'bg-zinc-800'
									}`}
									onClick={() => {
										addTag(tag);
									}}
								>
									{tag}
								</li>
							))}
					</ul>
				)}
			</form>
		</div>
	);
}

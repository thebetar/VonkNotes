import { marked } from 'marked';
import './MarkdownPreview.css';

function NotePreview(props) {
	return (
		<div class="flex-1 lg:p-4 p-2 overflow-y-auto">
			<div class="max-w-full">
				<div class="markdown-preview" innerHTML={marked.parse(props.content)} />
			</div>
		</div>
	);
}

export default NotePreview;

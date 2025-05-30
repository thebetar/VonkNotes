import { createSignal } from "solid-js";

const [tags, setTags] = createSignal([]);

export const useTags = () => ({
    get tags() {
        return tags;
    },
    setTags(newTags) {
        setTags(newTags);
    },
    add(tag) {
        setTags(prev => [...prev, tag]);
    },
    remove(tag) {
        setTags(prev => prev.filter(t => t !== tag));
    },
    clear() {
        setTags([]);
    },
    async fetch() {
        try {
            const response = await fetch(`${window.location.origin}/api/tags.php`);

            if (!response.ok) {
                return false;
            }

            const data = await response.json();

            if (!data || !data.tags) {
                console.error('No tags found');
                return false;
            }

            setTags(data.tags);

            return true;
        } catch (error) {
            console.error('Error fetching tags:', error);
            return false;
        }
    },
    getFullTagName(tagId) {
        const tag = this.tags().find(t => t.id === tagId);

        if (!tag) {
            return '';
        }

        let tagName = tag.name;
        let tagParentId = tag.parent_id;

        while (tagParentId) {
            const parentTag = this.tags().find(t => t.id === tagParentId);

            if (parentTag) {
                tagName = `${parentTag.name}/${tagName}`;
                tagParentId = parentTag.parent_id;
            } else {
                break;
            }
        }

        if (tagName.length > 30) {
            return `.../${tag.name}`;
        }

        return tagName;
    }
})
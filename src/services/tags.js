import { createSignal } from "solid-js";

const [tags, setTags] = createSignal([]);

export const useTags = () => ({
    get tags() {
        return tags();
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
})
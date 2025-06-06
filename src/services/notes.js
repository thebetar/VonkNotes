import { createSignal } from "solid-js";

const [notes, setNotes] = createSignal([]);
const [currentNote, setCurrentNote] = createSignal(null);

const notesStore = {
    get notes() {
        return notes;
    },
    setNotes(newNotes) {
        setNotes(newNotes);
    },
    get currentNote() {
        return currentNote;
    },
    setCurrentNote(note) {
        setCurrentNote(note);
    },
    add(note) {
        setNotes(prev => [...prev, note]);
    },
    remove(note) {
        setNotes(prev => prev.filter(n => n !== note));
    },
    clear() {
        setNotes([]);
    },
    async fetch() {
        try {
            const response = await fetch(`${window.location.origin}/api/notes.php`);
            if (!response.ok) {
                return false;
            }
            const data = await response.json();

            if (!data || !data.notes) {
                console.error('No notes found');
                return false;
            }

            setNotes(data.notes);

            if (this.currentNote() !== null) {
                const foundNote = data.notes.find(n => n.id === this.currentNote().id);

                if (foundNote) {
                    this.setCurrentNote(foundNote);
                } else {
                    this.setCurrentNote(null);
                }
            }

            return true;
        } catch (error) {
            console.error('Error fetching notes:', error);
            return false;
        }
    },
};

export const useNotes = () => notesStore;
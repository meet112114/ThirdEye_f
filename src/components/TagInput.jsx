import { useState } from 'react';
import { getTagColor, SUGGESTED_TAGS } from '../utils/dateUtils';
import { X } from 'lucide-react';

export default function TagInput({ tags, onChange }) {
    const [inputVal, setInputVal] = useState('');

    const addTag = (tag) => {
        const cleaned = tag.trim().toLowerCase().replace(/\s+/g, '-');
        if (cleaned && !tags.includes(cleaned)) {
            onChange([...tags, cleaned]);
        }
        setInputVal('');
    };

    const removeTag = (tag) => {
        onChange(tags.filter((t) => t !== tag));
    };

    const handleKeyDown = (e) => {
        if (['Enter', ',', 'Tab'].includes(e.key)) {
            e.preventDefault();
            if (inputVal.trim()) addTag(inputVal);
        }
        if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    const availableSuggestions = SUGGESTED_TAGS.filter((s) => !tags.includes(s));

    return (
        <div>
            <div className="tag-input-wrap" onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
                {tags.map((tag) => (
                    <span key={tag} className={`tag-chip-removable`}>
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                            <X size={11} />
                        </button>
                    </span>
                ))}
                <input
                    className="tag-input-field"
                    type="text"
                    placeholder={tags.length === 0 ? 'Type tag & press Enter…' : ''}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => { if (inputVal.trim()) addTag(inputVal); }}
                />
            </div>
            {availableSuggestions.length > 0 && (
                <div className="tag-suggestions">
                    {availableSuggestions.map((s) => (
                        <button
                            key={s}
                            type="button"
                            className="tag-suggestion-chip"
                            onClick={() => addTag(s)}
                        >
                            + {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

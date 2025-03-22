import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    TextField,
    Paper,
    Typography,
    Chip,
    IconButton,
    Stack,
    Tooltip,
    Divider,
} from '@mui/material';
import {
    Save,
    Add as AddIcon,
    Code,
    FormatBold,
    FormatItalic,
    FormatListBulleted,
    FormatListNumbered,
    FormatQuote,
    TableChart,
    Link,
    Image,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { Note } from '../../types/note';

interface NoteEditorProps {
    note?: Note;
    onSave: (note: Partial<Note>) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
    note,
    onSave,
}) => {
    const [title, setTitle] = useState(note?.title || '');
    const [content, setContent] = useState(note?.content || '');
    const [tags, setTags] = useState<string[]>(note?.tags || []);
    const [newTag, setNewTag] = useState('');
    const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

    const handleAutoSave = useCallback(() => {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        const timeout = setTimeout(() => {
            onSave({
                title,
                content,
                tags,
            });
        }, 1000);
        setSaveTimeout(timeout);
    }, [title, content, tags, onSave]);

    useEffect(() => {
        handleAutoSave();
        return () => {
            if (saveTimeout) {
                clearTimeout(saveTimeout);
            }
        };
    }, [title, content, tags, handleAutoSave]);

    const handleAddTag = () => {
        if (newTag && !tags.includes(newTag)) {
            setTags([...tags, newTag]);
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const insertMarkdown = (markdown: string) => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = content.substring(start, end);
            const newContent = content.substring(0, start) + markdown + selectedText + content.substring(end);
            setContent(newContent);
            // Focus back on textarea after a short delay
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + markdown.length, end + markdown.length);
            }, 0);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextField
                    fullWidth
                    label="Titre"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </Box>

            <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                    label="Nouveau tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    sx={{ mr: 1 }}
                />
                <IconButton onClick={handleAddTag} color="primary">
                    <AddIcon />
                </IconButton>
            </Box>

            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                {tags.map((tag) => (
                    <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                    />
                ))}
            </Stack>

            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Tooltip title="Gras (Ctrl+B)">
                    <IconButton onClick={() => insertMarkdown('**texte en gras**')}>
                        <FormatBold />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Italique (Ctrl+I)">
                    <IconButton onClick={() => insertMarkdown('*texte en italique*')}>
                        <FormatItalic />
                    </IconButton>
                </Tooltip>
                <Divider orientation="vertical" flexItem />
                <Tooltip title="Liste à puces">
                    <IconButton onClick={() => insertMarkdown('- Item\n- Item\n- Item')}>
                        <FormatListBulleted />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Liste numérotée">
                    <IconButton onClick={() => insertMarkdown('1. Premier\n2. Deuxième\n3. Troisième')}>
                        <FormatListNumbered />
                    </IconButton>
                </Tooltip>
                <Divider orientation="vertical" flexItem />
                <Tooltip title="Citation">
                    <IconButton onClick={() => insertMarkdown('> Citation')}>
                        <FormatQuote />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Code">
                    <IconButton onClick={() => insertMarkdown('```\ncode ici\n```')}>
                        <Code />
                    </IconButton>
                </Tooltip>
                <Divider orientation="vertical" flexItem />
                <Tooltip title="Tableau">
                    <IconButton onClick={() => insertMarkdown('| En-tête 1 | En-tête 2 |\n|-----------|-----------|\n| Cellule 1 | Cellule 2 |')}>
                        <TableChart />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Lien">
                    <IconButton onClick={() => insertMarkdown('[Texte du lien](url)')}>
                        <Link />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Image">
                    <IconButton onClick={() => insertMarkdown('![Texte alternatif](url_image)')}>
                        <Image />
                    </IconButton>
                </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                <Paper sx={{ flex: 1, p: 2, overflow: 'auto' }}>
                    <TextField
                        fullWidth
                        multiline
                        label="Contenu (Markdown)"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        sx={{ height: '100%' }}
                        onKeyDown={(e) => {
                            if (e.ctrlKey) {
                                switch (e.key) {
                                    case 'b':
                                        e.preventDefault();
                                        insertMarkdown('**texte en gras**');
                                        break;
                                    case 'i':
                                        e.preventDefault();
                                        insertMarkdown('*texte en italique*');
                                        break;
                                }
                            }
                        }}
                    />
                </Paper>
                <Paper sx={{ flex: 1, p: 2, overflow: 'auto' }}>
                    <Typography variant="h6" gutterBottom>
                        Aperçu
                    </Typography>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeHighlight]}
                    >
                        {content}
                    </ReactMarkdown>
                </Paper>
            </Box>
        </Box>
    );
}; 
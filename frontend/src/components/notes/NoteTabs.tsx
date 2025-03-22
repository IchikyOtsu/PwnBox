import React from 'react';
import { Tabs, Tab, Box, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Note } from '../../types/note';

interface NoteTabsProps {
    openNotes: Note[];
    activeNoteId: number | null;
    onNoteSelect: (note: Note) => void;
    onNoteClose: (noteId: number) => void;
}

export const NoteTabs: React.FC<NoteTabsProps> = ({
    openNotes,
    activeNoteId,
    onNoteSelect,
    onNoteClose,
}) => {
    if (openNotes.length === 0) return null;

    return (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
                value={activeNoteId}
                onChange={(_, newValue) => {
                    const note = openNotes.find(n => n.id === newValue);
                    if (note) onNoteSelect(note);
                }}
                variant="scrollable"
                scrollButtons="auto"
            >
                {openNotes.map((note) => (
                    <Tab
                        key={note.id}
                        value={note.id}
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {note.title}
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNoteClose(note.id);
                                    }}
                                    sx={{ ml: 1 }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        }
                    />
                ))}
            </Tabs>
        </Box>
    );
}; 